import "server-only";
import { safeGet, type Fetched } from "./safe-get";
import { fetchFleetNodes } from "./search";
import { getClientLifecycle } from "./client-lifecycle";
import { buildSnapshot, type FleetSnapshot } from "./fleet";

/**
 * Build the dashboard snapshot: the fleet search and the client lifecycle run
 * in parallel, then fold together. Only the fleet read is permission-gated, so
 * a lifecycle failure never blocks the snapshot (it degrades inside
 * getClientLifecycle). Shared by the SSR page and the 10s poll route so both
 * compute identical numbers.
 */
export async function loadFleetSnapshot(
  user: string,
  org: string,
  nowMs: number,
): Promise<Fetched<FleetSnapshot>> {
  const [fleetRes, lifecycle] = await Promise.all([
    safeGet(() => fetchFleetNodes(user, org)),
    getClientLifecycle(nowMs),
  ]);
  if ("error" in fleetRes) return fleetRes;
  return { data: buildSnapshot(fleetRes.data, nowMs, lifecycle) };
}
