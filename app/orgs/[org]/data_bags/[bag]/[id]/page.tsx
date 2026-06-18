import { currentUser } from "@/lib/guard";
import { dataBags } from "@/lib/cinc/databags";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ObjectEditor } from "@/components/object-editor";
import { saveItem, deleteItem } from "../../actions";

export default async function DataBagItemDetail({
  params,
}: {
  params: Promise<{ org: string; bag: string; id: string }>;
}) {
  const { org, bag: rawBag, id: rawId } = await params;
  const bag = decodeURIComponent(rawBag);
  const id = decodeURIComponent(rawId);
  const user = await currentUser();
  const base = `/orgs/${org}/data_bags/${bag}`;
  const res = await safeGet(() => dataBags.getItem(user, org, bag, id));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ObjectEditor
      name={id}
      initialJson={JSON.stringify(res.data, null, 2)}
      backHref={base}
      onSave={saveItem.bind(null, org, bag, id)}
      onDelete={deleteItem.bind(null, org, bag, id)}
    />
  );
}
