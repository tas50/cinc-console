import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** True for a plain object (not null, not an array). */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** A titled card grouping one slice of an object (run list, attributes, …). */
export function DetailSection({
  title,
  action,
  children,
}: {
  title: string;
  /** Optional control rendered small, right-aligned in the section header. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

/** Two-column label/value grid for a handful of scalar fields. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
      {children}
    </dl>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-text">{children}</dd>
    </>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

type Tone = "muted" | "success" | "primary" | "warn";

const toneClass: Record<Tone, string> = {
  muted: "bg-surface-2 text-muted",
  success: "bg-success/15 text-success",
  primary: "bg-primary/20 text-link",
  warn: "bg-warn/15 text-warn",
};

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * Renders a single JSON scalar the way a human reads it: booleans as yes/no
 * badges, null/undefined as a dash, empty strings called out, everything else
 * as text. Non-scalars fall back to compact JSON so nothing is ever lost.
 */
export function ScalarValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted">—</span>;
  if (typeof value === "boolean")
    return <Badge tone={value ? "success" : "muted"}>{value ? "yes" : "no"}</Badge>;
  if (typeof value === "number" || typeof value === "bigint")
    return <span className="font-mono">{String(value)}</span>;
  if (typeof value === "string")
    return value === "" ? (
      <span className="text-muted">(empty)</span>
    ) : (
      <span>{value}</span>
    );
  return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
}

/** A value inside a table cell: arrays become chips, scalars render inline. */
export function ValueCell({ value }: { value: unknown }) {
  if (Array.isArray(value)) return <Chips items={value} mono empty="—" />;
  return <ScalarValue value={value} />;
}

/** A wrapping row of chips for string-ish lists (run lists, group members). */
export function Chips({
  items,
  mono = false,
  empty = "None.",
}: {
  items: unknown;
  mono?: boolean;
  empty?: string;
}) {
  if (!Array.isArray(items) || items.length === 0)
    return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <li
          key={i}
          className={cn(
            "rounded bg-surface-2 px-2 py-1 text-xs text-text",
            mono && "font-mono",
          )}
        >
          {typeof item === "string" || typeof item === "number"
            ? String(item)
            : JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );
}

/**
 * A run list. Run lists are **ordered** — Chef applies them top to bottom — so
 * render them as a numbered, vertical ordered list rather than a chip cloud,
 * making the execution order unmistakable. The `<ol>` also conveys the ordering
 * to assistive tech; the visible index is decorative (aria-hidden).
 */
export function RunList({ items }: { items: unknown }) {
  if (!Array.isArray(items) || items.length === 0)
    return <EmptyState>No run list.</EmptyState>;
  return (
    <ol className="space-y-1">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-baseline gap-3 rounded bg-surface-2 px-2 py-1"
        >
          <span
            aria-hidden="true"
            className="select-none font-mono text-xs tabular-nums text-muted"
          >
            {i + 1}.
          </span>
          <span className="font-mono text-xs text-text">
            {typeof item === "string" || typeof item === "number"
              ? String(item)
              : JSON.stringify(item)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * A flat key → value table for string maps such as cookbook version
 * constraints or per-environment run lists. Array values render as chips.
 */
export function KeyValueTable({
  data,
  emptyText = "None.",
}: {
  data: unknown;
  emptyText?: string;
}) {
  if (!isRecord(data) || Object.keys(data).length === 0)
    return <EmptyState>{emptyText}</EmptyState>;
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-border">
        {Object.entries(data).map(([key, value]) => (
          <tr key={key}>
            <td className="w-px whitespace-nowrap py-1.5 pr-6 align-top font-mono text-xs text-muted">
              {key}
            </td>
            <td className="py-1.5 text-text">
              <ValueCell value={value} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
