import { CreateObjectForm } from "@/components/create-object-form";
import { createRole } from "../actions";

export default async function NewRole({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const base = `/orgs/${org}/roles`;
  return (
    <CreateObjectForm
      kind="role"
      backHref={base}
      onCreate={createRole.bind(null, org)}
    />
  );
}
