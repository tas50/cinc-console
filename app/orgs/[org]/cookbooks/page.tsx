import { currentUser } from "@/lib/guard";
import { cookbooks } from "@/lib/cinc/readonly";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ResourceTable } from "@/components/resource-table";

export default async function CookbooksPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const res = await safeGet(() => cookbooks.list(user, org));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ResourceTable
      title="Cookbooks"
      names={Object.keys(res.data)}
      basePath={`/orgs/${org}/cookbooks`}
    />
  );
}
