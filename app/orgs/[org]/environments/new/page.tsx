import { NewObjectForm } from "@/components/new-object-form";
import { createEnvironment } from "../actions";

export default async function NewEnvironment({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const base = `/orgs/${org}/environments`;
  const initialJson = JSON.stringify(
    {
      name: "",
      description: "",
      json_class: "Chef::Environment",
      chef_type: "environment",
      default_attributes: {},
      override_attributes: {},
      cookbook_versions: {},
    },
    null,
    2,
  );
  return (
    <NewObjectForm
      title="New environment"
      backHref={base}
      onCreate={createEnvironment.bind(null, org)}
      initialJson={initialJson}
      nameKind="environment"
    />
  );
}
