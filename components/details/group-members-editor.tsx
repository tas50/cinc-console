"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DetailSection, EmptyState } from "./primitives";
import type { ActionResult } from "@/lib/cinc/action";

const CATEGORIES = [
  { key: "users", label: "Users", noun: "user", placeholder: "username" },
  { key: "clients", label: "Clients", noun: "client", placeholder: "client name" },
  { key: "groups", label: "Groups", noun: "group", placeholder: "group name" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];
type Members = Record<CategoryKey, string[]>;
export type GroupOptions = Partial<Record<CategoryKey, string[]>>;

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
}

/** A category heading, visually distinct from the section header above it. */
function CategoryHeading({ label, count }: { label: string; count: number }) {
  return (
    <h3 className="text-sm font-medium text-text">
      {label} <span className="font-normal text-muted">({count})</span>
    </h3>
  );
}

function MemberList({
  label,
  noun,
  placeholder,
  items,
  options,
  onChange,
  disabled,
}: {
  label: string;
  noun: string;
  placeholder: string;
  items: string[];
  /** Valid values to choose from. When set, only these can be added. */
  options?: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}) {
  const [entry, setEntry] = useState("");
  const trimmed = entry.trim();
  const listId = `group-${label.toLowerCase()}-options`;
  const available = options?.filter((o) => !items.includes(o));
  const invalid = !!options && trimmed !== "" && !options.includes(trimmed);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || items.includes(trimmed) || invalid) {
      if (items.includes(trimmed)) setEntry("");
      return;
    }
    onChange([...items, trimmed]);
    setEntry("");
  }

  return (
    <div className="space-y-2">
      <CategoryHeading label={label} count={items.length} />
      {items.length === 0 ? (
        <EmptyState>None.</EmptyState>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((m) => (
            <li
              key={m}
              className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-1 font-mono text-xs text-text"
            >
              {m}
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== m))}
                disabled={disabled}
                aria-label={`Remove ${m} from ${label}`}
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
          placeholder={placeholder}
          aria-label={`Add to ${label}`}
          list={available ? listId : undefined}
          autoComplete="off"
          className="flex-1 font-mono text-xs"
          disabled={disabled}
        />
        {available && (
          <datalist id={listId}>
            {available.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
        <Button
          type="submit"
          variant="secondary"
          disabled={disabled || !trimmed || invalid}
        >
          Add
        </Button>
      </form>
      {invalid && (
        <p className="text-xs text-muted">
          No {noun} named <span className="font-mono">{trimmed}</span> in this
          organization — pick one from the list.
        </p>
      )}
    </div>
  );
}

/**
 * Structured membership editing for a group — users, clients, and nested
 * groups — without touching raw JSON. View-only by default with a corner Edit
 * control; editing reveals add/remove per category. When `options` are supplied
 * a category only accepts valid values (with autocomplete), so you can't add a
 * non-existent user. Cancel reverts. Saving merges the three lists back into the
 * group object via the page's save action. `actors` is server-derived and shown
 * read-only elsewhere, so it isn't edited.
 */
export function GroupMembersEditor({
  data,
  onSave,
  options,
}: {
  data: Record<string, unknown>;
  onSave: (json: string) => Promise<ActionResult>;
  options?: GroupOptions;
}) {
  const router = useRouter();
  const initial: Members = {
    users: arr(data.users),
    clients: arr(data.clients),
    groups: arr(data.groups),
  };
  const [editing, setEditing] = useState(false);
  const [members, setMembers] = useState<Members>(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(members) !== JSON.stringify(initial);

  function cancel() {
    setMembers(initial);
    setStatus(null);
    setEditing(false);
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const json = JSON.stringify(
        { ...data, users: members.users, clients: members.clients, groups: members.groups },
        null,
        2,
      );
      const res = await onSave(json);
      if ("ok" in res) {
        setStatus({ kind: "ok", text: "Members saved." });
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
        title="Membership"
        action={
          <button
            type="button"
            onClick={() => {
              setStatus(null);
              setEditing(true);
            }}
            aria-label="Edit members"
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PencilIcon />
            Edit
          </button>
        }
      >
        <div className="space-y-4">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="space-y-2">
              <CategoryHeading label={c.label} count={members[c.key].length} />
              {members[c.key].length === 0 ? (
                <EmptyState>None.</EmptyState>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {members[c.key].map((m) => (
                    <li
                      key={m}
                      className="rounded bg-surface-2 px-2 py-1 font-mono text-xs text-text"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        {status?.kind === "ok" && (
          <p role="status" className="text-sm text-success">
            {status.text}
          </p>
        )}
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Membership">
      <div className="space-y-5">
        {CATEGORIES.map((c) => (
          <MemberList
            key={c.key}
            label={c.label}
            noun={c.noun}
            placeholder={c.placeholder}
            items={members[c.key]}
            options={options?.[c.key]}
            disabled={pending}
            onChange={(next) => setMembers({ ...members, [c.key]: next })}
          />
        ))}
      </div>

      {status?.kind === "err" && (
        <p role="alert" className="text-sm text-danger">
          {status.text}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save members"}
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={pending}>
          Cancel
        </Button>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </DetailSection>
  );
}
