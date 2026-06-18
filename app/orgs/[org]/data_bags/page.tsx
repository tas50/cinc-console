import { currentUser } from "@/lib/guard";
import { dataBags } from "@/lib/cinc/databags";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ResourceTable } from "@/components/resource-table";

export default async function DataBagsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const base = `/orgs/${org}/data_bags`;
  const res = await safeGet(() => dataBags.list(user, org));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ResourceTable
      title="Data Bags"
      names={Object.keys(res.data)}
      basePath={base}
      createHref={`${base}/new`}
    />
  );
}
