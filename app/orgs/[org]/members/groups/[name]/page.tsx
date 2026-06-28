import { currentUser } from "@/lib/guard";
import { members } from "@/lib/cinc/members";
import { clients } from "@/lib/cinc/readonly";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { ObjectEditor } from "@/components/object-editor";
import { GroupDetails } from "@/components/details/group-details";
import { saveGroup, deleteGroup } from "../../actions";

/** Valid users / clients / groups in the org, for the membership pickers. */
async function memberOptions(user: string, org: string, self: string) {
  const [users, clientMap, groupMap] = await Promise.all([
    members.listUsers(user, org).catch(() => []),
    clients.list(user, org).catch(() => ({})),
    members.listGroups(user, org).catch(() => ({})),
  ]);
  return {
    users: users.map((u) => u.user.username),
    clients: Object.keys(clientMap),
    // a group can't contain itself
    groups: Object.keys(groupMap).filter((g) => g !== self),
  };
}

export default async function GroupDetail({
  params,
}: {
  params: Promise<{ org: string; name: string }>;
}) {
  const { org, name: raw } = await params;
  const name = decodeURIComponent(raw);
  const user = await currentUser();
  const base = `/orgs/${org}/members`;
  const res = await safeGet(() => members.getGroup(user, org, name));
  if ("error" in res) {
    return <p className="text-sm text-danger">{explainRead(res.error)}</p>;
  }
  const options = await memberOptions(user, org, name);
  return (
    <ObjectEditor
      name={name}
      initialJson={JSON.stringify(res.data, null, 2)}
      details={
        <GroupDetails
          data={res.data}
          onSaveMembers={saveGroup.bind(null, org, name)}
          options={options}
        />
      }
      backHref={base}
      onSave={saveGroup.bind(null, org, name)}
      onDelete={deleteGroup.bind(null, org, name)}
    />
  );
}
