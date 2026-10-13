"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Course, Student } from "@/lib/types";

interface DashboardState {
  loading: boolean;
  error: string;
  students: number | null;
  courses: number | null;
}

const initialState: DashboardState = {
  loading: true,
  error: "",
  students: null,
  courses: null,
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      apiRequest<Student[]>("/api/students", {
        signal: controller.signal,
      }),
      apiRequest<Course[]>("/api/courses", {
        signal: controller.signal,
      }),
    ])
      .then(([students, courses]) => {
        if (controller.signal.aborted) return;

        setState({
          loading: false,
          error: "",
          students: students.length,
          courses: courses.length,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load dashboard.",
          students: null,
          courses: null,
        });
      });

    return () => controller.abort();
  }, [reload]);

  function refresh() {
    setState(initialState);
    setReload((value) => value + 1);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Student Management System
            </p>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-600">
              An overview of your students and courses.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={state.loading}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {state.loading ? "Loading…" : "Refresh"}
          </button>
        </header>

        {state.error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {state.error} Use Refresh to try again.
          </div>
        )}

        <section
          aria-label="Dashboard totals"
          aria-busy={state.loading}
          className="grid gap-6 sm:grid-cols-2"
        >
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-medium text-slate-600">Total students</h2>
            <p className="mt-4 text-4xl font-bold">
              {state.students ?? "—"}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-medium text-slate-600">Total courses</h2>
            <p className="mt-4 text-4xl font-bold">
              {state.courses ?? "—"}
            </p>
          </article>
        </section>

        {state.loading && (
          <p role="status" className="mt-6 text-sm text-slate-600">
            Loading dashboard totals…
          </p>
        )}
      </div>
    </main>
  );
}