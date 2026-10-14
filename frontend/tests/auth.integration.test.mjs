// Black-box checks against a Next server using mock-auth-backend.mjs, not Supabase.
import test from "node:test";
import assert from "node:assert/strict";

const base = process.env.AUTH_TEST_APP_URL ?? "http://localhost:3030";
const mock = process.env.AUTH_TEST_BACKEND_URL ?? "http://127.0.0.1:8181";

async function request(path, { method = "GET", body, cookie, origin = base, extra = {} } = {}) {
  return fetch(`${base}${path}`, {
    method, redirect: "manual",
    headers: { ...(method !== "GET" && origin ? { Origin: origin } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function login(email = "viewer@example.test") {
  const response = await request("/api/auth/login", { method: "POST", body: { email, password: "password123" } });
  assert.equal(response.status, 200);
  return { cookie: response.headers.get("set-cookie").split(";")[0], response, session: await response.json() };
}

test("anonymous workspace pages redirect and data endpoints reject requests", async () => {
  for (const path of ["/dashboard", "/students", "/courses"]) {
    const response = await request(path);
    // Streaming server redirects use the redirect marker in a 200 body.
    const html = await response.text();
    assert.ok(response.headers.get("location")?.includes("/login") || html.includes('NEXT_REDIRECT;replace;/login;'));
    assert.ok(!html.includes("You have view access."));
  }
  assert.equal((await request("/api/data/students")).status, 401);
  assert.equal((await request("/api/auth/session")).status, 401);
});

test("login keeps the JWT in an HttpOnly cookie and returns only safe session fields", async () => {
  const { response, session } = await login();
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Max-Age=\d+/i);
  assert.equal(session.user.role, "USER");
  assert.equal(session.accessToken, undefined);
  assert.equal(session.user.passwordHash, undefined);
  assert.ok(session.expiresAt > Date.now());
});

test("registration assigns USER and duplicate addresses return a helpful error", async () => {
  const body = { name: "New Account", email: `new-${Date.now()}@example.test`, password: "password123", role: "ADMIN" };
  const response = await request("/api/auth/register", { method: "POST", body });
  assert.equal(response.status, 201);
  const session = await response.json();
  assert.equal(session.user.role, "USER");
  assert.equal(session.accessToken, undefined);
  const duplicate = await request("/api/auth/register", { method: "POST", body });
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).detail, "Email is already registered");
});

test("login and registration failures preserve status and field messages", async () => {
  const badLogin = await request("/api/auth/login", { method: "POST", body: { email: "viewer@example.test", password: "wrong-password" } });
  assert.equal(badLogin.status, 401);
  assert.equal((await badLogin.json()).detail, "Invalid email or password");
  const badRegister = await request("/api/auth/register", { method: "POST", body: { name: " ", email: "not-an-email", password: "short" } });
  assert.equal(badRegister.status, 400);
  assert.ok((await badRegister.json()).errors.email);
  const unicode = await request("/api/auth/register", { method: "POST", body: { name: "Test", email: "unicode@example.test", password: "é".repeat(37) } });
  assert.equal(unicode.status, 400);
  assert.ok((await unicode.json()).errors.passwordWithinByteLimit);
  assert.equal((await request("/api/auth/login", { method: "POST", body: { email: "malformed@example.test", password: "password123" } })).status, 502);
});

test("mutating routes reject foreign or missing Origin headers", async () => {
  const { cookie } = await login("admin@example.test");
  for (const origin of ["http://untrusted.example", null]) {
    for (const path of ["/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/data/students"]) {
      assert.equal((await request(path, { method: "POST", cookie, origin, body: { email: "viewer@example.test", password: "password123" } })).status, 403);
    }
  }
  assert.equal((await request("/api/auth/logout", { method: "POST", cookie, extra: { "Sec-Fetch-Site": "cross-site" } })).status, 403);
});

test("proxy rejects arbitrary paths and unsupported collection methods", async () => {
  const { cookie } = await login();
  for (const path of ["/api/data/auth/me", "/api/data/students/not-an-id", "/api/data/courses/0", "/api/data/students/1/other", "/api/data/actuator/health"]) {
    assert.equal((await request(path, { cookie })).status, 404);
  }
  assert.equal((await request("/api/data/students", { method: "PUT", cookie, body: {} })).status, 405);
  assert.equal((await request("/api/data/courses/1", { method: "POST", cookie, body: {} })).status, 405);
});

test("USER pages show view access and API writes remain forbidden even with a forged header", async () => {
  const viewer = await login();
  const admin = await login("admin@example.test");
  for (const path of ["/students", "/courses"]) {
    const html = await (await request(path, { cookie: viewer.cookie })).text();
    assert.ok(html.includes("You have view access."));
    assert.ok(!html.includes('>Add student</h2>') && !html.includes('>Add course</h2>'));
  }
  for (const path of ["/api/data/students", "/api/data/courses"]) {
    assert.equal((await request(path, { cookie: viewer.cookie })).status, 200);
    assert.equal((await request(path, { method: "POST", cookie: viewer.cookie, body: {}, extra: { Authorization: `Bearer ${admin.cookie.split("=")[1]}` } })).status, 403);
  }
  assert.equal((await request("/api/data/students/1", { method: "DELETE", cookie: viewer.cookie })).status, 403);
  assert.equal((await request("/api/data/courses/1", { method: "PUT", cookie: viewer.cookie, body: {} })).status, 403);
});

test("ADMIN can create, update, read and delete a student and a course", async () => {
  const { cookie } = await login("admin@example.test");
  for (const path of ["/students", "/courses"]) {
    const html = await (await request(path, { cookie })).text();
    assert.ok(!html.includes("You have view access."));
    assert.ok(html.includes(path === "/students" ? "Add student" : "Add course"));
  }
  const fixtures = [
    ["students", { studentNumber: "TEST002", firstName: "New", lastName: "Student", email: "new.student@example.test" }],
    ["courses", { courseCode: "TEST002", name: "New Course", credits: 3 }],
  ];
  for (const [collection, body] of fixtures) {
    const basePath = `/api/data/${collection}`;
    const created = await request(basePath, { method: "POST", cookie, body });
    assert.equal(created.status, 201);
    const record = await created.json();
    const path = `${basePath}/${record.id}`;
    assert.equal((await request(path, { cookie })).status, 200);
    assert.equal((await request(path, { method: "PUT", cookie, body: { ...body, ...(collection === "courses" ? { credits: 4 } : { firstName: "Updated" }) } })).status, 200);
    assert.equal((await request(path, { method: "DELETE", cookie })).status, 204);
    assert.equal((await request(path, { cookie })).status, 404);
  }
});

test("session responses are safe, expired cookies are cleared, logout clears the cookie", async () => {
  const { cookie } = await login();
  const response = await request("/api/auth/session", { cookie });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.passwordHash, undefined);
  const invalid = "student_management_session=invalid-jwt";
  const rejected = await request("/api/auth/session", { cookie: invalid });
  assert.equal(rejected.status, 401);
  assert.match(rejected.headers.get("set-cookie"), /Max-Age=0/);
  const loggedOut = await request("/api/auth/logout", { method: "POST", cookie });
  assert.equal(loggedOut.status, 204);
  assert.match(loggedOut.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal((await request("/api/auth/session")).status, 401);
});

test("backend outages preserve the cookie and show a recoverable workspace message", async () => {
  const { cookie } = await login();
  await fetch(`${mock}/__test/mode`, { method: "POST", body: JSON.stringify({ unavailable: true }) });
  try {
    const response = await request("/api/auth/session", { cookie });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("set-cookie"), null);
    const html = await (await request("/dashboard", { cookie })).text();
    assert.ok(html.includes("Your workspace is temporarily unavailable."));
  } finally {
    await fetch(`${mock}/__test/mode`, { method: "POST", body: JSON.stringify({ unavailable: false }) });
  }
  assert.equal((await request("/api/auth/session", { cookie })).status, 200);
});

test("login and register pages redirect an already authenticated account", async () => {
  const { cookie } = await login();
  for (const path of ["/login", "/register"]) {
    const response = await request(path, { cookie });
    const html = await response.text();
    assert.ok(response.headers.get("location")?.includes("/dashboard") || html.includes('NEXT_REDIRECT;replace;/dashboard;'));
  }
});

test("a real short-lived test session expires and is cleared", async () => {
  const { cookie, session } = await login("expiry@example.test");
  assert.equal((await request("/api/auth/session", { cookie })).status, 200);
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, session.expiresAt - Date.now()) + 100));
  const response = await request("/api/auth/session", { cookie });
  assert.equal(response.status, 401);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});

test("forging cookie claims cannot grant access without a backend-verified signature", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({ sub: "2", roles: ["ADMIN"], exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url");
  const cookie = `student_management_session=${header}.${claims}.forged-signature`;
  assert.equal((await request("/api/auth/session", { cookie })).status, 401);
  const response = await request("/api/data/students", { cookie });
  assert.equal(response.status, 401);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
  const page = await request("/students", { cookie });
  const html = await page.text();
  assert.ok(page.headers.get("location")?.includes("/login") || html.includes('NEXT_REDIRECT;replace;/login?reason=expired;'));
  assert.ok(!html.includes('>Add student</h2>'));
});
