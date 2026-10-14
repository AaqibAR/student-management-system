// Test-only Spring API fixture. Never use this as an application backend.
import http from "node:http";
import { createHmac } from "node:crypto";

const port = Number(process.env.AUTH_TEST_BACKEND_PORT ?? 8181);
const secret = "test-fixture-key-never-use-in-production";
const accounts = new Map([
  ["viewer@example.test", { id: 1, name: "Test Viewer", email: "viewer@example.test", role: "USER", password: "password123" }],
  ["admin@example.test", { id: 2, name: "Test Admin", email: "admin@example.test", role: "ADMIN", password: "password123" }],
  ["expiry@example.test", { id: 3, name: "Expiry Test", email: "expiry@example.test", role: "USER", password: "password123" }],
]);
let nextUser = 4;
let unavailable = false;
let students = [{ id: 1, studentNumber: "S001", firstName: "Test", lastName: "Student", email: "student@example.test", phone: null, createdAt: "2026-10-14T00:00:00Z" }];
let courses = [{ id: 1, courseCode: "CS101", name: "Computing", description: "Test course", credits: 3, createdAt: "2026-10-14T00:00:00Z" }];

function token(user, ttl = 900) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ sub: String(user.id), iss: "student-management", roles: [user.role], exp: Math.floor(Date.now() / 1000) + ttl })).toString("base64url");
  return `${header}.${body}.${createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url")}`;
}

function accountFromToken(value) {
  try {
    const [header, body, signature] = value.replace(/^Bearer /, "").split(".");
    if (createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url") !== signature) return null;
    const claims = JSON.parse(Buffer.from(body, "base64url"));
    if (claims.exp <= Date.now() / 1000) return null;
    const user = [...accounts.values()].find((candidate) => candidate.id === Number(claims.sub));
    return user ? { ...user, role: claims.roles[0] } : null;
  } catch { return null; }
}

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function json(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(status === 204 ? undefined : JSON.stringify(data));
}

const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  const method = request.method;
  let body = "";
  for await (const chunk of request) body += chunk;
  let input;
  try { input = body ? JSON.parse(body) : {}; } catch { return json(response, 400, { detail: "Malformed JSON" }); }
  if (path === "/__test/mode") { unavailable = !!input.unavailable; return json(response, 200, { unavailable }); }
  if (unavailable) return json(response, 503, { detail: "Test backend is unavailable" });
  if (path === "/api/auth/login" || path === "/api/auth/register") {
    if (method !== "POST") return json(response, 405, { detail: "Method not allowed" });
    if (typeof input.email !== "string" || typeof input.password !== "string") return json(response, 400, { detail: "Invalid fields" });
    const email = input.email.toLowerCase();
    if (email === "malformed@example.test") return json(response, 200, { tokenType: "Bearer", accessToken: "malformed" });
    const errors = {};
    if (!email.includes("@")) errors.email = "Enter a valid email address";
    if (Buffer.byteLength(input.password) > 72) errors.passwordWithinByteLimit = "Password must not exceed 72 UTF-8 bytes";
    if (path.endsWith("register") && (!input.name?.trim() || input.password.length < 8)) errors.name = "Enter valid account details";
    if (Object.keys(errors).length) return json(response, 400, { detail: "Check the fields and enter valid values.", errors });
    if (path.endsWith("register")) {
      if (accounts.has(email)) return json(response, 409, { detail: "Email is already registered" });
      accounts.set(email, { id: nextUser++, name: input.name.trim(), email, password: input.password, role: "USER" });
    }
    const user = accounts.get(email);
    if (!user || user.password !== input.password) return json(response, 401, { detail: "Invalid email or password" });
    const expiresIn = email === "expiry@example.test" ? 2 : 900;
    return json(response, path.endsWith("register") ? 201 : 200, { accessToken: token(user, expiresIn), tokenType: "Bearer", expiresIn, user: { ...safeUser(user), passwordHash: "unexpected-test-field-must-be-filtered" } });
  }
  const user = accountFromToken(request.headers.authorization ?? "");
  if (!user) return json(response, 401, { detail: "Please sign in with a valid access token." });
  if (path === "/api/auth/me") return json(response, 200, { ...safeUser(user), passwordHash: "unexpected-test-field-must-be-filtered" });
  const match = /^\/api\/(students|courses)(?:\/(\d+))?$/.exec(path);
  if (!match) return json(response, 404, { detail: "Not found" });
  const [, collection, id] = match;
  const records = collection === "students" ? students : courses;
  if (method !== "GET" && user.role !== "ADMIN") return json(response, 403, { detail: "You do not have permission to perform this action." });
  if (method === "GET") {
    const data = id ? records.find((row) => row.id === Number(id)) : records;
    return json(response, data ? 200 : 404, data ?? { detail: "Record not found" });
  }
  if (method === "POST") {
    const record = { ...input, id: Math.max(0, ...records.map((row) => row.id)) + 1, createdAt: new Date().toISOString() };
    records.push(record);
    return json(response, 201, record);
  }
  const index = records.findIndex((row) => row.id === Number(id));
  if (index < 0) return json(response, 404, { detail: "Record not found" });
  if (method === "PUT") { records[index] = { ...records[index], ...input }; return json(response, 200, records[index]); }
  if (method === "DELETE") { records.splice(index, 1); return json(response, 204); }
  return json(response, 405, { detail: "Method not allowed" });
});

server.listen(port, "127.0.0.1", () => console.log(`Test-only auth backend listening on ${port}`));
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
