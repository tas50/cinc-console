import { currentUser } from "@/lib/guard";
import { loadFleetSnapshot } from "@/lib/cinc/fleet-snapshot";
import { nowMs } from "@/lib/cinc/client";
import { explainRead } from "@/lib/cinc/safe-get";
import { NodesTable } from "@/components/nodes-table";

export default async function NodesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const base = `/orgs/${org}/nodes`;
  // The fleet snapshot (the same search that powers the dashboard) carries each
  // node's last check-in and client version, so the list can show those columns
  // without an N+1 fetch. It needs node *search* permission, not just *list*.
  const res = await loadFleetSnapshot(user, org, nowMs());
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <NodesTable
      basePath={base}
      createHref={`${base}/new`}
      nodes={res.data.nodes}
      generatedAt={res.data.generatedAt}
    />
  );
}
