import type { Course, Student } from "./types";

export const studentSorts = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "number", label: "Student number" },
];
export const courseSorts = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "code", label: "Course code" },
  { value: "credits", label: "Credits: low to high" },
];
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
const timestamp = (value: string) => Date.parse(value) || 0;

export function selectRecords<T extends Student | Course>(
  records: T[],
  query: string,
  sort: string,
): T[] {
  const terms = query
    .trim()
    .toLocaleLowerCase("en")
    .split(/\s+/)
    .filter(Boolean);
  return records
    .filter((record) => {
      const text = (
        "studentNumber" in record
          ? `${record.studentNumber} ${record.firstName} ${record.lastName} ${record.email} ${record.phone ?? ""}`
          : `${record.courseCode} ${record.name} ${record.description ?? ""} ${record.credits}`
      ).toLocaleLowerCase("en");
      return terms.every((term) => text.includes(term));
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sort === "name") {
        comparison = collator.compare(
          "firstName" in a ? `${a.firstName} ${a.lastName}` : a.name,
          "firstName" in b ? `${b.firstName} ${b.lastName}` : b.name,
        );
      } else if (
        sort === "number" &&
        "studentNumber" in a &&
        "studentNumber" in b
      ) {
        comparison = collator.compare(a.studentNumber, b.studentNumber);
      } else if (sort === "code" && "courseCode" in a && "courseCode" in b) {
        comparison = collator.compare(a.courseCode, b.courseCode);
      } else if (sort === "credits" && "credits" in a && "credits" in b) {
        comparison = a.credits - b.credits;
      } else {
        comparison =
          sort === "oldest"
            ? timestamp(a.createdAt) - timestamp(b.createdAt)
            : timestamp(b.createdAt) - timestamp(a.createdAt);
      }
      return comparison || (sort === "oldest" ? a.id - b.id : b.id - a.id);
    });
}

export function paginate<T>(
  records: T[],
  requestedPage: number,
  pageSize: number,
) {
  const size = Math.max(1, Math.floor(pageSize) || 10);
  const pages = Math.max(1, Math.ceil(records.length / size));
  const page = Math.min(pages, Math.max(1, Math.floor(requestedPage) || 1));
  const offset = (page - 1) * size;
  return {
    items: records.slice(offset, offset + size),
    page,
    pages,
    start: records.length ? offset + 1 : 0,
    end: Math.min(offset + size, records.length),
  };
}
