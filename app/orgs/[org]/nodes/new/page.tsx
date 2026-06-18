import { NewObjectForm } from "@/components/new-object-form";
import { createNode } from "../actions";

export default async function NewNode({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const base = `/orgs/${org}/nodes`;
  const template = (name: string) =>
    JSON.stringify(
      { name, chef_environment: "_default", run_list: [], normal: {} },
      null,
      2,
    );
  return (
    <NewObjectForm
      title="New node"
      backHref={base}
      onCreate={createNode.bind(null, org)}
      template={template}
    />
  );
}
