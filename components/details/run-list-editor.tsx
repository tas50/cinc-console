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

/**
 * Inline editor for a node's or role's ordered run list: add, remove, and
 * reorder entries, then save. Order matters (Chef applies it top to bottom), so
 * it renders as a numbered ordered list with move up/down controls. On save it
 * merges the new run_list into the object and delegates to the page's save
 * action, so it reuses the same server path as JSON editing.
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
  const [items, setItems] = useState<string[]>(initial);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = entry.trim();
    if (!v) return;
    setItems([...items, v]);
    setEntry("");
    setStatus(null);
  }

  function removeAt(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
    setStatus(null);
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setStatus(null);
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const json = JSON.stringify({ ...data, run_list: items }, null, 2);
      const res = await onSave(json);
      if ("ok" in res) {
        setStatus({ kind: "ok", text: "Run list saved." });
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

      {status && (
        <p
          role={status.kind === "ok" ? "status" : "alert"}
          className={status.kind === "ok" ? "text-sm text-success" : "text-sm text-danger"}
        >
          {status.text}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save run list"}
        </Button>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </div>
  );
}
