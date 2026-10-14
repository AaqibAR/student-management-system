"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { apiRequest } from "@/lib/api";
import type { Course, Student } from "@/lib/types";

interface DashboardState {
  loading: boolean;
  error: string;
  students: Student[] | null;
  courses: Course[] | null;
  updatedAt: string | null;
}

const initialState: DashboardState = {
  loading: true,
  error: "",
  students: null,
  courses: null,
  updatedAt: null,
};
const numberFormat = new Intl.NumberFormat("en");

function newestFirst<T extends { id: number; createdAt: string }>(
  records: T[],
) {
  return [...records].sort(
    (a, b) =>
      (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) ||
      b.id - a.id,
  );
}

function Metric({
  title,
  value,
  caption,
  icon,
  href,
  tone,
}: {
  title: string;
  value: number | null;
  caption: string;
  icon: IconName;
  href: string;
  tone: string;
}) {
  return (
    <Link href={href} className={`dashboard-metric reveal ${tone}`}>
      <div className="metric-heading">
        <span>{title}</span>
        <span className="metric-icon">
          <Icon name={icon} />
        </span>
      </div>
      {value === null ? (
        <span className="metric-placeholder" aria-label="Unavailable" />
      ) : (
        <strong className="metric-value">{numberFormat.format(value)}</strong>
      )}
      <div className="metric-footer">
        <span>{caption}</span>
        <Icon name="arrow" width="17" height="17" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest<Student[]>("/api/students", { signal: controller.signal }),
      apiRequest<Course[]>("/api/courses", { signal: controller.signal }),
    ])
      .then(([students, courses]) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            error: "",
            students,
            courses,
            updatedAt: new Date().toLocaleTimeString("en", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            ...initialState,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load your overview.",
          });
      });
    return () => controller.abort();
  }, [reload]);

  function refresh() {
    setState(initialState);
    setReload((value) => value + 1);
  }

  const recentStudents = newestFirst(state.students ?? []).slice(0, 4);
  const recentCourses = newestFirst(state.courses ?? []).slice(0, 4);
  const totalCredits =
    state.courses?.reduce((total, course) => total + course.credits, 0) ?? null;

  return (
    <main className={`dashboard-page ${state.loading ? "is-loading" : ""}`}>
      <header className="dashboard-page-heading reveal">
        <div>
          <p className="page-eyebrow">YOUR WORKSPACE, AT A GLANCE</p>
          <h1>Overview</h1>
          <p>Everything you need for a more organized day.</p>
        </div>
        <button
          className="ui-button ui-button-secondary"
          onClick={refresh}
          disabled={state.loading}
        >
          <Icon
            name="refresh"
            className={state.loading ? "refresh-spinning" : ""}
          />
          {state.loading ? "Refreshing…" : "Refresh data"}
        </button>
      </header>

      <section
        className="dashboard-welcome reveal"
        aria-labelledby="welcome-title"
      >
        <div className="welcome-copy">
          <span className="welcome-kicker">
            <span />
            ACADEMIC MANAGEMENT
          </span>
          <h2 id="welcome-title">
            Your campus,
            <br />
            in focus.
          </h2>
          <p>
            Less time managing records.
            <br className="desktop-break" /> More room for what comes next.
          </p>
          <Link href="/students" className="ui-button welcome-button">
            Explore students
            <Icon name="arrow" width="18" height="18" />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-dots" />
          <div className="art-sheet sheet-back" />
          <div className="art-sheet sheet-front">
            <span className="art-book">
              <Icon name="book" width="35" height="35" />
            </span>
            <span className="art-line line-wide" />
            <span className="art-line" />
            <div className="art-row">
              <span />
              <i />
              <b />
            </div>
            <div className="art-row">
              <span />
              <i />
              <b />
            </div>
            <div className="art-row">
              <span />
              <i />
              <b />
            </div>
          </div>
          <div className="art-students">
            <Icon name="students" width="26" height="26" />
          </div>
          <div className="art-spark spark-one" />
          <div className="art-spark spark-two" />
        </div>
      </section>

      {state.error && (
        <div className="dashboard-error" role="alert">
          <Icon name="warning" />
          <div>
            <strong>We couldn’t load your workspace.</strong>
            <p>{state.error}</p>
          </div>
          <button onClick={refresh} className="ui-button ui-button-secondary">
            Try again
          </button>
        </div>
      )}
      <p className="visually-hidden" role="status">
        {state.loading
          ? "Loading dashboard records."
          : state.error
            ? "Dashboard records unavailable."
            : "Dashboard records updated."}
      </p>

      <section
        className="dashboard-metrics"
        aria-label="Workspace totals"
        aria-busy={state.loading}
      >
        <Metric
          title="Total students"
          value={state.students?.length ?? null}
          caption="View student directory"
          icon="students"
          href="/students"
          tone="metric-blue"
        />
        <Metric
          title="Total courses"
          value={state.courses?.length ?? null}
          caption="Explore course catalog"
          icon="book"
          href="/courses"
          tone="metric-violet"
        />
        <Metric
          title="Catalog credits"
          value={totalCredits}
          caption="Credits across all courses"
          icon="layers"
          href="/courses"
          tone="metric-teal"
        />
      </section>

      <div className="dashboard-panels">
        <section
          className="dashboard-panel reveal"
          aria-labelledby="students-heading"
          aria-busy={state.loading}
        >
          <header className="panel-heading">
            <div>
              <h2 id="students-heading">Latest students</h2>
              <p>Recently added to your directory</p>
            </div>
            <Link href="/students" className="panel-link">
              View all
              <Icon name="arrow" width="16" height="16" />
            </Link>
          </header>
          {state.loading ? (
            <LoadingRows />
          ) : state.error ? (
            <PanelEmpty
              icon="students"
              title="Student records unavailable"
              text="Refresh the dashboard to try again."
            />
          ) : recentStudents.length === 0 ? (
            <PanelEmpty
              icon="students"
              title="A fresh start"
              text="Add your first student to get your directory going."
            />
          ) : (
            <ul className="dashboard-records">
              {recentStudents.map((student) => (
                <li key={student.id}>
                  <span className="student-initials" aria-hidden="true">
                    {student.firstName.slice(0, 1)}
                    {student.lastName.slice(0, 1)}
                  </span>
                  <div className="record-copy">
                    <strong>
                      {student.firstName} {student.lastName}
                    </strong>
                    <span>{student.email}</span>
                  </div>
                  <span className="record-code">{student.studentNumber}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/students" className="panel-action">
            <Icon name="plus" width="17" height="17" />
            Manage students
            <Icon name="arrow" width="16" height="16" />
          </Link>
        </section>

        <section
          className="dashboard-panel reveal"
          aria-labelledby="courses-heading"
          aria-busy={state.loading}
        >
          <header className="panel-heading">
            <div>
              <h2 id="courses-heading">Course catalog</h2>
              <p>Your most recently added courses</p>
            </div>
            <Link href="/courses" className="panel-link">
              View all
              <Icon name="arrow" width="16" height="16" />
            </Link>
          </header>
          {state.loading ? (
            <LoadingRows />
          ) : state.error ? (
            <PanelEmpty
              icon="book"
              title="Course records unavailable"
              text="Refresh the dashboard to try again."
            />
          ) : recentCourses.length === 0 ? (
            <PanelEmpty
              icon="book"
              title="Room to learn"
              text="Add your first course to build your catalog."
            />
          ) : (
            <ul className="dashboard-records">
              {recentCourses.map((course) => (
                <li key={course.id}>
                  <span className="course-record-icon">
                    <Icon name="book" />
                  </span>
                  <div className="record-copy">
                    <strong>{course.name}</strong>
                    <span>{course.courseCode}</span>
                  </div>
                  <span className="credit-badge">
                    {course.credits}{" "}
                    {course.credits === 1 ? "credit" : "credits"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/courses" className="panel-action">
            <Icon name="plus" width="17" height="17" />
            Manage courses
            <Icon name="arrow" width="16" height="16" />
          </Link>
        </section>
      </div>
      <div className="dashboard-data-note">
        {state.updatedAt
          ? `Last refreshed at ${state.updatedAt} · Counts reflect saved records.`
          : "Counts reflect saved student and course records."}
      </div>
    </main>
  );
}

function LoadingRows() {
  return (
    <div className="loading-rows" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div className="loading-row" key={row}>
          <span />
          <div>
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelEmpty({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <div className="panel-empty">
      <span>
        <Icon name={icon} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
