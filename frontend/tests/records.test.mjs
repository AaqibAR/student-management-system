import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Load the pure TypeScript helper with the project's existing compiler.
const source = readFileSync(
  new URL("../src/lib/record-list.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { selectRecords, paginate } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const students = [
  {
    id: 1,
    studentNumber: "S10",
    firstName: "Zara",
    lastName: "Silva",
    email: "zara@example.test",
    phone: null,
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 2,
    studentNumber: "S2",
    firstName: "Aaqib",
    lastName: "Rasmy",
    email: "aaqib@example.test",
    phone: "+94 77 123 4567",
    createdAt: "2026-10-02T00:00:00Z",
  },
  {
    id: 3,
    studentNumber: "S1",
    firstName: "Amal",
    lastName: "Silva",
    email: "amal@example.test",
    phone: null,
    createdAt: "2026-10-02T00:00:00Z",
  },
];
const courses = [
  {
    id: 1,
    courseCode: "CS10",
    name: "Databases",
    credits: 4,
    description: "Relational modelling",
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 2,
    courseCode: "CS2",
    name: "Algorithms",
    credits: 2,
    description: null,
    createdAt: "2026-10-03T00:00:00Z",
  },
];

test("student search ignores case/extra spaces and matches terms across fields", () => {
  assert.deepEqual(
    selectRecords(students, "  AAQIB   S2 ", "newest").map((row) => row.id),
    [2],
  );
  assert.deepEqual(
    selectRecords(students, "@example.test silva", "name").map((row) => row.id),
    [3, 1],
  );
  assert.deepEqual(
    selectRecords(students, "+94", "newest").map((row) => row.id),
    [2],
  );
  assert.equal(selectRecords(students, "no-match", "newest").length, 0);
});
test("student number sorting is numeric and equal dates have a stable order", () => {
  assert.deepEqual(
    selectRecords(students, "", "number").map((row) => row.id),
    [3, 2, 1],
  );
  assert.deepEqual(
    selectRecords(students, "", "newest").map((row) => row.id),
    [3, 2, 1],
  );
  assert.deepEqual(
    selectRecords(students, "", "oldest").map((row) => row.id),
    [1, 2, 3],
  );
  assert.deepEqual(
    students.map((row) => row.id),
    [1, 2, 3],
  );
});
test("course search includes description and sorts codes, names, and credits", () => {
  assert.equal(selectRecords(courses, "relational CS10", "newest")[0].id, 1);
  for (const sort of ["name", "code", "credits"])
    assert.deepEqual(
      selectRecords(courses, "", sort).map((row) => row.id),
      [2, 1],
    );
});
test("search runs over the full dataset before pagination", () => {
  const all = Array.from({ length: 26 }, (_, index) => ({
    ...students[0],
    id: index + 1,
    studentNumber: `S${index + 1}`,
  }));
  const result = paginate(selectRecords(all, "S26", "number"), 1, 5);
  assert.equal(result.items[0].id, 26);
  assert.equal(result.pages, 1);
});
test("pagination handles empty data, partial pages and deleting the last item on a page", () => {
  assert.deepEqual(paginate([], 5, 10), {
    items: [],
    page: 1,
    pages: 1,
    start: 0,
    end: 0,
  });
  assert.deepEqual(paginate(students, 2, 2), {
    items: [students[2]],
    page: 2,
    pages: 2,
    start: 3,
    end: 3,
  });
  assert.equal(paginate(students.slice(0, 2), 2, 2).page, 1);
  assert.equal(paginate(students, 99, 2).page, 2);
  assert.equal(paginate(students, -1, 0).page, 1);
});
