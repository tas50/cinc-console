"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A dependency-light JSON editor: a monospace textarea with live validation.
 * Reports validity to the parent so Save can be disabled on invalid JSON.
 * Deliberately avoids a CDN-loaded editor so the console works air-gapped.
 */
export function JsonEditor({
  value,
  onChange,
  onValidityChange,
  readOnly = false,
  rows = 24,
}: {
  value: string;
  onChange?: (next: string) => void;
  onValidityChange?: (valid: boolean) => void;
  readOnly?: boolean;
  rows?: number;
}) {
  const [error, setError] = useState<string | null>(null);

  function handle(next: string) {
    onChange?.(next);
    try {
      JSON.parse(next);
      setError(null);
      onValidityChange?.(true);
    } catch (e) {
      setError((e as Error).message);
      onValidityChange?.(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        aria-label={readOnly ? "JSON (read-only)" : "JSON editor"}
        aria-invalid={error ? true : undefined}
        spellCheck={false}
        readOnly={readOnly}
        value={value}
        onChange={(e) => handle(e.target.value)}
        rows={rows}
        className={cn(
          "w-full rounded-md border bg-bg p-3 font-mono text-sm text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          error ? "border-danger" : "border-border",
        )}
      />
      {error && !readOnly && (
        <p role="alert" className="text-xs text-danger">
          Invalid JSON: {error}
        </p>
      )}
    </div>
  );
}
