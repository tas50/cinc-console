import { NewObjectForm } from "@/components/new-object-form";
import { createRole } from "../actions";

export default async function NewRole({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const base = `/orgs/${org}/roles`;
  const template = (name: string) =>
    JSON.stringify(
      {
        name,
        description: "",
        json_class: "Chef::Role",
        chef_type: "role",
        default_attributes: {},
        override_attributes: {},
        run_list: [],
      },
      null,
      2,
    );
  return (
    <NewObjectForm
      title="New role"
      backHref={base}
      onCreate={createRole.bind(null, org)}
      template={template}
    />
  );
}
