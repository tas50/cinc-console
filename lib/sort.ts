// Pure comparator helpers and sort-state (de)serialization for the app's
// sortable lists. No React and no I/O — unit-tested like lib/cinc/fleet.ts. The
// UI layer (the useSort hook and the SortableTh/SortToggle components) reads the
// chosen {key, dir} from the URL and applies the matching comparator from here.

export type SortDir = "asc" | "desc";

/** Which column a list is sorted by, and in which direction. */
export type SortState = { key: string; dir: SortDir };

/**
 * Parse a `key.dir` query value (e.g. "lastSeen.desc"). Falls back to `def`
 * when the value is missing, malformed, or names a key outside `allowedKeys` —
 * so a hand-edited or stale URL degrades to the default sort instead of
 * breaking the list.
 */
export function parseSort(
  raw: string | null | undefined,
  def: SortState,
  allowedKeys: readonly string[],
): SortState {
  if (!raw) return def;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return def;
  const key = raw.slice(0, dot);
  const dir = raw.slice(dot + 1);
  if (!allowedKeys.includes(key)) return def;
  if (dir !== "asc" && dir !== "desc") return def;
  return { key, dir };
}

/** Serialize a sort back to the `key.dir` form stored in the URL. */
export function serializeSort(s: SortState): string {
  return `${s.key}.${s.dir}`;
}

/** Flip a sort direction. */
export function flip(dir: SortDir): SortDir {
  return dir === "asc" ? "desc" : "asc";
}

/** Apply a direction to an ascending comparator's result. */
export function applyDir(cmp: number, dir: SortDir): number {
  return dir === "asc" ? cmp : -cmp;
}

/** Case-insensitive, locale-aware string comparator (ascending). */
export function byString(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

/** Numeric comparator (ascending). Avoids `a - b` overflow on large values. */
export function byNumber(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Wrap a value comparator so null/undefined keys always sort LAST, in both
 * directions. Apply the direction inside `cmp` (e.g. with applyDir) — the null
 * ordering here is intentionally fixed so a "never checked in" or "unknown
 * version" row stays pinned to the bottom whichever way the column is sorted.
 */
export function nullsLast<V>(
  cmp: (a: V, b: V) => number,
): (a: V | null | undefined, b: V | null | undefined) => number {
  return (a, b) => {
    const an = a === null || a === undefined;
    const bn = b === null || b === undefined;
    if (an && bn) return 0;
    if (an) return 1; // a after b
    if (bn) return -1; // a before b
    return cmp(a, b);
  };
}
