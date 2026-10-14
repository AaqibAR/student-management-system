"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";
import type { Student } from "@/lib/types";
import StudentForm from "@/components/StudentForm";

export default function StudentDirectory() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Student[]>("/api/students", {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setStudents(data);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load students."
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

  function editStudent(student: Student) {
    if (!isAdmin || savingStudent || deletingId !== null) return;

    setSaveSuccess("");
    setDeleteSuccess("");
    setDeleteError("");
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteStudent(student: Student) {
    if (!isAdmin || savingStudent || deletingId !== null) return;

    const confirmed = window.confirm(
      `Delete ${student.firstName} ${student.lastName} (${student.studentNumber})?`
    );

    if (!confirmed) return;

    setDeletingId(student.id);
    setDeleteError("");
    setDeleteSuccess("");
    setSaveSuccess("");

    try {
      await apiRequest<void>(`/api/students/${student.id}`, {
        method: "DELETE",
      });

      if (editingStudent?.id === student.id) {
        setEditingStudent(null);
      }

      setDeleteSuccess("Student deleted successfully.");
      refresh();
    } catch (error: unknown) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete the student."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="mt-2 text-slate-600">
              View and manage student records.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || savingStudent || deletingId !== null}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        {isAdmin ? (
        <fieldset
          disabled={deletingId !== null}
          className="min-w-0"
        >
          <legend className="sr-only">Add or edit student</legend>

          <StudentForm
            key={editingStudent?.id ?? "new"}
            student={editingStudent}
            onSavingChange={(saving) => {
              setSavingStudent(saving);
              if (saving) {
                setSaveSuccess("");
                setDeleteSuccess("");
                setDeleteError("");
              }
            }}
            onCancel={() => setEditingStudent(null)}
            onSaved={() => {
              setSaveSuccess(
                editingStudent
                  ? "Student updated successfully."
                  : "Student added successfully."
              );
              setDeleteError("");
              setDeleteSuccess("");
              setEditingStudent(null);
              refresh();
            }}
          />
        </fieldset>
        ) : (
          <p className="read-only-notice">You have view access. An administrator can add or change records.</p>
        )}

        {saveSuccess && (
          <p
            role="status"
            className="mb-6 rounded-lg bg-green-50 p-4 text-green-700"
          >
            {saveSuccess}
          </p>
        )}

        {deleteError && (
          <p
            role="alert"
            className="mb-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {deleteError}
          </p>
        )}

        {deleteSuccess && (
          <p
            role="status"
            className="mb-6 rounded-lg bg-green-50 p-4 text-green-700"
          >
            {deleteSuccess}
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
            Loading students...
          </p>
        ) : error ? null : students.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            No students found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Student records</caption>

              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Student number
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Phone
                  </th>
                  {isAdmin && (
                  <th scope="col" className="px-4 py-3">
                    Actions
                  </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t border-slate-200"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      {student.studentNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-4">{student.email}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {student.phone || "—"}
                    </td>
                    {isAdmin && (
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editStudent(student)}
                          disabled={savingStudent || deletingId !== null}
                          aria-label={`Edit student ${student.studentNumber}`}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteStudent(student)}
                          disabled={savingStudent || deletingId !== null}
                          aria-label={`Delete student ${student.studentNumber}`}
                          className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === student.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                    )}
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