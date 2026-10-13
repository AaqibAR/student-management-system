"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Course } from "@/lib/types";
import CourseForm from "@/components/CourseForm";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Course[]>("/api/courses", {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setCourses(data);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error ? error.message : "Unable to load courses."
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [reload]);

  function refresh() {
    setError("");
    setLoading(true);
    setReload((value) => value + 1);
  }

  function editCourse(course: Course) {
    if (savingCourse || deletingId !== null) return;

    setSuccess("");
    setMutationError("");
    setEditingCourse(course);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteCourse(course: Course) {
    if (savingCourse || deletingId !== null) return;

    const confirmed = window.confirm(
      `Delete ${course.name} (${course.courseCode})?`
    );

    if (!confirmed) return;

    setDeletingId(course.id);
    setMutationError("");
    setSuccess("");

    try {
      await apiRequest<void>(`/api/courses/${course.id}`, {
        method: "DELETE",
      });

      if (editingCourse?.id === course.id) {
        setEditingCourse(null);
      }

      setSuccess("Course deleted successfully.");
      refresh();
    } catch (error: unknown) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Unable to delete the course."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const busy = savingCourse || deletingId !== null;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="mt-2 text-slate-600">
              View and manage course records.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || busy}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        <fieldset disabled={deletingId !== null} className="min-w-0">
          <legend className="sr-only">Add or edit course</legend>

          <CourseForm
            key={editingCourse?.id ?? "new"}
            course={editingCourse}
            onSavingChange={(saving) => {
            setSavingCourse(saving);

            if (saving) {
                setSuccess("");
                setMutationError("");
             }
            }}
            onCancel={() => setEditingCourse(null)}
            onSaved={() => {
              setSuccess(
                editingCourse
                  ? "Course updated successfully."
                  : "Course added successfully."
              );
              setMutationError("");
              setEditingCourse(null);
              refresh();
            }}
          />
        </fieldset>

        {success && (
          <p
            role="status"
            className="mb-6 rounded-lg bg-green-50 p-4 text-green-700"
          >
            {success}
          </p>
        )}

        {mutationError && (
          <p
            role="alert"
            className="mb-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {mutationError}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p role="status" className="text-slate-600">
            Loading courses...
          </p>
        ) : error ? null : courses.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            No courses found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Course records</caption>

              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-4 py-3">Code</th>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Credits</th>
                  <th scope="col" className="px-4 py-3">Description</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-t border-slate-200"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      {course.courseCode}
                    </td>
                    <td className="px-4 py-4">{course.name}</td>
                    <td className="px-4 py-4">{course.credits}</td>
                    <td className="min-w-48 px-4 py-4">
                      <p className="whitespace-pre-wrap break-words">
                        {course.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editCourse(course)}
                          disabled={busy}
                          aria-label={`Edit course ${course.courseCode}`}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCourse(course)}
                          disabled={busy}
                          aria-label={`Delete course ${course.courseCode}`}
                          className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === course.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}