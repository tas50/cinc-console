"use client";

import Link from "next/link";
import { RemoveUserButton } from "./remove-user-button";
import { SortToggle } from "@/components/ui/sortable";
import { useSort } from "@/components/ui/use-sort";
import { applyDir, byString, type SortState } from "@/lib/sort";
import type { ActionResult } from "@/lib/cinc/action";

// Both lists sort by name only; each takes its own URL param so the Users and
// Groups sorts on this one page don't collide.
const KEYS = ["name"] as const;
const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

/** A user row plus its pre-bound remove action (created on the server). */
export type UserItem = { name: string; onRemove: () => Promise<ActionResult> };

export function UsersList({ items }: { items: UserItem[] }) {
  const { sort, setSort } = useSort("users", DEFAULT_SORT, KEYS);
  const sorted = [...items].sort((a, b) =>
    applyDir(byString(a.name, b.name), sort.dir),
  );
  return (
    <div className="space-y-2">
      <SortToggle label="Username" sort={sort} onSort={setSort} />
      <div className="overflow-hidden rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {sorted.map((u) => (
            <li
              key={u.name}
              className="flex items-center justify-between px-4 py-2"
            >
              <span className="font-mono text-sm text-text">{u.name}</span>
              <RemoveUserButton username={u.name} onRemove={u.onRemove} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function GroupsList({
  basePath,
  names,
}: {
  basePath: string;
  names: string[];
}) {
  const { sort, setSort } = useSort("groups", DEFAULT_SORT, KEYS);
  const sorted = [...names].sort((a, b) => applyDir(byString(a, b), sort.dir));
  return (
    <div className="space-y-2">
      <SortToggle label="Name" sort={sort} onSort={setSort} />
      <div className="overflow-hidden rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {sorted.map((name) => (
            <li key={name}>
              <Link
                href={`${basePath}/groups/${encodeURIComponent(name)}`}
                className="block px-4 py-2 font-mono text-sm text-text hover:bg-surface-2"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
