"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";

/**
 * A collapsible, syntax-highlighted JSON tree. Top-level entries render
 * inline; nested objects and arrays collapse to a `{…}` / `[…]` placeholder
 * and expand on click. Used for a node's automatic attributes, which are large
 * and machine-generated — the top level is browsable without a wall of JSON.
 *
 * Dependency-light and air-gapped (no CDN highlighter), like JsonEditor.
 */

function isContainer(v: unknown): v is Record<string, unknown> | unknown[] {
  return typeof v === "object" && v !== null;
}

/** A single highlighted scalar, rendered as it appears in JSON. */
function Scalar({ value }: { value: unknown }) {
  if (value === null) return <span className="text-muted">null</span>;
  if (typeof value === "string")
    return <span className="text-success">{JSON.stringify(value)}</span>;
  if (typeof value === "number" || typeof value === "bigint")
    return <span className="text-warn">{String(value)}</span>;
  if (typeof value === "boolean")
    return <span className="text-danger">{String(value)}</span>;
  return <span className="text-text">{JSON.stringify(value)}</span>;
}

function keyLabel(name: string | number, isArray: boolean): ReactNode {
  if (isArray) return <span className="text-muted">{name}: </span>;
  return (
    <>
      <span className="text-link">{JSON.stringify(String(name))}</span>
      <span className="text-muted">: </span>
    </>
  );
}

function Row({
  name,
  value,
  isArray,
}: {
  name: string | number;
  value: unknown;
  isArray: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isContainer(value)) {
    const copyValue =
      typeof value === "string" ? value : JSON.stringify(value);
    return (
      <div className="group flex items-baseline gap-2 py-0.5">
        <span>
          {keyLabel(name, isArray)}
          <Scalar value={value} />
        </span>
        <CopyButton
          value={copyValue}
          iconOnly
          label={`Copy ${name} value`}
          className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
        />
      </div>
    );
  }

  const arr = Array.isArray(value);
  const count = arr ? value.length : Object.keys(value).length;

  // empty containers have nothing to expand
  if (count === 0) {
    return (
      <div className="py-0.5">
        {keyLabel(name, isArray)}
        <span className="text-muted">{arr ? "[]" : "{}"}</span>
      </div>
    );
  }

  return (
    <div className="py-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-left hover:opacity-80"
      >
        <span className="text-muted">{open ? "▾ " : "▸ "}</span>
        {keyLabel(name, isArray)}
        <span className="text-muted">
          {arr ? "[" : "{"}
          {open ? "" : `…${arr ? "]" : "}"}`}
        </span>
      </button>
      {open && (
        <div className="ml-3 border-l border-border pl-3">
          <Entries value={value} />
        </div>
      )}
    </div>
  );
}

function Entries({ value }: { value: Record<string, unknown> | unknown[] }) {
  const isArray = Array.isArray(value);
  const entries: Array<[string | number, unknown]> = isArray
    ? value.map((v, i) => [i, v])
    : Object.entries(value);
  return (
    <>
      {entries.map(([name, v]) => (
        <Row key={String(name)} name={name} value={v} isArray={isArray} />
      ))}
    </>
  );
}

export function JsonTree({ value }: { value: unknown }) {
  let body: ReactNode;
  if (!isContainer(value)) {
    body = <Scalar value={value} />;
  } else {
    const count = Array.isArray(value) ? value.length : Object.keys(value).length;
    body =
      count === 0 ? (
        <span className="text-muted">{Array.isArray(value) ? "[]" : "{}"}</span>
      ) : (
        <Entries value={value} />
      );
  }
  return (
    <div className="overflow-x-auto rounded bg-bg p-3 font-mono text-xs leading-relaxed">
      {body}
    </div>
  );
}
