"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Icon from "./Icon";

export default function RecordDialog({
  title,
  description,
  busy = false,
  onClose,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else document.getElementById("directory-heading")?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className={`record-dialog ${danger ? "record-dialog-danger" : ""}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="record-dialog-heading">
        <div>
          <p className="page-eyebrow">
            {danger ? "CONFIRM DELETION" : "RECORD DETAILS"}
          </p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          type="button"
          className="record-icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <p className="record-dialog-description" id={descriptionId}>
        {description}
      </p>
      {children}
    </dialog>
  );
}
