"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

/** A searchable list of object names that link to their detail pages. */
export function ResourceTable({
  title,
  names,
  basePath,
  createHref,
}: {
  title: string;
  names: string[];
  basePath: string;
  createHref?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return names.filter((n) => n.toLowerCase().includes(needle)).sort();
  }, [names, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {createHref && (
          <Link href={createHref}>
            <Button>New</Button>
          </Link>
        )}
      </div>

      <Input
        placeholder={`Filter ${title.toLowerCase()}…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-hidden rounded-lg border border-border">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted">No matching items.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((name) => (
              <li key={name}>
                <Link
                  href={`${basePath}/${encodeURIComponent(name)}`}
                  className="block px-4 py-2 font-mono text-sm text-text hover:bg-surface-2"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted">
        {filtered.length} of {names.length}
      </p>
    </div>
  );
}
