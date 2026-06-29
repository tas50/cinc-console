"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type {
  ClientStatus,
  FleetSnapshot,
  FleetStats,
  NodeStatus,
  NodeSummary,
} from "@/lib/cinc/fleet";

/** Which stat tile is the active filter for the node list, if any. */
type Filter = "missing" | "unconfigured" | "outdated" | null;

const POLL_MS = 10_000;
/** Cap the rendered list so a huge fleet can't bloat the DOM; the count note is honest about it. */
const MAX_ROWS = 200;

export function FleetDashboard({
  org,
  initial,
  initialError,
}: {
  org: string;
  initial: FleetSnapshot | null;
  initialError: string | null;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<FleetSnapshot | null>(initial);
  const [error, setError] = useState<string | null>(initialError);
  const [filter, setFilter] = useState<Filter>(null);
  const [fetchedAt, setFetchedAt] = useState<number>(
    initial?.generatedAt ?? 0,
  );
  const [now, setNow] = useState<number>(initial?.generatedAt ?? 0);
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);

  // Poll the fleet snapshot every POLL_MS. We keep the last good snapshot on a
  // transient failure rather than blanking the dashboard.
  useEffect(() => {
    let active = true;

    async function poll() {
      if (inFlight.current) return; // don't stack requests if one is slow
      inFlight.current = true;
      setRefreshing(true);
      try {
        const res = await fetch(`/orgs/${org}/fleet`, { cache: "no-store" });
        if (!active) return;
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (!active) return;
        if (json && typeof json === "object" && "error" in json) {
          setError(explainError(String(json.error)));
        } else {
          const t = Date.now();
          setSnapshot(json as FleetSnapshot);
          setError(null);
          setFetchedAt(t);
          setNow(t);
        }
      } catch {
        if (active) setError("Couldn't reach the Cinc server — retrying.");
      } finally {
        if (active) setRefreshing(false);
        inFlight.current = false;
      }
    }

    // SSR gave us the first snapshot; only fetch immediately if it failed.
    // `poll` is async; wrap so its promise is explicitly fire-and-forget (and
    // we never hand setInterval a bare identifier).
    if (!initial) void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [org, initial, router]);

  // Tick once a second so the "updated Ns ago" / "Xh ago" labels stay live.
  // `now` starts from the SSR snapshot time (stable, no hydration mismatch) and
  // only advances here in the interval callback.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const stats = snapshot?.stats;
  const nodes = snapshot?.nodes ?? [];
  const shown = filterNodes(nodes, filter);
  const capped = shown.slice(0, MAX_ROWS);

  const toggle = (f: Exclude<Filter, null>) =>
    setFilter((cur) => (cur === f ? null : f));

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Missing"
          help="No check-in in the last 12 hours"
          count={stats?.missing}
          tone="danger"
          icon={<IconWarning />}
          active={filter === "missing"}
          onClick={() => toggle("missing")}
        />
        <StatTile
          label="Unconfigured"
          help="Empty run-list and no policy"
          count={stats?.unconfigured}
          tone="warn"
          icon={<IconQuestion />}
          active={filter === "unconfigured"}
          onClick={() => toggle("unconfigured")}
        />
        <StatTile
          label="Outdated clients"
          help={<OutdatedHelp stats={stats} />}
          count={stats?.outdated}
          tone={outdatedTone(stats)}
          icon={<IconArrowDown />}
          active={filter === "outdated"}
          onClick={() => toggle("outdated")}
        />
      </div>

      {/* Live status line + errors */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted" role="status" aria-live="polite">
          {stats ? `${stats.total} nodes total` : "Loading fleet…"}
          {fetchedAt > 0 && (
            <span className="text-muted">
              {" · updated "}
              {relativeAgo(now - fetchedAt)}
              {refreshing && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block motion-safe:animate-pulse"
                >
                  ↻
                </span>
              )}
            </span>
          )}
        </p>
        {error && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-danger"
          >
            <IconWarning />
            {error}
          </p>
        )}
      </div>

      {/* Node list */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-text">
            {filter ? `${filterLabel(filter)} nodes` : "Nodes"}
            <span className="ml-2 text-muted">{shown.length}</span>
          </h2>
          {filter && (
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="rounded text-sm text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Clear filter
            </button>
          )}
        </div>

        {capped.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            {snapshot ? "No nodes match." : "Loading…"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Fleet nodes, most recently seen first
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th scope="col" className="px-4 py-2 font-medium">
                    Node
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Last check-in
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Client
                  </th>
                </tr>
              </thead>
              <tbody>
                {capped.map((n) => (
                  <NodeRow key={n.name} org={org} node={n} now={now} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {shown.length > MAX_ROWS && (
          <p className="border-t border-border px-4 py-2 text-xs text-muted">
            Showing the first {MAX_ROWS} of {shown.length}. Use a stat tile to
            narrow the list.
          </p>
        )}
      </Card>
    </div>
  );
}

function NodeRow({
  org,
  node,
  now,
}: {
  org: string;
  node: NodeSummary;
  now: number;
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-2">
      <td className="px-4 py-2">
        <a
          href={`/orgs/${org}/nodes/${encodeURIComponent(node.name)}`}
          className="font-mono text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {node.name}
        </a>
      </td>
      <td className="px-4 py-2">
        <StatusBadge status={node.status} />
      </td>
      <td className="px-4 py-2 text-muted">
        {node.lastCheckIn === null
          ? "never"
          : relativeAgo(now - node.lastCheckIn * 1000)}
      </td>
      <td className="px-4 py-2 text-muted">
        {node.chefVersion ?? "—"}
        <ClientChip status={node.clientStatus} />
      </td>
    </tr>
  );
}

function StatTile({
  label,
  help,
  count,
  tone,
  icon,
  active,
  onClick,
}: {
  label: string;
  help: React.ReactNode;
  count: number | undefined;
  tone: "danger" | "warn" | "link";
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const toneText = {
    danger: "text-danger",
    warn: "text-warn",
    link: "text-link",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border bg-surface p-5 text-left shadow-[var(--shadow-sm)] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary bg-surface-2"
          : "border-border hover:border-muted",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className={cn("shrink-0", toneText)} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tabular-nums", toneText)}>
        {count === undefined ? "—" : count}
      </div>
      <div className="mt-1 text-xs text-muted">{help}</div>
      {active && (
        <div className="mt-2 text-xs font-medium text-primary">
          Filtering list ↓
        </div>
      )}
    </button>
  );
}

/** Headline severity for the Outdated tile: EOL beats major-behind beats none. */
function outdatedTone(stats?: FleetStats): "danger" | "warn" | "link" {
  if ((stats?.eol ?? 0) > 0) return "danger";
  if ((stats?.majorBehind ?? 0) > 0) return "warn";
  return "link";
}

/** Tile subtext that calls out the EOL vs major-behind split. */
function OutdatedHelp({ stats }: { stats?: FleetStats }) {
  if (!stats) return <>…</>;
  if (stats.outdated === 0) {
    return (
      <>
        {stats.latestVersion
          ? `All on ${stats.latestVersion}`
          : "All on supported majors"}
      </>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      {stats.eol > 0 && (
        <span className="font-medium text-danger">{stats.eol} EOL</span>
      )}
      {stats.eol > 0 && stats.majorBehind > 0 && (
        <span aria-hidden="true">·</span>
      )}
      {stats.majorBehind > 0 && (
        <span className="font-medium text-warn">
          {stats.majorBehind} major release behind
        </span>
      )}
    </span>
  );
}

/** Per-node client-version chip: only EOL and major-behind warrant a flag. */
function ClientChip({ status }: { status: ClientStatus }) {
  if (status === "eol") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded border border-danger px-1.5 py-0.5 text-xs text-danger">
        <IconWarning />
        EOL
      </span>
    );
  }
  if (status === "major-behind") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs text-warn">
        <IconArrowDown />
        major release behind
      </span>
    );
  }
  return null;
}

function StatusBadge({ status }: { status: NodeStatus }) {
  const map: Record<
    NodeStatus,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    ok: { label: "OK", cls: "text-success", icon: <IconCheck /> },
    missing: { label: "Missing", cls: "text-danger", icon: <IconWarning /> },
    unconfigured: {
      label: "Unconfigured",
      cls: "text-warn",
      icon: <IconQuestion />,
    },
  };
  const { label, cls, icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", cls)}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

// --- helpers -------------------------------------------------------------

// Filter by the same independent diagnostics the stat tiles count — NOT the
// single-valued `status` badge. A node that's both missing and unconfigured
// shows a "missing" badge but is counted by the unconfigured tile, so filtering
// on the badge would hide it and the list wouldn't match the tile's number.
function filterNodes(nodes: NodeSummary[], filter: Filter): NodeSummary[] {
  if (filter === null) return nodes;
  if (filter === "missing") return nodes.filter((n) => n.missing);
  if (filter === "unconfigured") return nodes.filter((n) => n.unconfigured);
  return nodes.filter(
    (n) => n.clientStatus === "eol" || n.clientStatus === "major-behind",
  );
}

function filterLabel(filter: Exclude<Filter, null>): string {
  return { missing: "Missing", unconfigured: "Unconfigured", outdated: "Outdated" }[
    filter
  ];
}

function explainError(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to search nodes in this organization.";
  if (error === "not found") return "This organization has no node index.";
  return "The Cinc server returned an error refreshing the fleet.";
}

/** "5s ago" / "3m ago" / "2h ago" / "4d ago" from a millisecond delta. */
function relativeAgo(deltaMs: number): string {
  const s = Math.max(0, Math.floor(deltaMs / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// --- icons (decorative; status is always carried by adjacent text) -------

function IconWarning() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5 15 14H1L8 1.5Zm0 4.5v3.5M8 11.5v.01" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function IconQuestion() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="8" cy="8" r="6.5" strokeDasharray="2.5 2" />
      <path d="M6.2 6.2a1.8 1.8 0 1 1 2.6 1.6c-.6.3-.8.6-.8 1.2M8 11.5v.01" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}
