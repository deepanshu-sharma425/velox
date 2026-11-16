"use client";

import { X } from "lucide-react";

export function Field({
  label,
  error,
  children,
  className,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: React.ReactNode;
}) {
  return (
    <label className={`mfield ${error ? "has-error" : ""} ${className ?? ""}`}>
      <span className="mfield-label">
        {label}
        {hint && <span className="mfield-hint">{hint}</span>}
      </span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Shell({
  title,
  children,
  wide,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div data-lenis-prevent className={`modal glass ${wide ? "is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X strokeWidth={1.3} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
