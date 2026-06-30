"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, isRecord } from "./primitives";
import { cn } from "@/lib/utils";

// Chef cookbook version-constraint operators.
const OPERATORS = ["=", ">=", "<=", "~>", ">", "<"];
// A constraint's version is parsed as a Chef::Version, which requires at least
// major.minor — it matches `x.y.z` or `x.y` and rejects a bare `x` (or any
// non-numeric junk). Mirror that here so the editor only allows what the server
// will accept.
const VERSION_RE = /^\d+\.\d+(\.\d+)?$/; // x.y or x.y.z

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

function serialize(
  rows: { cookbook: string; op: string; version: string }[],
): Record<string, string> {
  return Object.fromEntries(
    rows.map((r) => [r.cookbook.trim(), `${r.op} ${r.version.trim()}`]),
  );
}

/** Normalize a stored `cookbook_versions` map through the same parse/serialize
 * round-trip the editor applies, so callers can compare against edited state. */
export function constraintsToVersions(
  data: Record<string, unknown>,
): Record<string, string> {
  return serialize(parseRows(data));
}

function rowsValid(rows: Row[]): boolean {
  const names = rows.map((r) => r.cookbook.trim());
  return (
    rows.every((r) => r.cookbook.trim() && VERSION_RE.test(r.version.trim())) &&
    new Set(names).size === names.length
  );
}

/**
 * Controlled cookbook version-constraint editor with no save chrome. One row per
 * constraint — cookbook name, an operator dropdown (so only valid operators are
 * possible), and a version — plus add/remove. Reports the serialized
 * `cookbook_versions` map via `onChange` and whether every row is complete and
 * valid (name present, version `x.y`/`x.y.z`, no duplicate cookbooks) via
 * `onValidityChange`. Used by CookbookConstraintsEditor (which adds the save
 * lifecycle) and the create form (which collects it into a draft).
 */
export function CookbookConstraintsField({
  data,
  onChange,
  onValidityChange,
  disabled = false,
}: {
  data: Record<string, unknown>;
  onChange: (versions: Record<string, string>) => void;
  onValidityChange?: (valid: boolean) => void;
  disabled?: boolean;
}) {
  const initial = parseRows(data);
  // Seed the id counter past the initial rows (which use their index as id) so
  // ids stay unique as rows are added; never read during render (react-hooks/refs).
  const idRef = useRef(initial.length);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((r, i) => ({ id: i, ...r })),
  );

  function commit(next: Row[]) {
    setRows(next);
    onChange(serialize(next));
    onValidityChange?.(rowsValid(next));
  }

  const update = (id: number, patch: Partial<Row>) =>
    commit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: number) => commit(rows.filter((r) => r.id !== id));
  const addRow = () =>
    commit([...rows, { id: idRef.current++, cookbook: "", op: ">=", version: "" }]);

  return (
    <>
      {rows.length === 0 ? (
        <EmptyState>No constraints. Add one below.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const badVersion =
              r.version.trim() !== "" && !VERSION_RE.test(r.version.trim());
            const errorId = `version-error-${r.id}`;
            return (
              <li key={r.id} className="space-y-1">
                {/* The Input/select fill width-sized wrappers; the project's
                    `cn` doesn't merge Tailwind classes, so a fixed `w-*` on the
                    input would lose to its base `w-full`. Sizing the wrapper
                    sidesteps that conflict. */}
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 max-w-xs">
                    <Input
                      aria-label="Cookbook"
                      placeholder="cookbook"
                      value={r.cookbook}
                      onChange={(e) => update(r.id, { cookbook: e.target.value })}
                      disabled={disabled}
                      className="font-mono text-xs"
                    />
                  </div>
                  <select
                    aria-label="Operator"
                    value={r.op}
                    onChange={(e) => update(r.id, { op: e.target.value })}
                    disabled={disabled}
                    className="shrink-0 rounded-md border border-border bg-bg px-2 py-2 font-mono text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {OPERATORS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <div className="w-24 shrink-0">
                    <Input
                      aria-label="Version"
                      placeholder="1.0.0"
                      value={r.version}
                      onChange={(e) => update(r.id, { version: e.target.value })}
                      disabled={disabled}
                      aria-invalid={badVersion ? true : undefined}
                      aria-describedby={badVersion ? errorId : undefined}
                      className={cn(
                        "font-mono text-xs",
                        badVersion && "border-danger focus-visible:ring-danger",
                      )}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    className="shrink-0 px-2 text-danger hover:text-danger"
                    aria-label={`Remove ${r.cookbook.trim() || "constraint"}`}
                    disabled={disabled}
                    onClick={() => removeRow(r.id)}
                  >
                    ✕
                  </Button>
                </div>
                {badVersion && (
                  <p id={errorId} role="alert" className="text-xs text-danger">
                    Enter a version like <span className="font-mono">1.0</span> or{" "}
                    <span className="font-mono">1.2.3</span>.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="secondary" onClick={addRow} disabled={disabled}>
        + Add constraint
      </Button>

      {rows.length > 0 && !rowsValid(rows) && (
        <p className="text-xs text-muted">
          Each row needs a unique cookbook name and a version like{" "}
          <span className="font-mono">1.0</span> or{" "}
          <span className="font-mono">1.2.3</span>.
        </p>
      )}
    </>
  );
}
