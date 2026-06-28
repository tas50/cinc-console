export type JsonDiffLine = {
  kind: "added" | "removed" | "changed";
  /** Dotted path to the field, e.g. "normal.tags" or "run_list". */
  path: string;
  before?: unknown;
  after?: unknown;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * A structural diff between two JSON values, keyed by dotted path. Objects are
 * walked key-by-key; everything else (scalars, arrays) is compared as an atomic
 * value — so a changed `run_list` shows the whole before/after array, which is
 * what a reviewer wants to see. Used to preview edits before they're saved.
 */
export function diffJson(before: unknown, after: unknown, path = ""): JsonDiffLine[] {
  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = Array.from(
      new Set([...Object.keys(before), ...Object.keys(after)]),
    ).sort();
    return keys.flatMap((key) => {
      const childPath = path ? `${path}.${key}` : key;
      const inBefore = Object.prototype.hasOwnProperty.call(before, key);
      const inAfter = Object.prototype.hasOwnProperty.call(after, key);
      if (inBefore && !inAfter) {
        return [{ kind: "removed", path: childPath, before: before[key] }];
      }
      if (!inBefore && inAfter) {
        return [{ kind: "added", path: childPath, after: after[key] }];
      }
      return diffJson(before[key], after[key], childPath);
    });
  }

  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  return [{ kind: "changed", path: path || "(root)", before, after }];
}
