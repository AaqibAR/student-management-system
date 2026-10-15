"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import Icon, { type IconName } from "./Icon";
import RecordDialog from "./RecordDialog";
import { apiRequest } from "@/lib/api";
import { paginate, selectRecords } from "@/lib/record-list";
import type { Course, Student } from "@/lib/types";

export interface RecordEditorProps<T> {
  record: T | null;
  onSaved: (record: T) => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}

export default function RecordDirectory<T extends Student | Course>({
  title,
  singular,
  description,
  icon,
  endpoint,
  nameOf,
  codeOf,
  searchHint,
  sorts,
  columns,
  renderForm,
  summary,
}: {
  title: string;
  singular: string;
  description: string;
  icon: IconName;
  endpoint: string;
  nameOf: (record: T) => string;
  codeOf: (record: T) => string;
  searchHint: string;
  sorts: { value: string; label: string }[];
  columns: { label: string; render: (record: T) => ReactNode }[];
  renderForm: (props: RecordEditorProps<T>) => ReactNode;
  summary: (records: T[]) => { label: string; value: number; icon: IconName }[];
}) {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editor, setEditor] = useState<{ record: T | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const deleteLock = useRef(false);
  const [deleteError, setDeleteError] = useState("");
  const [success, setSuccess] = useState("");
  const collection = title.toLowerCase();
  const canMutate = isAdmin && !loading && !error;

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<T[]>(endpoint, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setRecords(data);
          setLoading(false);
        }
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          failure instanceof Error
            ? failure.message
            : `Unable to load ${collection}.`,
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint, reload, collection]);

  function refresh() {
    setError("");
    setLoading(true);
    setSuccess("");
    setReload((value) => value + 1);
  }
  function openEditor(record: T | null) {
    if (!canMutate) return;
    setSuccess("");
    setEditor({ record });
  }
  function saved(record: T) {
    const adding = !editor?.record;
    setRecords((current) =>
      current.some((item) => item.id === record.id)
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current],
    );
    setSaving(false);
    setEditor(null);
    if (adding) {
      setQuery("");
      setSort("newest");
      setPage(1);
    }
    setSuccess(`${singular} ${adding ? "added" : "updated"} successfully.`);
  }
  async function remove() {
    if (!deleting || !isAdmin || deleteLock.current) return;
    deleteLock.current = true;
    setDeletingBusy(true);
    setDeleteError("");
    try {
      await apiRequest<void>(`${endpoint}/${deleting.id}`, {
        method: "DELETE",
      });
      setRecords((current) =>
        current.filter((item) => item.id !== deleting.id),
      );
      setDeleting(null);
      setSuccess(`${singular} deleted successfully.`);
    } catch (failure) {
      setDeleteError(
        failure instanceof Error
          ? failure.message
          : "Unable to delete. Please try again.",
      );
    } finally {
      setDeletingBusy(false);
      deleteLock.current = false;
    }
  }

  const matches = selectRecords(records, query, sort);
  const pagination = paginate(matches, page, pageSize);
  const hasQuery = !!query.trim();
  function actions(record: T) {
    return isAdmin ? (
      <div className="record-row-actions">
        <button
          type="button"
          className="record-action"
          disabled={!canMutate}
          onClick={() => openEditor(record)}
          aria-label={`Edit ${nameOf(record)} (${codeOf(record)})`}
        >
          <Icon name="edit" width="15" height="15" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          className="record-action is-danger"
          disabled={!canMutate}
          onClick={() => {
            setSuccess("");
            setDeleteError("");
            setDeleting(record);
          }}
          aria-label={`Delete ${nameOf(record)} (${codeOf(record)})`}
        >
          <Icon name="trash" width="15" height="15" />
          <span>Delete</span>
        </button>
      </div>
    ) : null;
  }

  return (
    <main className="directory-page">
      <header className="directory-heading">
        <div>
          <p className="page-eyebrow">ACADEMIC WORKSPACE</p>
          <h1 id="directory-heading" tabIndex={-1}>
            {title}
          </h1>
          <p>{description}</p>
        </div>
        <div className="directory-heading-actions">
          <button
            type="button"
            className="ui-button ui-button-secondary"
            onClick={refresh}
            disabled={loading}
          >
            <Icon
              name="refresh"
              className={loading ? "refresh-spinning" : ""}
            />
            <span>{loading ? "Refreshing…" : "Refresh"}</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className="ui-button record-primary"
              aria-label={`Add ${singular.toLowerCase()}`}
              disabled={!canMutate}
              onClick={() => openEditor(null)}
            >
              <Icon name="plus" />
              Add {singular.toLowerCase()}
            </button>
          )}
        </div>
      </header>

      <section className="directory-stats" aria-label={`${title} summary`}>
        {summary(records).map((stat) => (
          <div key={stat.label} className="directory-stat">
            <span className="directory-stat-icon">
              <Icon name={stat.icon} />
            </span>
            <div>
              <span>{stat.label}</span>
              <strong>
                {(loading && !records.length) || (error && !records.length)
                  ? "—"
                  : stat.value.toLocaleString("en")}
              </strong>
            </div>
          </div>
        ))}
      </section>

      {!isAdmin && (
        <p className="directory-access">
          <Icon name="lock" width="16" height="16" />
          <span>
            You have view access. An administrator can add or change records.
          </span>
        </p>
      )}
      {success && (
        <p className="record-feedback is-success" role="status">
          <Icon name="check" />
          <span>{success}</span>
          <button
            type="button"
            aria-label="Dismiss success message"
            className="record-icon-button"
            onClick={() => setSuccess("")}
          >
            <Icon name="close" width="16" height="16" />
          </button>
        </p>
      )}
      {error && (
        <div className="record-feedback is-error" role="alert">
          <Icon name="warning" />
          <div>
            <strong>Couldn’t refresh {collection}</strong>
            <p>
              {error}
              {records.length > 0
                ? " Previously loaded records are shown below."
                : ""}
            </p>
          </div>
          <button
            type="button"
            className="ui-button ui-button-secondary"
            onClick={refresh}
          >
            Try again
          </button>
        </div>
      )}

      <section
        className="directory-panel"
        aria-label={`${title} records`}
        aria-busy={loading}
      >
        <div className="directory-panel-title">
          <div>
            <h2>
              {title === "Students" ? "Student directory" : "Course catalog"}
            </h2>
            <p>
              {title === "Students"
                ? "Student details, all in one place."
                : "An organized view of your academic offering."}
            </p>
          </div>
          <span className="directory-count">
            {loading && !records.length
              ? "Loading…"
              : `${records.length} ${records.length === 1 ? singular.toLowerCase() : collection}`}
          </span>
        </div>
        <div className="directory-toolbar">
          <div className="directory-search">
            <Icon name="search" width="19" height="19" />
            <label htmlFor="record-search" className="visually-hidden">
              Search {collection}
            </label>
            <input
              id="record-search"
              type="search"
              value={query}
              placeholder={searchHint}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            {query && (
              <button
                type="button"
                className="record-icon-button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                  document.getElementById("record-search")?.focus();
                }}
              >
                <Icon name="close" width="16" height="16" />
              </button>
            )}
          </div>
          <div className="directory-sort">
            <label htmlFor="record-sort">Sort by</label>
            <select
              id="record-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              {sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="visually-hidden" role="status">
          {loading
            ? `Loading ${collection}.`
            : `${matches.length} ${collection} found. Page ${pagination.page} of ${pagination.pages}.`}
        </p>
        {loading && records.length === 0 ? (
          <div className="record-skeleton" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index}>
                <i />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error && records.length === 0 ? (
          <div className="directory-empty">
            <span className="directory-empty-icon">
              <Icon name="warning" width="27" height="27" />
            </span>
            <h3>Records are unavailable</h3>
            <p>Use “Try again” above to reload your {collection}.</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="directory-empty">
            <span className="directory-empty-icon">
              <Icon name={hasQuery ? "search" : icon} width="27" height="27" />
            </span>
            <h3>{hasQuery ? "No matching records" : `No ${collection} yet`}</h3>
            <p>
              {hasQuery
                ? "Try a different name or code, or clear your search."
                : isAdmin
                  ? `Add your first ${singular.toLowerCase()} to get started.`
                  : `New ${collection} will appear here when an administrator adds them.`}
            </p>
            {hasQuery ? (
              <button
                type="button"
                className="ui-button ui-button-secondary"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
              >
                Clear search
              </button>
            ) : (
              isAdmin && (
                <button
                  type="button"
                  className="ui-button record-primary"
                  onClick={() => openEditor(null)}
                  disabled={!canMutate}
                >
                  <Icon name="plus" />
                  Add {singular.toLowerCase()}
                </button>
              )
            )}
          </div>
        ) : (
          <>
            <div className="directory-table-wrap">
              <table className="directory-table">
                <caption className="visually-hidden">{title} records</caption>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th scope="col" key={column.label}>
                        {column.label}
                      </th>
                    ))}
                    {isAdmin && (
                      <th scope="col" className="record-actions-heading">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((record) => (
                    <tr key={record.id}>
                      {columns.map((column, index) =>
                        index === 0 ? (
                          <th scope="row" key={column.label}>
                            {column.render(record)}
                          </th>
                        ) : (
                          <td key={column.label}>{column.render(record)}</td>
                        ),
                      )}
                      {isAdmin && <td>{actions(record)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul
              className="directory-mobile-list"
              aria-label={`${title} records`}
            >
              {pagination.items.map((record) => (
                <li key={record.id} className="directory-mobile-card">
                  <div className="mobile-record-heading">
                    <span className="record-avatar">
                      <Icon name={icon} />
                    </span>
                    <div>
                      <h3>{nameOf(record)}</h3>
                      <span className="record-code-badge">
                        {codeOf(record)}
                      </span>
                    </div>
                  </div>
                  <dl>
                    {columns.slice(1).map((column) => (
                      <div key={column.label}>
                        <dt>{column.label}</dt>
                        <dd>{column.render(record)}</dd>
                      </div>
                    ))}
                  </dl>
                  {actions(record)}
                </li>
              ))}
            </ul>
          </>
        )}
        <footer className="directory-pagination">
          <div className="directory-results" aria-live="polite">
            {loading ? (
              "Refreshing records…"
            ) : error && !records.length ? (
              "Records unavailable"
            ) : (
              <>
                Showing{" "}
                <strong>
                  {pagination.start}–{pagination.end}
                </strong>{" "}
                of <strong>{matches.length}</strong>
                {hasQuery ? ` matching ${collection}` : ` ${collection}`}
              </>
            )}
          </div>
          <div className="directory-page-controls">
            <label htmlFor="record-page-size">
              Per page
              <select
                id="record-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 25].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <nav aria-label="Record pages">
              <button
                className="record-icon-button previous-page"
                type="button"
                aria-label="Previous page"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPage(pagination.page - 1)}
              >
                <Icon name="chevron" width="16" height="16" />
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="record-icon-button"
                type="button"
                aria-label="Next page"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => setPage(pagination.page + 1)}
              >
                <Icon name="chevron" width="16" height="16" />
              </button>
            </nav>
          </div>
        </footer>
      </section>

      {editor && isAdmin && (
        <RecordDialog
          title={`${editor.record ? "Edit" : "Add"} ${singular.toLowerCase()}`}
          description={`Keep ${singular.toLowerCase()} details accurate and up to date.`}
          busy={saving}
          onClose={() => {
            if (!saving) setEditor(null);
          }}
        >
          {renderForm({
            record: editor.record,
            onSaved: saved,
            onCancel: () => {
              if (!saving) setEditor(null);
            },
            onSavingChange: setSaving,
          })}
        </RecordDialog>
      )}
      {deleting && isAdmin && (
        <RecordDialog
          danger
          title={`Delete ${singular.toLowerCase()}?`}
          description="This permanently removes the record. This action cannot be undone."
          busy={deletingBusy}
          onClose={() => {
            if (!deletingBusy) setDeleting(null);
          }}
        >
          <div className="record-delete-target">
            <Icon name={icon} />
            <div>
              <strong>{nameOf(deleting)}</strong>
              <span>{codeOf(deleting)}</span>
            </div>
          </div>
          {deleteError && (
            <p className="record-feedback is-error" role="alert">
              <Icon name="warning" />
              {deleteError}
            </p>
          )}
          <footer className="record-dialog-actions">
            <button
              type="button"
              data-autofocus
              className="ui-button ui-button-secondary"
              disabled={deletingBusy}
              onClick={() => setDeleting(null)}
            >
              Keep record
            </button>
            <button
              type="button"
              className="ui-button record-danger-button"
              disabled={deletingBusy}
              onClick={remove}
            >
              <Icon name="trash" />
              {deletingBusy ? "Deleting…" : `Delete ${singular.toLowerCase()}`}
            </button>
          </footer>
        </RecordDialog>
      )}
    </main>
  );
}
