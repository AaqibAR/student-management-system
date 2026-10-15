"use client";

import RecordForm, { type RecordField } from "./RecordForm";
import type { Student } from "@/lib/types";

const fields: RecordField[] = [
  {
    name: "studentNumber",
    label: "Student number",
    required: true,
    maxLength: 30,
    placeholder: "e.g. STU001",
    hint: "A unique number for this student.",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    maxLength: 254,
    placeholder: "student@example.com",
  },
  { name: "firstName", label: "First name", required: true, maxLength: 100 },
  { name: "lastName", label: "Last name", required: true, maxLength: 100 },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    maxLength: 30,
    placeholder: "e.g. +94 77 123 4567",
  },
];

export default function StudentForm({
  student,
  onSaved,
  onCancel,
  onSavingChange,
}: {
  student?: Student | null;
  onSaved: (record: Student) => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  return (
    <RecordForm<Student>
      fields={fields}
      values={student ? { ...student } : {}}
      path={student ? `/api/students/${student.id}` : "/api/students"}
      editing={!!student}
      onSaved={onSaved}
      onCancel={onCancel}
      onSavingChange={onSavingChange}
    />
  );
}
