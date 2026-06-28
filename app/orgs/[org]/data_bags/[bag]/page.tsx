import Link from "next/link";
import { currentUser } from "@/lib/guard";
import { dataBags } from "@/lib/cinc/databags";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ResourceTable } from "@/components/resource-table";
import { DeleteBagButton } from "./delete-bag-button";
import { deleteBag } from "../actions";

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
  const items = Object.keys(res.data);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/orgs/${org}/data_bags`}
          className="text-sm text-muted hover:text-text"
        >
          ← back
        </Link>
        <DeleteBagButton
          org={org}
          bag={bag}
          itemCount={items.length}
          onDelete={deleteBag.bind(null, org, bag)}
        />
      </div>
      <ResourceTable
        title={bag}
        names={items}
        basePath={base}
        createHref={`${base}/new`}
      />
    </div>
  );
}
