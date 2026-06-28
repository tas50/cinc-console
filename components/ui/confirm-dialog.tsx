"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible confirmation modal. Replaces native confirm() so destructive and
 * high-consequence actions get a styled, contextual prompt.
 *
 * WCAG 2.2 AA: role=dialog + aria-modal, focus moves into the dialog on open
 * and is trapped within it, Escape and a backdrop click cancel, and focus is
 * restored to the trigger on close.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));

    // Land on the confirm button (last control) so a quick Enter confirms.
    const els = focusable();
    (els[els.length - 1] ?? dialogRef.current)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusable();
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-xl focus-visible:outline-none"
      >
        <h2 className="mb-3 text-base font-semibold">{title}</h2>
        {children && <div className="mb-4 text-sm text-muted">{children}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
