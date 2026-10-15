"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import Icon from "./Icon";

export interface RecordField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea";
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  hint?: string;
  placeholder?: string;
}

export default function RecordForm<T>({
  fields,
  values,
  path,
  editing,
  onSaved,
  onCancel,
  onSavingChange,
}: {
  fields: RecordField[];
  values: Record<string, string | number | null | undefined>;
  path: string;
  editing: boolean;
  onSaved: (record: T) => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const [focusTarget, setFocusTarget] = useState<{
    name: string | null;
  } | null>(null);

  useLayoutEffect(() => {
    if (!focusTarget || !formRef.current) return;
    const target = focusTarget.name
      ? (formRef.current.elements.namedItem(
          focusTarget.name,
        ) as HTMLElement | null)
      : formRef.current.querySelector<HTMLElement>("[data-form-error]");
    target?.focus();
  }, [focusTarget]);

  function focusError(messages: Record<string, string>) {
    const first = fields.find((field) => messages[field.name]);
    setFocusTarget({ name: first?.name ?? null });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: Record<string, string | number> = {};
    const messages: Record<string, string> = {};
    for (const field of fields) {
      const value = String(data.get(field.name) ?? "").trim();
      input[field.name] = field.type === "number" ? Number(value) : value;
      if (field.required && !value)
        messages[field.name] = `${field.label} is required.`;
      else if (field.maxLength && value.length > field.maxLength)
        messages[field.name] = `Use ${field.maxLength} characters or fewer.`;
      else if (
        value &&
        field.type === "email" &&
        (form.elements.namedItem(field.name) as HTMLInputElement).validity
          .typeMismatch
      )
        messages[field.name] = "Enter a valid email address.";
      else if (
        field.type === "number" &&
        value &&
        (!Number.isInteger(Number(value)) ||
          Number(value) < (field.min ?? -Infinity) ||
          Number(value) > (field.max ?? Infinity))
      )
        messages[field.name] =
          `Enter a whole number between ${field.min} and ${field.max}.`;
    }
    setErrors(messages);
    setError("");
    if (Object.keys(messages).length) {
      focusError(messages);
      return;
    }
    submitting.current = true;
    setSaving(true);
    onSavingChange(true);
    try {
      const record = await apiRequest<T>(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(input),
      });
      onSavingChange(false);
      onSaved(record);
    } catch (failure) {
      const fieldErrors = failure instanceof ApiError ? failure.fields : {};
      setErrors(fieldErrors);
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to save. Please try again.",
      );
      setSaving(false);
      onSavingChange(false);
      submitting.current = false;
      focusError(fieldErrors);
    }
  }

  return (
    <form ref={formRef} className="record-form" onSubmit={submit} noValidate>
      <p className="record-required-note">
        Fields marked <span aria-hidden="true">*</span> are required.
      </p>
      <fieldset disabled={saving} className="record-form-grid">
        <legend className="visually-hidden">Record details</legend>
        {fields.map((field, index) => {
          const id = `record-${field.name}`;
          const common = {
            id,
            name: field.name,
            defaultValue: values[field.name] ?? "",
            required: field.required,
            "aria-invalid": errors[field.name] ? (true as const) : undefined,
            "aria-describedby":
              `${field.hint ? `${id}-hint ` : ""}${errors[field.name] ? `${id}-error` : ""}`.trim() ||
              undefined,
            "data-autofocus": index === 0 ? true : undefined,
            onChange: () => {
              if (errors[field.name])
                setErrors((current) => {
                  const next = { ...current };
                  delete next[field.name];
                  return next;
                });
            },
            className: "record-input",
            placeholder: field.placeholder,
          };
          return (
            <div
              key={field.name}
              className={`record-field ${field.type === "textarea" ? "record-field-wide" : ""}`}
            >
              <label htmlFor={id}>
                {field.label}
                {field.required ? (
                  <span aria-hidden="true"> *</span>
                ) : (
                  <small> Optional</small>
                )}
              </label>
              {field.type === "textarea" ? (
                <textarea {...common} rows={4} maxLength={field.maxLength} />
              ) : (
                <input
                  {...common}
                  type={field.type ?? "text"}
                  maxLength={field.maxLength}
                  min={field.min}
                  max={field.max}
                  step={field.type === "number" ? 1 : undefined}
                />
              )}
              {field.hint && (
                <p id={`${id}-hint`} className="record-field-hint">
                  {field.hint}
                </p>
              )}
              {errors[field.name] && (
                <p
                  id={`${id}-error`}
                  className="record-field-error"
                  role="alert"
                >
                  {errors[field.name]}
                </p>
              )}
            </div>
          );
        })}
      </fieldset>
      {error && (
        <p
          role="alert"
          tabIndex={-1}
          data-form-error
          className="record-feedback is-error"
        >
          <Icon name="warning" />
          {error}
        </p>
      )}
      <footer className="record-dialog-actions">
        <button
          type="button"
          className="ui-button ui-button-secondary"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="ui-button record-primary"
          disabled={saving}
        >
          <Icon
            name={saving ? "refresh" : "check"}
            className={saving ? "refresh-spinning" : ""}
          />
          {saving ? "Saving…" : editing ? "Save changes" : "Create record"}
        </button>
      </footer>
    </form>
  );
}
