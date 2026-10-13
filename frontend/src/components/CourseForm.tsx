"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "@/lib/api";
import type { Course, CourseInput } from "@/lib/types";

interface CourseFormProps {
  course?: Course | null;
  onSaved: () => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}

export default function CourseForm({
  course,
  onSaved,
  onCancel,
  onSavingChange,
}: CourseFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const input: CourseInput = {
      courseCode: String(data.get("courseCode") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      credits: Number(data.get("credits")),
    };

    if (!input.courseCode || !input.name) {
      setError("Enter the course code and name.");
      return;
    }

    if (
      !Number.isInteger(input.credits) ||
      input.credits < 1 ||
      input.credits > 30
    ) {
      setError("Credits must be a whole number between 1 and 30.");
      return;
    }

    setSaving(true);
    onSavingChange(true);
    setError("");

    try {
      await apiRequest<Course>(
        course ? `/api/courses/${course.id}` : "/api/courses",
        {
          method: course ? "PUT" : "POST",
          body: JSON.stringify(input),
        }
      );

      if (!course) form.reset();
      onSaved();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the course."
      );
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-xl font-semibold">
        {course ? "Edit course" : "Add course"}
      </h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">Course details</legend>

          <div>
            <label
              htmlFor="course-code"
              className="mb-1 block text-sm font-medium"
            >
              Course code
            </label>
            <input
              id="course-code"
              name="courseCode"
              defaultValue={course?.courseCode ?? ""}
              required
              maxLength={30}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="course-name"
              className="mb-1 block text-sm font-medium"
            >
              Course name
            </label>
            <input
              id="course-name"
              name="name"
              defaultValue={course?.name ?? ""}
              required
              maxLength={150}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="course-credits"
              className="mb-1 block text-sm font-medium"
            >
              Credits
            </label>
            <input
              id="course-credits"
              name="credits"
              type="number"
              defaultValue={course?.credits ?? 3}
              required
              min={1}
              max={30}
              step={1}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="course-description"
              className="mb-1 block text-sm font-medium"
            >
              Description (optional)
            </label>
            <textarea
              id="course-description"
              name="description"
              defaultValue={course?.description ?? ""}
              rows={3}
              className={inputClass}
            />
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : course ? "Save changes" : "Add course"}
          </button>

          {course && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}