import { currentUser } from "@/lib/guard";
import { clients } from "@/lib/cinc/readonly";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ResourceTable } from "@/components/resource-table";

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const res = await safeGet(() => clients.list(user, org));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ResourceTable
      title="Clients"
      names={Object.keys(res.data)}
      basePath={`/orgs/${org}/clients`}
      createHref={`/orgs/${org}/clients/new`}
      emptyHint="Clients are non-human API identities (e.g. a node's chef-client)."
    />
  );
}
