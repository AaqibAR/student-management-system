// Runs the production Next server against an isolated, in-memory API fixture.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const backendPort = Number(process.env.AUTH_TEST_BACKEND_PORT ?? 8181);
const appPort = Number(process.env.AUTH_TEST_APP_PORT ?? 3030);
for (const port of [backendPort, appPort]) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("Auth test ports must be integers between 1024 and 65535.");
  }
}
if (backendPort === appPort)
  throw new Error("Auth test ports must be different.");
const backendUrl = `http://127.0.0.1:${backendPort}`;
const appUrl = `http://127.0.0.1:${appPort}`;
const children = [];
let stopping = false;

function launch(args, env = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  child.on("error", (error) => console.error(error.message));
  children.push(child);
  return child;
}

async function ensurePortUnused(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1000) });
  } catch (error) {
    if (error.cause?.code === "ECONNREFUSED") return;
    throw new Error(
      `Cannot establish that ${url} is unused. Stop any existing test servers first.`,
      { cause: error },
    );
  }
  throw new Error(
    `A server is already listening at ${url}. Stop it or choose different AUTH_TEST ports.`,
  );
}

async function ready(url, child, expectedStatus) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline && !stopping) {
    if (child.exitCode !== null || child.signalCode !== null)
      throw new Error(`Test server exited before ${url} was ready.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.status === expectedStatus) return;
    } catch {
      /* Poll only the test process started by this runner. */
    }
    await delay(250);
  }
  throw new Error(
    `Timed out waiting for ${url}. Run npm run build before this command.`,
  );
}

async function stop() {
  if (stopping) return;
  stopping = true;
  await Promise.all(
    children.map(async (child) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const closed = once(child, "close");
      child.kill("SIGTERM");
      const force = setTimeout(() => child.kill("SIGKILL"), 3000);
      force.unref();
      try {
        await closed;
      } finally {
        clearTimeout(force);
      }
    }),
  );
}

process.once("SIGINT", () => {
  void stop().then(() => process.exit(130));
});
process.once("SIGTERM", () => {
  void stop().then(() => process.exit(143));
});

try {
  await ensurePortUnused(`${backendUrl}/api/auth/me`);
  await ensurePortUnused(`${appUrl}/login`);
  const backend = launch(["tests/mock-auth-backend.mjs"], {
    AUTH_TEST_BACKEND_PORT: String(backendPort),
  });
  await ready(`${backendUrl}/api/auth/me`, backend, 401);
  const app = launch(
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(appPort),
    ],
    {
      API_BASE_URL: backendUrl,
      APP_ORIGIN: appUrl,
    },
  );
  await ready(`${appUrl}/login`, app, 200);
  const tests = launch(["--test", "tests/auth.integration.test.mjs"], {
    AUTH_TEST_APP_URL: appUrl,
    AUTH_TEST_BACKEND_URL: backendUrl,
  });
  const [code] = await once(tests, "close");
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await stop();
}
