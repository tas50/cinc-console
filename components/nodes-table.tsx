"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PageHeader } from "./ui/page-header";
import { SortableTh } from "./ui/sortable";
import { useSort } from "./ui/use-sort";
import {
  applyDir,
  byNumber,
  byString,
  nullsLast,
  type SortState,
} from "@/lib/sort";
import { compareVersions, type NodeSummary } from "@/lib/cinc/fleet";
import { relativeAgo } from "@/lib/time";
import { ClientVersion } from "@/components/client-chip";

const SORT_KEYS = ["name", "lastSeen", "client"] as const;
const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

/** Bounds the DOM only — the search sweep returns every node at once. */
const PAGE_SIZE = 50;

/** Order nodes by the active column; "never seen" / "unknown version" pin last. */
function compareBy(a: NodeSummary, b: NodeSummary, sort: SortState): number {
  const { key, dir } = sort;
  switch (key) {
    case "lastSeen":
      return nullsLast<number>((x, y) => applyDir(byNumber(x, y), dir))(
        a.lastCheckIn,
        b.lastCheckIn,
      );
    case "client":
      return nullsLast<string>((x, y) => applyDir(compareVersions(x, y), dir))(
        a.chefVersion,
        b.chefVersion,
      );
    default:
      return applyDir(byString(a.name, b.name), dir);
  }
}

/**
 * The org's node list with last-check-in and client-version columns. Sourced
 * from the same fleet search as the dashboard, so it carries each node's
 * `lastCheckIn` and `chefVersion`/`clientStatus` for free. The relative
 * check-in label ticks live off `generatedAt` (the snapshot time), the way the
 * dashboard does, so "3m ago" stays honest without a reload.
 */
export function NodesTable({
  basePath,
  createHref,
  nodes,
  generatedAt,
}: {
  basePath: string;
  createHref: string;
  nodes: NodeSummary[];
  /** Unix ms the snapshot was built — seeds the relative clock (stable for SSR). */
  generatedAt: number;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { sort, setSort } = useSort("sort", DEFAULT_SORT, SORT_KEYS);

  // Start from the snapshot time (no hydration mismatch), then tick to the live
  // clock each second so the "Last check-in" labels age in place.
  const [now, setNow] = useState(generatedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return nodes
      .filter((n) => n.name.toLowerCase().includes(needle))
      .sort((a, b) => compareBy(a, b, sort));
  }, [nodes, q, sort]);

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
      <PageHeader
        title="Nodes"
        actions={
          <Link href={createHref}>
            <Button>New</Button>
          </Link>
        }
      />

      <Input
        placeholder="Filter nodes…"
        value={q}
        onChange={(e) => onFilter(e.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-hidden rounded-lg border border-border">
        {nodes.length === 0 ? (
          <div className="p-4 text-sm text-muted">
            <p>No nodes in this organization yet.</p>
            <p className="mt-1">
              Nodes register when a Cinc client first converges against this
              organization.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            No nodes matching &ldquo;{q}&rdquo;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Nodes, sortable by name, last check-in, and client version
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <SortableTh label="Name" sortKey="name" sort={sort} onSort={setSort} />
                  <SortableTh
                    label="Last check-in"
                    sortKey="lastSeen"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortableTh
                    label="Client version"
                    sortKey="client"
                    sort={sort}
                    onSort={setSort}
                  />
                </tr>
              </thead>
              <tbody>
                {visible.map((n) => (
                  <tr
                    key={n.name}
                    className="border-b border-border last:border-0 hover:bg-surface-2"
                  >
                    <td className="p-0">
                      <Link
                        href={`${basePath}/${encodeURIComponent(n.name)}`}
                        className="block px-4 py-2.5 font-mono text-sm text-text transition-colors hover:text-link"
                      >
                        <span className="truncate">{n.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {n.lastCheckIn === null
                        ? "never"
                        : relativeAgo(now - n.lastCheckIn * 1000)}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      <ClientVersion version={n.chefVersion} status={n.clientStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {filtered.length === 0
            ? `0 of ${nodes.length}`
            : `${start + 1}–${start + visible.length} of ${filtered.length}` +
              (filtered.length === nodes.length ? "" : ` (${nodes.length} total)`)}
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
