// Pure fleet-status logic for the org dashboard: classify nodes and roll them
// up into the three "boom stat" counts (missing / unconfigured / outdated)
// plus a per-node summary list. No I/O and no `server-only` import on purpose —
// this is the unit-tested core; `search.ts` does the actual fetching and feeds
// these functions the parsed rows.

/** A node reduced to just the fields the dashboard reasons about. */
export type FleetNode = {
  name: string;
  /** ohai_time: unix seconds of the node's last check-in, or null if never. */
  ohaiTime: number | null;
  runList: string[];
  policyName: string | null;
  policyGroup: string | null;
  /** chef_packages.chef.version reported by the client, or null if unknown. */
  chefVersion: string | null;
};

export type NodeStatus = "ok" | "missing" | "unconfigured";

/**
 * Client-version standing, measured against the Cinc/Chef Infra Client release
 * lifecycle (see ClientLifecycle):
 *   - current      on the latest GA major (and not EOL)
 *   - major-behind ≥1 major release behind the latest GA major
 *   - eol          on a major that has reached end-of-life
 *   - unknown      no version reported (never converged)
 */
export type ClientStatus = "current" | "major-behind" | "eol" | "unknown";

/**
 * Release-lifecycle facts the Infra Server can't know — sourced from
 * endoflife.date. Passed into the pure logic so classification stays testable.
 */
export type ClientLifecycle = {
  /** Highest GA major known, or null if the lifecycle source was unavailable. */
  latestMajor: number | null;
  /** Latest released version string, for display (e.g. "19.3.15"). */
  latestVersion: string | null;
  /** Majors that have reached end-of-life. */
  eolMajors: number[];
};

/** One row in the live node list below the stat tiles. */
export type NodeSummary = {
  name: string;
  status: NodeStatus;
  lastCheckIn: number | null;
  chefVersion: string | null;
  clientStatus: ClientStatus;
};

export type FleetStats = {
  total: number;
  missing: number;
  unconfigured: number;
  /** Clients needing an upgrade = eol + majorBehind. */
  outdated: number;
  eol: number;
  majorBehind: number;
  /** Latest GA major used as the bar, for the tile's subtext. */
  latestMajor: number | null;
  latestVersion: string | null;
};

export type FleetSnapshot = {
  stats: FleetStats;
  nodes: NodeSummary[];
  /** Unix ms when the snapshot was built, so the UI can show "updated Ns ago". */
  generatedAt: number;
};

/**
 * How long since a node's last check-in before we call it "missing". Chef
 * clients running as a daemon converge every ~30 min; 12h is comfortably past
 * any normal interval (including hourly/cron schedules) without flagging a node
 * that simply slept through one run.
 */
export const MISSING_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * Missing: hasn't reported within MISSING_AFTER_MS, OR has never reported at
 * all (no ohai_time). A brand-new node that has never converged reads as
 * missing until its first run — which is the honest signal for "we're waiting
 * on this node".
 */
export function isMissing(
  node: FleetNode,
  nowMs: number,
  thresholdMs = MISSING_AFTER_MS,
): boolean {
  if (node.ohaiTime === null) return true;
  return nowMs - node.ohaiTime * 1000 > thresholdMs;
}

/**
 * Unconfigured: nothing tells the node what to do — an empty run list and no
 * policy. Such a node check in and converge to a no-op. (A policyfile node has
 * an empty run_list but a policy_name, so it is configured.)
 */
export function isUnconfigured(node: FleetNode): boolean {
  return node.runList.length === 0 && !node.policyName;
}

/**
 * Compare two dotted numeric versions ("18.4.12"). Returns -1/0/1. Non-numeric
 * trailing segments (pre-release tags) are ignored; missing segments count as 0,
 * so "18.4" < "18.4.1".
 */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) =>
    v
      .split(".")
      .map((s) => parseInt(s, 10))
      .map((n) => (Number.isNaN(n) ? 0 : n));
  const pa = parts(a);
  const pb = parts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

/** The highest client version present in the fleet, or null if none reported one. */
export function newestVersion(nodes: FleetNode[]): string | null {
  let newest: string | null = null;
  for (const n of nodes) {
    if (n.chefVersion === null) continue;
    if (newest === null || compareVersions(n.chefVersion, newest) > 0) {
      newest = n.chefVersion;
    }
  }
  return newest;
}

/** The major component of a dotted version, or null if unparseable. */
export function majorOf(version: string): number | null {
  const m = parseInt(version.split(".")[0], 10);
  return Number.isNaN(m) ? null : m;
}

/**
 * Classify a single client version against the lifecycle. EOL takes precedence
 * over major-behind (an EOL client is also behind, but EOL is the headline). The
 * "latest major" bar comes from the lifecycle source; when that's unavailable
 * (endoflife.date unreachable) we fall back to the supplied major so
 * "major behind" still works relative to what's deployed — only EOL goes dark.
 */
export function versionStatus(
  version: string | null,
  lifecycle: ClientLifecycle,
  fallbackLatestMajor: number | null,
): ClientStatus {
  if (version === null) return "unknown";
  const major = majorOf(version);
  if (major === null) return "unknown";
  if (lifecycle.eolMajors.includes(major)) return "eol";
  const latest = lifecycle.latestMajor ?? fallbackLatestMajor;
  if (latest !== null && latest - major >= 1) return "major-behind";
  return "current";
}

/** Classify a fleet node's client version (see versionStatus). */
export function clientStatus(
  node: FleetNode,
  lifecycle: ClientLifecycle,
  fallbackLatestMajor: number | null,
): ClientStatus {
  return versionStatus(node.chefVersion, lifecycle, fallbackLatestMajor);
}

/** Primary badge for a node: missing wins over unconfigured wins over ok. */
function primaryStatus(node: FleetNode, nowMs: number): NodeStatus {
  if (isMissing(node, nowMs)) return "missing";
  if (isUnconfigured(node)) return "unconfigured";
  return "ok";
}

const EMPTY_LIFECYCLE: ClientLifecycle = {
  latestMajor: null,
  latestVersion: null,
  eolMajors: [],
};

/**
 * Roll a parsed fleet into the dashboard snapshot. The stat counts are
 * INDEPENDENT diagnostics, so a node can contribute to more than one (a fresh,
 * never-converged node with an empty run list is both missing and unconfigured).
 * The per-node `status` badge, by contrast, is single-valued by priority.
 * `outdated` splits into `eol` and `majorBehind`, which are mutually exclusive
 * (eol wins) so they sum to `outdated`. Nodes are sorted most-recently-seen
 * first, so freshly-scanned nodes surface at the top of the live list.
 */
export function buildSnapshot(
  nodes: FleetNode[],
  nowMs: number,
  lifecycle: ClientLifecycle = EMPTY_LIFECYCLE,
): FleetSnapshot {
  const fleetNewest = newestVersion(nodes);
  const fallbackMajor = fleetNewest ? majorOf(fleetNewest) : null;
  const statusOf = (n: FleetNode) => clientStatus(n, lifecycle, fallbackMajor);

  const eol = nodes.filter((n) => statusOf(n) === "eol").length;
  const majorBehind = nodes.filter((n) => statusOf(n) === "major-behind").length;

  const stats: FleetStats = {
    total: nodes.length,
    missing: nodes.filter((n) => isMissing(n, nowMs)).length,
    unconfigured: nodes.filter(isUnconfigured).length,
    outdated: eol + majorBehind,
    eol,
    majorBehind,
    latestMajor: lifecycle.latestMajor ?? fallbackMajor,
    latestVersion: lifecycle.latestVersion,
  };

  const summaries: NodeSummary[] = nodes
    .map((n) => ({
      name: n.name,
      status: primaryStatus(n, nowMs),
      lastCheckIn: n.ohaiTime,
      chefVersion: n.chefVersion,
      clientStatus: statusOf(n),
    }))
    .sort((a, b) => (b.lastCheckIn ?? 0) - (a.lastCheckIn ?? 0));

  return { stats, nodes: summaries, generatedAt: nowMs };
}
