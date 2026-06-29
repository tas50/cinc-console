import { currentUser } from "@/lib/guard";
import { makeResource } from "@/lib/cinc/resource";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ObjectEditor } from "@/components/object-editor";
import { NodeDetails, nodePlatform } from "@/components/details/node-details";
import { PlatformIcon } from "@/components/platform/platform-icon";
import { getClientLifecycle } from "@/lib/cinc/client-lifecycle";
import { versionStatus } from "@/lib/cinc/fleet";
import { nowMs } from "@/lib/cinc/client";
import { saveNode, deleteNode } from "../actions";

const nodes = makeResource("nodes");

/** Pull automatic.chef_packages.chef.version off a fetched node object. */
function nodeClientVersion(data: unknown): string | null {
  const rec = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const version = rec(rec(rec(rec(data).automatic).chef_packages).chef).version;
  return typeof version === "string" ? version : null;
}

export default async function NodeDetail({
  params,
}: {
  params: Promise<{ org: string; name: string }>;
}) {
  const { org, name: raw } = await params;
  const name = decodeURIComponent(raw);
  const user = await currentUser();
  const base = `/orgs/${org}/nodes`;

  // Fetch the node and the client lifecycle in parallel; the lifecycle is
  // cached and degrades to "unavailable" on its own, so it never blocks the node.
  const [res, lifecycle] = await Promise.all([
    safeGet(() => nodes.get(user, org, name)),
    getClientLifecycle(nowMs()),
  ]);
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }

  // No fleet baseline on a single node, so pass null fallback: with the
  // lifecycle present we still get EOL and major-behind; without it, no warning.
  const clientStatus = versionStatus(
    nodeClientVersion(res.data),
    lifecycle,
    null,
  );

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
      details={
        <NodeDetails
          data={res.data}
          clientStatus={clientStatus}
          onSaveRunList={saveNode.bind(null, org, name)}
          onSaveTags={saveNode.bind(null, org, name)}
        />
      }
      backHref={base}
      onSave={saveNode.bind(null, org, name)}
      onDelete={deleteNode.bind(null, org, name)}
    />
  );
}
