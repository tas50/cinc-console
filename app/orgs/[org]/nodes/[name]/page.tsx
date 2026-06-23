import { currentUser } from "@/lib/guard";
import { makeResource } from "@/lib/cinc/resource";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ObjectEditor } from "@/components/object-editor";
import { NodeDetails, nodePlatform } from "@/components/details/node-details";
import { PlatformIcon } from "@/components/platform/platform-icon";
import { saveNode, deleteNode } from "../actions";

const nodes = makeResource("nodes");

export default async function NodeDetail({
  params,
}: {
  params: Promise<{ org: string; name: string }>;
}) {
  const { org, name: raw } = await params;
  const name = decodeURIComponent(raw);
  const user = await currentUser();
  const base = `/orgs/${org}/nodes`;
  const res = await safeGet(() => nodes.get(user, org, name));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ObjectEditor
      name={name}
      titleIcon={
        <PlatformIcon
          platform={nodePlatform(res.data)}
          className="h-5 w-5 text-muted"
        />
      }
      initialJson={JSON.stringify(res.data, null, 2)}
      details={<NodeDetails data={res.data} />}
      backHref={base}
      onSave={saveNode.bind(null, org, name)}
      onDelete={deleteNode.bind(null, org, name)}
    />
  );
}
