import { createBag } from "../actions";
import { NewBagForm } from "./new-bag-form";

export default async function NewDataBag({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return <NewBagForm org={org} onCreate={createBag.bind(null, org)} />;
}
