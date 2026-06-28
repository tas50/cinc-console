"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function ClipboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M10 1.5H6a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5zm-5 0A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5H12a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3.5a2 2 0 0 1 2-2h1z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M13.485 1.929a.75.75 0 0 1 .086 1.057l-7 8.5a.75.75 0 0 1-1.114.052l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.917 2.916 6.494-7.88a.75.75 0 0 1 1.057-.085z" />
    </svg>
  );
}

/**
 * Copies `value` to the clipboard and shows a brief "Copied" confirmation.
 * `iconOnly` renders a compact icon (with an accessible name) for dense spots
 * like attribute-tree leaves; otherwise it shows a label too.
 */
export function CopyButton({
  value,
  label = "Copy",
  iconOnly = false,
  className,
}: {
  value: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure context / permissions) — leave state as-is.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className={cn(
        "inline-flex items-center gap-1 rounded text-xs text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
      {!iconOnly && <span aria-hidden="true">{copied ? "Copied" : label}</span>}
    </button>
  );
}
