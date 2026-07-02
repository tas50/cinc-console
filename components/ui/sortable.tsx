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
  // Plain identifier comparison: `key` here is a sort-column id ("node",
  // "status", …), never a secret — so `===` is correct (a security scanner's
  // timing-attack heuristic flags this on the `key` name alone; it's a false
  // positive, dismissed in the Security tab).
  const active = sort.key === sortKey; // nosemgrep: js-timing-attack-string-comparison
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
