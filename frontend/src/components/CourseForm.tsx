"use client";

import RecordForm, { type RecordField } from "./RecordForm";
import type { Course } from "@/lib/types";

const fields: RecordField[] = [
  {
    name: "courseCode",
    label: "Course code",
    required: true,
    maxLength: 30,
    placeholder: "e.g. CS101",
    hint: "A unique code for this course.",
  },
  {
    name: "name",
    label: "Course name",
    required: true,
    maxLength: 150,
    placeholder: "e.g. Introduction to Computing",
  },
  {
    name: "credits",
    label: "Credits",
    type: "number",
    required: true,
    min: 1,
    max: 30,
    hint: "A whole number from 1 to 30.",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    maxLength: 5000,
    hint: "Up to 5,000 characters.",
    placeholder: "What will students learn?",
  },
];

export default function CourseForm({
  course,
  onSaved,
  onCancel,
  onSavingChange,
}: {
  course?: Course | null;
  onSaved: (record: Course) => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  return (
    <RecordForm<Course>
      fields={fields}
      values={course ? { ...course } : { credits: 3 }}
      path={course ? `/api/courses/${course.id}` : "/api/courses"}
      editing={!!course}
      onSaved={onSaved}
      onCancel={onCancel}
      onSavingChange={onSavingChange}
    />
  );
}
