"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, ScalarValue, isRecord } from "./primitives";

/**
 * A collapsible read-only view of a nested attribute object. Scalars render
 * inline; objects and arrays become expandable nodes. `defaultOpen` controls
 * only this level — nested levels start collapsed so a deep tree (e.g. a
 * node's automatic attributes) opens one layer at a time.
 */
export function AttributeTree({
  data,
  defaultOpen = true,
}: {
  data: unknown;
  defaultOpen?: boolean;
}) {
  if (data === null || data === undefined)
    return <EmptyState>None.</EmptyState>;
  if (!isRecord(data) && !Array.isArray(data))
    return (
      <div className="text-sm">
        <ScalarValue value={data} />
      </div>
    );

  const entries: Array<[string, unknown]> = Array.isArray(data)
    ? data.map((v, i) => [String(i), v])
    : Object.entries(data);

  if (entries.length === 0) return <EmptyState>Empty.</EmptyState>;

  return (
    <ul className="space-y-0.5 text-sm">
      {entries.map(([key, value]) => (
        <TreeNode key={key} name={key} value={value} defaultOpen={defaultOpen} />
      ))}
    </ul>
  );
}

function TreeNode({
  name,
  value,
  defaultOpen,
}: {
  name: string;
  value: unknown;
  defaultOpen: boolean;
}) {
  const nested = isRecord(value) || Array.isArray(value);
  const [open, setOpen] = useState(defaultOpen);

  if (!nested) {
    return (
      <li className="flex gap-2 py-0.5">
        <span className="font-mono text-xs text-muted">{name}</span>
        <span className="text-text">
          <ScalarValue value={value} />
        </span>
      </li>
    );
  }

  const count = Array.isArray(value)
    ? value.length
    : Object.keys(value as object).length;
  const summary = Array.isArray(value) ? `[${count}]` : `{${count}}`;

  return (
    <li className="py-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 font-mono text-xs text-text hover:text-link"
      >
        <span className="w-3 text-muted">{open ? "▾" : "▸"}</span>
        {name}
        <span className="text-muted">{summary}</span>
      </button>
      {open && (
        <div className={cn("ml-2 mt-0.5 border-l border-border pl-3")}>
          {/* nested levels start collapsed to keep deep trees manageable */}
          <AttributeTree data={value} defaultOpen={false} />
        </div>
      )}
    </li>
  );
}
