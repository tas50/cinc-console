"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "./primitives";
import type { ActionResult } from "@/lib/cinc/action";

function toItems(data: Record<string, unknown>): string[] {
  return Array.isArray(data.run_list) ? data.run_list.map(String) : [];
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
}

/**
 * A node's or role's ordered run list. View-only by default — order matters
 * (Chef applies it top to bottom) so it renders as a numbered list — with an
 * explicit Edit affordance that reveals add / remove / reorder controls plus
 * Save and Cancel. Cancel reverts to the last-saved list. Saving merges the new
 * run_list into the object and delegates to the page's save action.
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
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);

  function startEdit() {
    setStatus(null);
    setEditing(true);
  }

  function cancel() {
    setItems(initial);
    setEntry("");
    setStatus(null);
    setEditing(false);
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = entry.trim();
    if (!v) return;
    setItems([...items, v]);
    setEntry("");
  }

  function removeAt(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
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

  // Read-only view: the ordered list plus an Edit affordance.
  if (!editing) {
    return (
      <div className="space-y-3">
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
        <Button variant="secondary" onClick={startEdit}>
          <PencilIcon />
          Edit run list
        </Button>
      </div>
    );
  }

  // Edit view: add / remove / reorder, then Save or Cancel.
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState>Empty run list. Add an entry below.</EmptyState>
      ) : (
        <ol className="space-y-1">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-2 rounded bg-surface-2 px-2 py-1"
            >
              <span
                aria-hidden="true"
                className="w-6 select-none font-mono text-xs tabular-nums text-muted"
              >
                {i + 1}.
              </span>
              <span className="flex-1 font-mono text-xs text-text">{item}</span>
              <Button
                variant="ghost"
                className="px-2"
                disabled={pending || i === 0}
                aria-label={`Move ${item} up`}
                onClick={() => move(i, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                className="px-2"
                disabled={pending || i === items.length - 1}
                aria-label={`Move ${item} down`}
                onClick={() => move(i, 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                className="px-2 text-danger hover:text-danger"
                disabled={pending}
                aria-label={`Remove ${item}`}
                onClick={() => removeAt(i)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="recipe[cookbook::recipe] or role[name]"
          aria-label="New run list entry"
          className="flex-1 font-mono text-xs"
          disabled={pending}
        />
        <Button type="submit" variant="secondary" disabled={pending || !entry.trim()}>
          Add
        </Button>
      </form>

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
    </div>
  );
}
