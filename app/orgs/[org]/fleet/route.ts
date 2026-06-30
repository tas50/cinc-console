import { NextResponse } from "next/server";
import { requireUser, Unauthorized } from "@/lib/session";
import { loadFleetSnapshot } from "@/lib/cinc/fleet-snapshot";
import { nowMs } from "@/lib/cinc/client";

/**
 * Poll endpoint for the org dashboard. The client fetches this every 10s to
 * refresh the node list (the stat tiles re-snapshot on a slower 60s cadence,
 * client-side, from the same response). Unlike a Server Component we return
 * JSON 401 (not a redirect to /login) so the client's fetch can react instead
 * of silently following a redirect to an HTML page.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;

  let user: string;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Unauthorized) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const res = await loadFleetSnapshot(user, org, nowMs());
  if ("error" in res) {
    // ACL/availability errors are part of normal operation (a user may not be
    // able to search this org); hand the reason to the client, status 200.
    return NextResponse.json({ error: res.error }, { status: 200 });
  }

  return NextResponse.json(res.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
