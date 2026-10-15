"use client";

import RecordDirectory from "./RecordDirectory";
import RecordIdentity, { RecordDate } from "./RecordIdentity";
import StudentForm from "./StudentForm";
import { studentSorts } from "@/lib/record-list";
import type { Student } from "@/lib/types";

export default function StudentDirectory() {
  return (
    <RecordDirectory<Student>
      title="Students"
      singular="Student"
      description="A clearer view of every student in your workspace."
      icon="students"
      endpoint="/api/students"
      nameOf={(student) => `${student.firstName} ${student.lastName}`}
      codeOf={(student) => student.studentNumber}
      searchHint="Search name, number or email…"
      sorts={studentSorts}
      summary={(students) => [
        { label: "Total students", value: students.length, icon: "students" },
        {
          label: "With phone details",
          value: students.filter((student) => student.phone?.trim()).length,
          icon: "phone",
        },
      ]}
      columns={[
        {
          label: "Student",
          render: (student) => (
            <RecordIdentity
              name={`${student.firstName} ${student.lastName}`}
              code={student.studentNumber}
            />
          ),
        },
        {
          label: "Email",
          render: (student) => (
            <span className="record-contact">{student.email}</span>
          ),
        },
        {
          label: "Phone",
          render: (student) =>
            student.phone || <span className="record-muted">Not provided</span>,
        },
        {
          label: "Added",
          render: (student) => <RecordDate value={student.createdAt} />,
        },
      ]}
      renderForm={({ record, ...props }) => (
        <StudentForm student={record} {...props} />
      )}
    />
  );
}
