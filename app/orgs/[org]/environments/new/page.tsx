import { CreateObjectForm } from "@/components/create-object-form";
import { createEnvironment } from "../actions";

export default async function NewEnvironment({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const base = `/orgs/${org}/environments`;
  return (
    <CreateObjectForm
      kind="environment"
      backHref={base}
      onCreate={createEnvironment.bind(null, org)}
    />
  );
}
