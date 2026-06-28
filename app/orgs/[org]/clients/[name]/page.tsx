import { currentUser } from "@/lib/guard";
import { clients } from "@/lib/cinc/readonly";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ObjectEditor } from "@/components/object-editor";
import { ClientDetails } from "@/components/details/client-details";
import { deleteClientAction } from "../actions";

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ org: string; name: string }>;
}) {
  const { org, name: raw } = await params;
  const name = decodeURIComponent(raw);
  const user = await currentUser();
  const res = await safeGet(() => clients.get(user, org, name));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  return (
    <ObjectEditor
      name={name}
      initialJson={JSON.stringify(res.data, null, 2)}
      details={<ClientDetails data={res.data} />}
      backHref={`/orgs/${org}/clients`}
      readOnly={true}
      onDelete={deleteClientAction.bind(null, org, name)}
    />
  );
}
