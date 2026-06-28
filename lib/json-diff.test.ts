import { expect, test } from "vitest";
import { diffJson } from "./json-diff";

test("no changes yields an empty diff", () => {
  expect(diffJson({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toEqual([]);
});

test("detects added, removed, and changed keys", () => {
  const diff = diffJson(
    { keep: 1, drop: 2, change: "old" },
    { keep: 1, change: "new", add: 3 },
  );
  expect(diff).toEqual([
    { kind: "added", path: "add", after: 3 },
    { kind: "changed", path: "change", before: "old", after: "new" },
    { kind: "removed", path: "drop", before: 2 },
  ]);
});

test("walks nested objects with dotted paths", () => {
  const diff = diffJson(
    { normal: { tags: ["a"] } },
    { normal: { tags: ["a", "b"] } },
  );
  expect(diff).toEqual([
    { kind: "changed", path: "normal.tags", before: ["a"], after: ["a", "b"] },
  ]);
});

test("treats arrays as atomic values", () => {
  const diff = diffJson({ run_list: ["recipe[a]"] }, { run_list: ["recipe[b]"] });
  expect(diff).toEqual([
    { kind: "changed", path: "run_list", before: ["recipe[a]"], after: ["recipe[b]"] },
  ]);
});
