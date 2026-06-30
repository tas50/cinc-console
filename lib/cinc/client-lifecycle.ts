import "server-only";
import type { ClientLifecycle } from "./fleet";

// Cinc/Chef Infra Client release lifecycle, sourced from endoflife.date. The
// Infra Server can't tell us which client majors are EOL — this is the external
// truth that powers the "Outdated clients" tile's EOL vs major-behind split.
const ENDPOINT = "https://endoflife.date/api/chef-infra-client.json";

// Hard cap on the endoflife.date request. `fetch` has no default timeout, so a
// stalled connection (DNS black-hole, a proxy that accepts but never responds,
// an air-gapped network) would hang forever — and because the dashboard snapshot
// awaits this in a `Promise.all`, that hang freezes the WHOLE dashboard on its
// loading skeleton (no tiles, empty node list) with the request never resolving.
// On timeout we abort and degrade to "unavailable", exactly like any other
// failure: the fleet still renders, just without the EOL split.
const LIFECYCLE_TIMEOUT_MS = 4000;

/** One cycle row from endoflife.date. `eol` is false (supported) or a date. */
type LifecycleCycle = {
  cycle: string;
  eol: string | boolean;
  latest?: string;
};

const UNAVAILABLE: ClientLifecycle = {
  latestMajor: null,
  latestVersion: null,
  eolMajors: [],
};

/** Pure: fold endoflife.date cycles into the lifecycle facts we use. */
export function parseLifecycle(
  cycles: LifecycleCycle[],
  nowMs: number,
): ClientLifecycle {
  let latestMajor: number | null = null;
  let latestVersion: string | null = null;
  const eolMajors: number[] = [];

  for (const c of cycles) {
    const major = parseInt(c.cycle, 10);
    if (Number.isNaN(major)) continue;

    if (latestMajor === null || major > latestMajor) {
      latestMajor = major;
      latestVersion = typeof c.latest === "string" ? c.latest : null;
    }

    const eol =
      c.eol === true ||
      (typeof c.eol === "string" && Date.parse(c.eol) <= nowMs);
    if (eol) eolMajors.push(major);
  }

  return { latestMajor, latestVersion, eolMajors };
}

/**
 * Fetch the client lifecycle, cached for a day (Next Data Cache) so the 10s
 * dashboard poll never hammers endoflife.date. Any failure degrades to
 * "unavailable" — the dashboard then falls back to fleet-relative major-behind
 * and shows no EOL, rather than erroring.
 */
export async function getClientLifecycle(
  nowMs: number,
): Promise<ClientLifecycle> {
  try {
    const res = await fetch(ENDPOINT, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(LIFECYCLE_TIMEOUT_MS),
    });
    if (!res.ok) return UNAVAILABLE;
    const cycles = (await res.json()) as LifecycleCycle[];
    if (!Array.isArray(cycles)) return UNAVAILABLE;
    return parseLifecycle(cycles, nowMs);
  } catch {
    return UNAVAILABLE;
  }
}
