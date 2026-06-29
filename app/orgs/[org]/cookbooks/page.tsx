import { currentUser } from "@/lib/guard";
import { listCookbooks } from "@/lib/cinc/cookbooks";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { CookbooksTable } from "@/components/cookbooks-table";

export default async function CookbooksPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const res = await safeGet(() => listCookbooks(user, org));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <CookbooksTable basePath={`/orgs/${org}/cookbooks`} cookbooks={res.data} />
  );
}
