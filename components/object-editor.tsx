"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JsonEditor } from "./json-editor";
import { Button } from "./ui/button";
import type { ActionResult } from "@/lib/cinc/action";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to do that in this organization.";
  return error;
}

/**
 * Reusable detail/edit surface for an object. Save and Delete are server
 * actions passed in by the page; their result drives the inline status. A 403
 * from the server surfaces as a permission message rather than an error page.
 */
export function ObjectEditor({
  name,
  initialJson,
  details,
  onSave,
  onDelete,
  backHref,
  readOnly = false,
}: {
  name: string;
  initialJson: string;
  /**
   * Curated human-readable view. When provided it is shown by default and the
   * raw JSON becomes an escape hatch reached via the toggle. Without it the
   * editor falls back to JSON-only.
   */
  details?: ReactNode;
  onSave?: (json: string) => Promise<ActionResult>;
  onDelete?: () => Promise<ActionResult>;
  backHref: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [json, setJson] = useState(initialJson);
  const [valid, setValid] = useState(true);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  // Show the curated view first when we have one; JSON is the escape hatch.
  const [mode, setMode] = useState<"details" | "json">(
    details ? "details" : "json",
  );
  const showingJson = mode === "json" || !details;

  function save() {
    if (!onSave) return;
    setStatus(null);
    startTransition(async () => {
      const res = await onSave(json);
      if ("ok" in res) {
        setStatus({ kind: "ok", text: "Saved." });
        router.refresh();
      } else {
        setStatus({ kind: "err", text: explain(res.error) });
      }
    });
  }

  function remove() {
    if (!onDelete) return;
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setStatus(null);
    startTransition(async () => {
      const res = await onDelete();
      if ("ok" in res) {
        router.push(backHref);
        router.refresh();
      } else {
        setStatus({ kind: "err", text: explain(res.error) });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href={backHref} className="text-sm text-muted hover:text-text">
            ← back
          </Link>
          <h1 className="font-mono text-xl font-semibold">{name}</h1>
        </div>
        <div className="flex gap-2">
          {details && (
            <Button
              variant="secondary"
              onClick={() => setMode(showingJson ? "details" : "json")}
            >
              {showingJson ? "View details" : readOnly ? "View JSON" : "Edit JSON"}
            </Button>
          )}
          {!readOnly && onDelete && (
            <Button variant="danger" onClick={remove} disabled={pending}>
              Delete
            </Button>
          )}
          {!readOnly && onSave && showingJson && (
            <Button onClick={save} disabled={pending || !valid}>
              {pending ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </div>

      {status && (
        <p
          role="alert"
          className={status.kind === "ok" ? "text-sm text-success" : "text-sm text-danger"}
        >
          {status.text}
        </p>
      )}

      {showingJson ? (
        <JsonEditor
          value={json}
          onChange={setJson}
          onValidityChange={setValid}
          readOnly={readOnly}
        />
      ) : (
        details
      )}
    </div>
  );
}
