"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailSection, KeyValueTable } from "./primitives";
import {
  CookbookConstraintsField,
  constraintsToVersions,
} from "./cookbook-constraints-field";
import type { ActionResult } from "@/lib/cinc/action";

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
}

/**
 * Edit an environment's cookbook version constraints. View-only by default with
 * a corner Edit control; editing presents the controlled CookbookConstraintsField
 * (one row per constraint) plus Save / Cancel. Save is blocked until the rows are
 * valid and differ from what's stored, then saves the rebuilt `cookbook_versions`
 * map via the page's save action.
 */
export function CookbookConstraintsEditor({
  data,
  onSave,
}: {
  data: Record<string, unknown>;
  onSave: (json: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const initialVersions = constraintsToVersions(data);
  const [editing, setEditing] = useState(false);
  const [versions, setVersions] = useState<Record<string, string>>(initialVersions);
  const [valid, setValid] = useState(true);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(versions) !== JSON.stringify(initialVersions);

  function startEditing() {
    setStatus(null);
    setVersions(initialVersions);
    setValid(true);
    setEditing(true);
  }

  function cancel() {
    setVersions(initialVersions);
    setValid(true);
    setStatus(null);
    setEditing(false);
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const json = JSON.stringify({ ...data, cookbook_versions: versions }, null, 2);
      const res = await onSave(json);
      if ("ok" in res) {
        setStatus({ kind: "ok", text: "Constraints saved." });
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

  if (!editing) {
    return (
      <DetailSection
        title="Cookbook version constraints"
        action={
          <button
            type="button"
            onClick={startEditing}
            aria-label="Edit cookbook constraints"
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PencilIcon />
            Edit
          </button>
        }
      >
        <KeyValueTable
          data={data.cookbook_versions}
          emptyText="No version constraints."
        />
        {status?.kind === "ok" && (
          <p role="status" className="text-sm text-success">
            {status.text}
          </p>
        )}
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Cookbook version constraints">
      <CookbookConstraintsField
        data={data}
        onChange={setVersions}
        onValidityChange={setValid}
        disabled={pending}
      />

      {status?.kind === "err" && (
        <p role="alert" className="text-sm text-danger">
          {status.text}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={pending || !dirty || !valid}>
          {pending ? "Saving…" : "Save constraints"}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </DetailSection>
  );
}
