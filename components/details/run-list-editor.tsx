"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailSection, EmptyState } from "./primitives";
import { RunListField } from "./run-list-field";
import type { ActionResult } from "@/lib/cinc/action";

function toItems(data: Record<string, unknown>): string[] {
  return Array.isArray(data.run_list) ? data.run_list.map(String) : [];
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="currentColor"
    >
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
}

/**
 * A node's or role's ordered run list, rendered as its own detail section.
 * View-only by default with a small "Edit" control in the section's corner;
 * editing reveals add / remove / reorder plus Save and Cancel. Cancel reverts
 * to the last-saved list. Saving merges run_list into the object and delegates
 * to the page's save action.
 */
export function RunListEditor({
  data,
  onSave,
}: {
  data: Record<string, unknown>;
  onSave: (json: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const initial = toItems(data);
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<string[]>(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);

  function cancel() {
    setItems(initial);
    setStatus(null);
    setEditing(false);
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const json = JSON.stringify({ ...data, run_list: items }, null, 2);
      const res = await onSave(json);
      if ("ok" in res) {
        setStatus({ kind: "ok", text: "Run list saved." });
        setEditing(false);
        router.refresh();
      } else {
        setStatus({
          kind: "err",
          text:
            res.error === "forbidden"
              ? "You don't have permission to edit this."
              : res.error,
        });
      }
    });
  }

  // Read-only: ordered list with a small Edit control tucked in the corner.
  if (!editing) {
    return (
      <DetailSection
        title="Run list"
        action={
          <button
            type="button"
            onClick={() => {
              setStatus(null);
              setEditing(true);
            }}
            aria-label="Edit run list"
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PencilIcon />
            Edit
          </button>
        }
      >
        {items.length === 0 ? (
          <EmptyState>No run list.</EmptyState>
        ) : (
          <ol className="space-y-1">
            {items.map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="flex items-baseline gap-3 rounded bg-surface-2 px-2 py-1"
              >
                <span
                  aria-hidden="true"
                  className="select-none font-mono text-xs tabular-nums text-muted"
                >
                  {i + 1}.
                </span>
                <span className="font-mono text-xs text-text">{item}</span>
              </li>
            ))}
          </ol>
        )}
        {status?.kind === "ok" && (
          <p role="status" className="text-sm text-success">
            {status.text}
          </p>
        )}
      </DetailSection>
    );
  }

  // Edit: add / remove / reorder, then Save or Cancel.
  return (
    <DetailSection title="Run list">
      <RunListField items={items} onChange={setItems} disabled={pending} />

      {status?.kind === "err" && (
        <p role="alert" className="text-sm text-danger">
          {status.text}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save run list"}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </DetailSection>
  );
}
