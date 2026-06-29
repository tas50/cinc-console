"use client";

import { cn } from "@/lib/utils";
import type { SortDir, SortState } from "@/lib/sort";

/** Map the active column + direction to the `aria-sort` value for a `<th>`. */
function ariaSort(
  active: boolean,
  dir: SortDir,
): "ascending" | "descending" | "none" {
  if (!active) return "none";
  return dir === "asc" ? "ascending" : "descending";
}

/**
 * Direction arrow. An explicit glyph (not color) carries the direction, and the
 * caller only renders it for the active column, so the cue is never ambiguous.
 */
function Arrow({ dir }: { dir: SortDir }) {
  return (
    <span aria-hidden="true" className="text-muted">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

/**
 * A sortable header cell for real `<table>`s. The whole cell is a button so the
 * full hit area is keyboard- and pointer-operable, and `aria-sort` on the `<th>`
 * announces the active column and direction to assistive tech.
 */
export function SortableTh({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={ariaSort(active, sort.dir)}
      className={cn("font-medium", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex w-full items-center gap-1 px-4 py-2 text-left transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {label}
        {active && <Arrow dir={sort.dir} />}
      </button>
    </th>
  );
}

/**
 * A single-field sort toggle for `<ul>` lists, where the only sortable thing is
 * the name and only the direction varies. The accessible name spells out the
 * current direction and what activating will do, so the control is meaningful
 * without relying on the arrow glyph alone.
 */
export function SortToggle({
  label,
  sort,
  onSort,
  sortKey = "name",
}: {
  label: string;
  sort: SortState;
  onSort: (key: string) => void;
  sortKey?: string;
}) {
  const ascending = sort.dir === "asc";
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label}, currently ${
        ascending ? "ascending" : "descending"
      }. Activate to sort ${ascending ? "descending" : "ascending"}.`}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-2 text-xs text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span aria-hidden="true">{label}</span>
      <Arrow dir={sort.dir} />
    </button>
  );
}
