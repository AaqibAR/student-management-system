"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "@/lib/api";
import type { Student, StudentInput } from "@/lib/types";

const fields = [
  { name: "studentNumber", label: "Student number", maxLength: 30 },
  { name: "firstName", label: "First name", maxLength: 100 },
  { name: "lastName", label: "Last name", maxLength: 100 },
  { name: "email", label: "Email", maxLength: 254 },
  { name: "phone", label: "Phone (optional)", maxLength: 30 },
] as const;

interface StudentFormProps {
  student?: Student | null;
  onSaved: () => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}

export default function StudentForm({
  student,
  onSaved,
  onCancel,
  onSavingChange,
}: StudentFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const input: StudentInput = {
      studentNumber: String(data.get("studentNumber") ?? "").trim(),
      firstName: String(data.get("firstName") ?? "").trim(),
      lastName: String(data.get("lastName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
    };

    if (
      !input.studentNumber ||
      !input.firstName ||
      !input.lastName ||
      !input.email
    ) {
      setError("Fill in all required fields.");
      return;
    }

    setSaving(true);
    onSavingChange(true);
    setError("");

    try {
      await apiRequest<Student>(
        student ? `/api/students/${student.id}` : "/api/students",
        {
          method: student ? "PUT" : "POST",
          body: JSON.stringify(input),
        }
      );

      if (!student) form.reset();
      onSaved();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the student."
      );
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-xl font-semibold">
        {student ? "Edit student" : "Add student"}
      </h2>

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={saving}
          className="grid gap-4 sm:grid-cols-2"
        >
          <legend className="sr-only">Student details</legend>

          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={`student-${field.name}`}
                className="mb-1 block text-sm font-medium"
              >
                {field.label}
              </label>

              <input
                id={`student-${field.name}`}
                name={field.name}
                defaultValue={student?.[field.name] ?? ""}
                type={
                  field.name === "email"
                    ? "email"
                    : field.name === "phone"
                      ? "tel"
                      : "text"
                }
                required={field.name !== "phone"}
                maxLength={field.maxLength}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          ))}
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
            {saving
              ? "Saving..."
              : student
                ? "Save changes"
                : "Add student"}
          </button>

          {student && (
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