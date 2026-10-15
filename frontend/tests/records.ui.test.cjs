/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS hooks load TS components after the DOM and auth fixture are installed. */
// DOM interaction tests; these do not replace visual tests in a real browser.
const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "http://localhost:3000", pretendToBeVisual: true },
);
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLSelectElement",
  "Event",
  "MouseEvent",
  "Node",
  "FormData",
])
  global[key] = dom.window[key];
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
global.IS_REACT_ACT_ENVIRONMENT = true;
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
// jsdom does not implement native modal behavior, focus trapping or layout.
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};

const frontendRoot = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(
    this,
    request.startsWith("@/")
      ? path.join(frontendRoot, "src", request.slice(2))
      : request,
    parent,
    ...rest,
  );
};
for (const extension of [".ts", ".tsx"])
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    module._compile(
      ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
  };
let admin = true;
const authFile = require.resolve("../src/components/AuthProvider.tsx");
require.cache[authFile] = {
  id: authFile,
  filename: authFile,
  loaded: true,
  exports: { useAuth: () => ({ isAdmin: admin }) },
};
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const Students = require("../src/components/StudentDirectory.tsx").default;
const Courses = require("../src/components/CourseCatalog.tsx").default;
let root;
let database;
let requests;
let nextFailure;
let loadFailure;
let pendingMutation;

function setup(count = 12) {
  admin = true;
  database = {
    students: Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      studentNumber: `S${index + 1}`,
      firstName: "Student",
      lastName: String(index + 1),
      email: `student${index + 1}@example.test`,
      phone: null,
      createdAt: `2026-10-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    })),
    courses: [
      {
        id: 1,
        courseCode: "CS101",
        name: "Computing",
        credits: 3,
        description: "Learn computing",
        createdAt: "2026-10-01T00:00:00Z",
      },
    ],
  };
  requests = [];
  nextFailure = null;
  loadFailure = false;
  pendingMutation = null;
  global.fetch = async (url, options = {}) => {
    const method = options.method || "GET";
    const [, collection, rawId] =
      /^\/api\/data\/(students|courses)(?:\/(\d+))?$/.exec(url) || [];
    assert.ok(collection, `Unexpected URL ${url}`);
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ method, collection, id: Number(rawId), body });
    const json = (data, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (method === "GET")
      return loadFailure
        ? json({ detail: "Service is temporarily unavailable" }, 503)
        : json(database[collection]);
    if (pendingMutation) await pendingMutation;
    if (nextFailure) {
      const failure = nextFailure;
      nextFailure = null;
      return json(failure.body, failure.status);
    }
    const rows = database[collection];
    if (method === "POST") {
      const record = {
        ...body,
        id: Math.max(0, ...rows.map((row) => row.id)) + 1,
        createdAt: "2026-10-30T00:00:00Z",
      };
      rows.push(record);
      return json(record, 201);
    }
    const index = rows.findIndex((row) => row.id === Number(rawId));
    assert.ok(index >= 0);
    if (method === "PUT") {
      rows[index] = { ...rows[index], ...body };
      return json(rows[index]);
    }
    if (method === "DELETE") {
      rows.splice(index, 1);
      return json(null, 204);
    }
    throw new Error(`Unexpected method ${method}`);
  };
  root = createRoot(document.getElementById("root"));
}
async function mount(Component = Students) {
  await act(async () => root.render(React.createElement(Component)));
}
function buttons() {
  return [...document.querySelectorAll("button")];
}
function button(name) {
  const result = buttons().find(
    (element) =>
      (element.getAttribute("aria-label") ||
        element.textContent.replace(/\s+/g, " ").trim()) === name,
  );
  assert.ok(result, `Button ${name} missing`);
  return result;
}
async function click(name) {
  await act(async () => button(name).click());
}
async function value(selector, next) {
  const element = document.querySelector(selector);
  assert.ok(element, selector);
  const proto =
    element.tagName === "SELECT"
      ? dom.window.HTMLSelectElement.prototype
      : element.tagName === "TEXTAREA"
        ? dom.window.HTMLTextAreaElement.prototype
        : dom.window.HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, "value").set.call(
      element,
      String(next),
    );
    element.dispatchEvent(
      new Event(element.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}
async function submit() {
  await act(async () => {
    document
      .querySelector(".record-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 2));
  });
}
async function fillStudent() {
  for (const [name, next] of Object.entries({
    studentNumber: "  NEW001  ",
    email: "new@example.test",
    firstName: "New",
    lastName: "Student",
  }))
    await value(`[name="${name}"]`, next);
}
function mutations() {
  return requests.filter((request) => request.method !== "GET");
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  document.body.style.overflow = "";
  root = null;
});

test("USER sees records and view access without add, edit or delete controls", async () => {
  setup();
  admin = false;
  await mount();
  assert.match(document.body.textContent, /You have view access/);
  assert.match(document.body.textContent, /student12@example.test/);
  assert.ok(
    !buttons().some((element) =>
      /^(Add |Edit |Delete )/.test(
        element.getAttribute("aria-label") || element.textContent.trim(),
      ),
    ),
  );
  assert.equal(document.querySelector("dialog"), null);
});

test("search, sort and page-size changes reset pagination and search all records", async () => {
  setup(12);
  await mount();
  await click("Next page");
  assert.match(
    document.querySelector(".directory-results").textContent,
    /11–12/,
  );
  await value("#record-search", " S12 ");
  assert.match(document.querySelector(".directory-results").textContent, /1–1/);
  assert.match(
    document.querySelector(".directory-table").textContent,
    /student12@example.test/,
  );
  await click("Clear search");
  await value("#record-sort", "number");
  assert.match(document.querySelector("tbody tr").textContent, /S1/);
  await value("#record-page-size", 5);
  await click("Next page");
  assert.match(
    document.querySelector(".directory-results").textContent,
    /6–10/,
  );
  await value("#record-search", "no such record");
  assert.match(document.body.textContent, /No matching records/);
  assert.ok(button("Next page").disabled);
});

test("add validates and focuses fields, trims input and updates the list", async () => {
  setup();
  await mount();
  await click("Add student");
  assert.equal(document.activeElement.name, "studentNumber");
  await submit();
  assert.equal(mutations().length, 0);
  assert.equal(document.activeElement.name, "studentNumber");
  assert.equal(
    document
      .querySelector('[name="studentNumber"]')
      .getAttribute("aria-invalid"),
    "true",
  );
  await fillStudent();
  await submit();
  assert.equal(mutations()[0].body.studentNumber, "NEW001");
  assert.equal(document.querySelector("dialog"), null);
  assert.match(document.body.textContent, /Student added successfully/);
  assert.match(document.querySelector("tbody tr").textContent, /NEW001/);
  assert.equal(document.body.style.overflow, "");
});

test("backend field errors preserve input and focus the invalid field", async () => {
  setup();
  await mount();
  await click("Add student");
  await fillStudent();
  nextFailure = {
    status: 400,
    body: {
      detail: "Please correct the email",
      errors: { email: "This email cannot be used" },
    },
  };
  await submit();
  assert.equal(document.activeElement.name, "email");
  assert.equal(document.querySelector('[name="firstName"]').value, "New");
  assert.match(
    document.querySelector("#record-email-error").textContent,
    /cannot be used/,
  );
  await value('[name="email"]', "corrected@example.test");
  await submit();
  assert.equal(document.querySelector("dialog"), null);
});

test("duplicate errors preserve the form, and editing updates one existing record", async () => {
  setup();
  await mount();
  await click("Edit Student 12 (S12)");
  assert.equal(document.querySelector('[name="studentNumber"]').value, "S12");
  await value('[name="firstName"]', "Updated");
  nextFailure = {
    status: 409,
    body: { detail: "A student with these details already exists" },
  };
  await submit();
  assert.match(
    document.querySelector(".record-form").textContent,
    /already exists/,
  );
  assert.equal(document.querySelector('[name="firstName"]').value, "Updated");
  await submit();
  assert.equal(database.students.length, 12);
  assert.equal(mutations().at(-1).method, "PUT");
  assert.match(document.body.textContent, /Student updated successfully/);
});

test("delete can be cancelled, failed and retried without prematurely removing a record", async () => {
  setup();
  await mount();
  await click("Delete Student 12 (S12)");
  assert.equal(document.activeElement.textContent, "Keep record");
  await click("Keep record");
  assert.equal(mutations().length, 0);
  await click("Delete Student 12 (S12)");
  nextFailure = { status: 503, body: { detail: "Unable to delete right now" } };
  await click("Delete student");
  assert.equal(database.students.length, 12);
  assert.match(
    document.querySelector("dialog").textContent,
    /Unable to delete/,
  );
  await click("Delete student");
  assert.equal(database.students.length, 11);
  assert.equal(document.querySelector("dialog"), null);
  assert.match(document.body.textContent, /Student deleted successfully/);
});

test("deleting the last record on a page returns to the previous valid page", async () => {
  setup(11);
  await mount();
  await click("Next page");
  await click("Delete Student 1 (S1)");
  await click("Delete student");
  assert.match(
    document.querySelector(".directory-results").textContent,
    /1–10/,
  );
  assert.match(
    document.querySelector(".directory-page-controls").textContent,
    /Page 1 of 1/,
  );
  assert.equal(document.activeElement.id, "directory-heading");
});

test("course credits and description validate before submitting, then create succeeds", async () => {
  setup();
  await mount(Courses);
  await click("Add course");
  await value('[name="courseCode"]', "CS102");
  await value('[name="name"]', "New course");
  await value('[name="credits"]', 31);
  await submit();
  assert.equal(mutations().length, 0);
  assert.equal(document.activeElement.name, "credits");
  await value('[name="credits"]', 2.5);
  await submit();
  assert.equal(mutations().length, 0);
  await value('[name="credits"]', 4);
  await value('[name="description"]', "x".repeat(5001));
  await submit();
  assert.equal(mutations().length, 0);
  assert.match(
    document.querySelector("#record-description-error").textContent,
    /5000/,
  );
  await value('[name="description"]', "A useful course");
  await submit();
  assert.equal(database.courses.at(-1).credits, 4);
  assert.match(document.body.textContent, /Course added successfully/);
});

test("refresh failure preserves loaded records and offers a working retry", async () => {
  setup();
  await mount();
  loadFailure = true;
  await click("Refresh");
  assert.match(document.body.textContent, /Previously loaded records/);
  assert.match(
    document.querySelector(".directory-table").textContent,
    /student12@example.test/,
  );
  assert.ok(button("Add student").disabled);
  loadFailure = false;
  await click("Try again");
  assert.ok(!button("Add student").disabled);
  assert.ok(!document.body.textContent.includes("Previously loaded records"));
});

test("save locks dismissal and ignores duplicate submits while the request is pending", async () => {
  setup();
  await mount();
  await click("Add student");
  await fillStudent();
  let resolveMutation;
  pendingMutation = new Promise((resolvePending) => {
    resolveMutation = resolvePending;
  });
  await submit();
  await submit();
  assert.equal(mutations().length, 1);
  assert.ok(button("Cancel").disabled);
  assert.ok(button("Close dialog").disabled);
  await act(async () =>
    document
      .querySelector("dialog")
      .dispatchEvent(new Event("cancel", { cancelable: true })),
  );
  assert.ok(document.querySelector("dialog").open);
  await act(async () => resolveMutation());
  assert.equal(document.querySelector("dialog"), null);
});

test("initial load failure retries, and empty collections have useful guidance", async () => {
  setup(0);
  loadFailure = true;
  await mount();
  assert.match(document.body.textContent, /Records are unavailable/);
  loadFailure = false;
  await click("Try again");
  assert.match(document.body.textContent, /No students yet/);
  assert.match(document.body.textContent, /Add your first student/);
  assert.ok(button("Next page").disabled);
});

test("course edit and deletion use the course endpoint and update the catalog", async () => {
  setup();
  await mount(Courses);
  await click("Edit Computing (CS101)");
  await value('[name="name"]', "Updated computing");
  await submit();
  assert.equal(mutations().at(-1).collection, "courses");
  assert.equal(mutations().at(-1).method, "PUT");
  assert.match(document.body.textContent, /Course updated successfully/);
  await click("Delete Updated computing (CS101)");
  await click("Delete course");
  assert.equal(database.courses.length, 0);
  assert.match(document.body.textContent, /No courses yet/);
});
