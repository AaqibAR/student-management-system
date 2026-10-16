"use client";

import RecordDirectory from "./RecordDirectory";
import RecordIdentity, { RecordDate } from "./RecordIdentity";
import CourseForm from "./CourseForm";
import { courseSorts } from "@/lib/record-list";
import type { Course } from "@/lib/types";

export default function CourseCatalog() {
  return (
    <RecordDirectory<Course>
      title="Courses"
      singular="Course"
      description="Keep your academic offering organized and easy to explore."
      icon="book"
      endpoint="/api/courses"
      nameOf={(course) => course.name}
      codeOf={(course) => course.courseCode}
      searchHint="Search course name or code…"
      sorts={courseSorts}
      summary={(courses) => [
        { label: "Total courses", value: courses.length, icon: "book" },
        {
          label: "Total credits",
          value: courses.reduce((sum, course) => sum + course.credits, 0),
          icon: "layers",
        },
      ]}
      columns={[
        {
          label: "Course",
          render: (course) => (
            <RecordIdentity
              name={course.name}
              code={course.courseCode}
              course
            />
          ),
        },
        {
          label: "Credits",
          render: (course) => (
            <span className="record-credit-badge">
              {course.credits} {course.credits === 1 ? "credit" : "credits"}
            </span>
          ),
        },
        {
          label: "Description",
          render: (course) =>
            course.description ? (
              <details className="record-description">
                <summary>Read description</summary>
                <p>{course.description}</p>
              </details>
            ) : (
              <span className="record-muted">Not provided</span>
            ),
        },
        {
          label: "Added",
          render: (course) => <RecordDate value={course.createdAt} />,
        },
      ]}
      renderForm={({ record, ...props }) => (
        <CourseForm course={record} {...props} />
      )}
    />
  );
}
