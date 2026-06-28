import { NewClientForm } from "./new-client-form";
import { createClientAction } from "../actions";

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return <NewClientForm org={org} onCreate={createClientAction.bind(null, org)} />;
}
