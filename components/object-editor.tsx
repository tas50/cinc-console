"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JsonEditor } from "./json-editor";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { JsonDiffView } from "./json-diff-view";
import { diffJson } from "@/lib/json-diff";
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
  titleIcon,
  initialJson,
  details,
  onSave,
  onDelete,
  backHref,
  readOnly = false,
}: {
  name: string;
  /** Optional glyph shown to the left of the name (e.g. a node's platform). */
  titleIcon?: ReactNode;
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  // Show the curated view first when we have one; JSON is the escape hatch.
  const [mode, setMode] = useState<"details" | "json">(
    details ? "details" : "json",
  );
  const showingJson = mode === "json" || !details;

  // What the current edit would change relative to the value on the server.
  // null when the edited JSON doesn't parse (Save is disabled in that case).
  const diff = useMemo(() => {
    try {
      return diffJson(JSON.parse(initialJson), JSON.parse(json));
    } catch {
      return null;
    }
  }, [initialJson, json]);

  function requestSave() {
    if (!onSave || !valid) return;
    if (!diff || diff.length === 0) {
      setStatus({ kind: "ok", text: "No changes to save." });
      return;
    }
    setStatus(null);
    setConfirmSave(true);
  }

  function save() {
    setConfirmSave(false);
    if (!onSave) return;
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
    setConfirmDelete(false);
    if (!onDelete) return;
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
          <div className="flex items-center gap-2">
            {titleIcon}
            <h1 className="font-mono text-xl font-semibold">{name}</h1>
          </div>
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
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              Delete
            </Button>
          )}
          {!readOnly && onSave && showingJson && (
            <Button onClick={requestSave} disabled={pending || !valid}>
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

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${name}?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      >
        This permanently deletes <span className="font-mono">{name}</span> from
        the server. This cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmSave}
        title="Apply changes?"
        confirmLabel="Apply"
        onConfirm={save}
        onCancel={() => setConfirmSave(false)}
      >
        <p className="mb-2">
          Review what will change on the server before saving:
        </p>
        {diff && <JsonDiffView lines={diff} />}
      </ConfirmDialog>
    </div>
  );
}
