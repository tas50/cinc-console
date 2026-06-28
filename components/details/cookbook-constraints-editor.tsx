"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DetailSection, EmptyState, KeyValueTable, isRecord } from "./primitives";
import type { ActionResult } from "@/lib/cinc/action";

// Chef cookbook version-constraint operators.
const OPERATORS = ["=", ">=", "<=", "~>", ">", "<"];
const VERSION_RE = /^\d+(\.\d+){0,2}$/; // x, x.y, or x.y.z

type Row = { id: number; cookbook: string; op: string; version: string };

function parseConstraint(raw: unknown): { op: string; version: string } {
  const m = String(raw ?? "").match(/^\s*(~>|>=|<=|=|>|<)?\s*(.*)$/);
  return { op: m?.[1] || "=", version: (m?.[2] ?? "").trim() };
}

function parseRows(data: Record<string, unknown>): Omit<Row, "id">[] {
  const cv = isRecord(data.cookbook_versions) ? data.cookbook_versions : {};
  return Object.entries(cv).map(([cookbook, c]) => ({
    cookbook,
    ...parseConstraint(c),
  }));
}

const normalize = (
  rows: { cookbook: string; op: string; version: string }[],
) =>
  JSON.stringify(
    rows.map((r) => ({
      cookbook: r.cookbook.trim(),
      op: r.op,
      version: r.version.trim(),
    })),
  );

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
}

/**
 * Edit an environment's cookbook version constraints. View-only by default with
 * a corner Edit control; editing presents one row per constraint — cookbook
 * name, an operator dropdown (so only valid operators can be chosen), and a
 * version — plus add/remove. Save is blocked until every row has a name and a
 * valid version (x, x.y, or x.y.z) with no duplicate cookbooks. Saving rebuilds
 * `cookbook_versions` as `"<op> <version>"` strings via the page's save action.
 */
export function CookbookConstraintsEditor({
  data,
  onSave,
}: {
  data: Record<string, unknown>;
  onSave: (json: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const initial = parseRows(data);
  // Seed the id counter past the initial rows (which use their index as id) so
  // ids stay unique as rows are added; never read during render (react-hooks/refs).
  const idRef = useRef(initial.length);
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((r, i) => ({ id: i, ...r })),
  );
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const names = rows.map((r) => r.cookbook.trim());
  const valid =
    rows.every((r) => r.cookbook.trim() && VERSION_RE.test(r.version.trim())) &&
    new Set(names).size === names.length;
  const dirty = normalize(rows) !== normalize(initial);

  const update = (id: number, patch: Partial<Row>) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: number) => setRows(rows.filter((r) => r.id !== id));
  const addRow = () =>
    setRows([...rows, { id: idRef.current++, cookbook: "", op: ">=", version: "" }]);

  function cancel() {
    setRows(initial.map((r) => ({ id: idRef.current++, ...r })));
    setStatus(null);
    setEditing(false);
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const cookbook_versions = Object.fromEntries(
        rows.map((r) => [r.cookbook.trim(), `${r.op} ${r.version.trim()}`]),
      );
      const json = JSON.stringify({ ...data, cookbook_versions }, null, 2);
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
            onClick={() => {
              setStatus(null);
              setEditing(true);
            }}
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
      {rows.length === 0 ? (
        <EmptyState>No constraints. Add one below.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const badVersion = r.version.trim() !== "" && !VERSION_RE.test(r.version.trim());
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Cookbook"
                  placeholder="cookbook"
                  value={r.cookbook}
                  onChange={(e) => update(r.id, { cookbook: e.target.value })}
                  disabled={pending}
                  className="w-40 font-mono text-xs"
                />
                <select
                  aria-label="Operator"
                  value={r.op}
                  onChange={(e) => update(r.id, { op: e.target.value })}
                  disabled={pending}
                  className="rounded-md border border-border bg-bg px-2 py-2 font-mono text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {OPERATORS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="Version"
                  placeholder="1.0.0"
                  value={r.version}
                  onChange={(e) => update(r.id, { version: e.target.value })}
                  disabled={pending}
                  aria-invalid={badVersion ? true : undefined}
                  className="w-28 font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  className="px-2 text-danger hover:text-danger"
                  aria-label={`Remove ${r.cookbook.trim() || "constraint"}`}
                  disabled={pending}
                  onClick={() => removeRow(r.id)}
                >
                  ✕
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="secondary" onClick={addRow} disabled={pending}>
        + Add constraint
      </Button>

      {rows.length > 0 && !valid && (
        <p className="text-xs text-muted">
          Each row needs a unique cookbook name and a version like{" "}
          <span className="font-mono">1.0</span> or{" "}
          <span className="font-mono">1.2.3</span>.
        </p>
      )}
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
