import { currentUser } from "@/lib/guard";
import { makeResource } from "@/lib/cinc/resource";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ResourceTable } from "@/components/resource-table";

const nodes = makeResource("nodes");

export default async function NodesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const base = `/orgs/${org}/nodes`;
  const res = await safeGet(() => nodes.list(user, org));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ResourceTable
      title="Nodes"
      names={Object.keys(res.data)}
      basePath={base}
      createHref={`${base}/new`}
    />
  );
}
