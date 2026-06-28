import { NewObjectForm } from "@/components/new-object-form";
import { createItem } from "../../actions";

export default async function NewDataBagItem({
  params,
}: {
  params: Promise<{ org: string; bag: string }>;
}) {
  const { org, bag: raw } = await params;
  const bag = decodeURIComponent(raw);
  const base = `/orgs/${org}/data_bags/${bag}`;
  const initialJson = JSON.stringify({ id: "" }, null, 2);
  return (
    <NewObjectForm
      title="New item"
      backHref={base}
      onCreate={createItem.bind(null, org, bag)}
      initialJson={initialJson}
      nameKind="data_bag_item"
    />
  );
}
