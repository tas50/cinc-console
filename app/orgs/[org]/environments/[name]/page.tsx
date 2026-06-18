import { currentUser } from "@/lib/guard";
import { makeResource } from "@/lib/cinc/resource";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ObjectEditor } from "@/components/object-editor";
import { saveEnvironment, deleteEnvironment } from "../actions";

const environments = makeResource("environments");

export default async function EnvironmentDetail({
  params,
}: {
  params: Promise<{ org: string; name: string }>;
}) {
  const { org, name: raw } = await params;
  const name = decodeURIComponent(raw);
  const user = await currentUser();
  const base = `/orgs/${org}/environments`;
  const res = await safeGet(() => environments.get(user, org, name));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  if (name === "_default") {
    return (
      <ObjectEditor
        name={name}
        initialJson={JSON.stringify(res.data, null, 2)}
        backHref={base}
        readOnly={true}
      />
    );
  }
  return (
    <ObjectEditor
      name={name}
      initialJson={JSON.stringify(res.data, null, 2)}
      backHref={base}
      onSave={saveEnvironment.bind(null, org, name)}
      onDelete={deleteEnvironment.bind(null, org, name)}
    />
  );
}
