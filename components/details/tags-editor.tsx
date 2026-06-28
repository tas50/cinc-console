"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DetailSection, EmptyState, Chips, isRecord } from "./primitives";
import type { ActionResult } from "@/lib/cinc/action";

function toTags(data: Record<string, unknown>): string[] {
  const normal = isRecord(data.normal) ? data.normal : {};
  return Array.isArray(normal.tags) ? normal.tags.map(String) : [];
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
}

/**
 * A node's tags (`normal.tags`), editable in place. View-only by default with a
 * small corner Edit control; editing lets you add and remove tags (order is
 * insignificant, so there's no reorder). Cancel reverts. Saving merges the tags
 * back under `normal.tags` and delegates to the page's save action.
 */
export function TagsEditor({
  data,
  onSave,
}: {
  data: Record<string, unknown>;
  onSave: (json: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const initial = toTags(data);
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(initial);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(tags) !== JSON.stringify(initial);

  function cancel() {
    setTags(initial);
    setEntry("");
    setStatus(null);
    setEditing(false);
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = entry.trim();
    if (!v || tags.includes(v)) {
      setEntry("");
      return;
    }
    setTags([...tags, v]);
    setEntry("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const normal = isRecord(data.normal) ? data.normal : {};
      const json = JSON.stringify(
        { ...data, normal: { ...normal, tags } },
        null,
        2,
      );
      const res = await onSave(json);
      if ("ok" in res) {
        setStatus({ kind: "ok", text: "Tags saved." });
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
        title="Tags"
        action={
          <button
            type="button"
            onClick={() => {
              setStatus(null);
              setEditing(true);
            }}
            aria-label="Edit tags"
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PencilIcon />
            Edit
          </button>
        }
      >
        <Chips items={tags} empty="No tags." />
        {status?.kind === "ok" && (
          <p role="status" className="text-sm text-success">
            {status.text}
          </p>
        )}
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Tags">
      {tags.length === 0 ? (
        <EmptyState>No tags. Add one below.</EmptyState>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-1 text-xs text-text"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={pending}
                aria-label={`Remove tag ${tag}`}
                className="text-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="add a tag"
          aria-label="New tag"
          className="flex-1 text-sm"
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
          {pending ? "Saving…" : "Save tags"}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </DetailSection>
  );
}
