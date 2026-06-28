"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

/** Rows rendered per page. The Cinc list call returns every name at once, so
 * this only bounds the DOM — it keeps large orgs (thousands of nodes) snappy. */
const PAGE_SIZE = 50;

/** A searchable, paginated list of object names that link to their detail pages. */
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
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return names.filter((n) => n.toLowerCase().includes(needle)).sort();
  }, [names, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp during render so a shrinking filter can never strand us past the end.
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function onFilter(value: string) {
    setQ(value);
    setPage(0);
  }

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
        onChange={(e) => onFilter(e.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-hidden rounded-lg border border-border">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted">No matching items.</p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((name) => (
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

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {filtered.length === 0
            ? `0 of ${names.length}`
            : `${start + 1}–${start + visible.length} of ${filtered.length}` +
              (filtered.length === names.length ? "" : ` (${names.length} total)`)}
        </span>
        {pageCount > 1 && (
          <span className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label="Previous page"
            >
              Prev
            </Button>
            <span>
              {current + 1} / {pageCount}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
              aria-label="Next page"
            >
              Next
            </Button>
          </span>
        )}
      </div>
    </div>
  );
}
