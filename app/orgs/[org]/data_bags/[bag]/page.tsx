import Link from "next/link";
import { currentUser } from "@/lib/guard";
import { dataBags } from "@/lib/cinc/databags";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ResourceTable } from "@/components/resource-table";

export default async function DataBagItemsPage({
  params,
}: {
  params: Promise<{ org: string; bag: string }>;
}) {
  const { org, bag: raw } = await params;
  const bag = decodeURIComponent(raw);
  const user = await currentUser();
  const base = `/orgs/${org}/data_bags/${bag}`;
  const res = await safeGet(() => dataBags.listItems(user, org, bag));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <div className="space-y-4">
      <Link
        href={`/orgs/${org}/data_bags`}
        className="text-sm text-muted hover:text-text"
      >
        ← back
      </Link>
      <ResourceTable
        title={bag}
        names={Object.keys(res.data)}
        basePath={base}
        createHref={`${base}/new`}
      />
    </div>
  );
}
