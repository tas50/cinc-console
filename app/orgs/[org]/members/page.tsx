import Link from "next/link";
import { currentUser } from "@/lib/guard";
import { members } from "@/lib/cinc/members";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { InviteForm } from "./invite-form";
import { RemoveUserButton } from "./remove-user-button";
import { inviteUser, removeUser } from "./actions";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();
  const base = `/orgs/${org}/members`;

  const usersRes = await safeGet(() => members.listUsers(user, org));
  const groupsRes = await safeGet(() => members.listGroups(user, org));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
        <InviteForm onInvite={inviteUser.bind(null, org)} />
        {"error" in usersRes ? (
          <p className="text-sm text-danger">{explainRead(usersRes.error)}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {usersRes.data.length === 0 ? (
              <p className="p-4 text-sm text-muted">No users.</p>
            ) : (
              <ul className="divide-y divide-border">
                {usersRes.data
                  .map((d) => d.user.username)
                  .sort()
                  .map((username) => (
                    <li
                      key={username}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <span className="font-mono text-sm text-text">
                        {username}
                      </span>
                      <RemoveUserButton
                        username={username}
                        onRemove={removeUser.bind(null, org, username)}
                      />
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Groups</h2>
        {"error" in groupsRes ? (
          <p className="text-sm text-danger">{explainRead(groupsRes.error)}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {Object.keys(groupsRes.data).length === 0 ? (
              <p className="p-4 text-sm text-muted">No groups.</p>
            ) : (
              <ul className="divide-y divide-border">
                {Object.keys(groupsRes.data)
                  .sort()
                  .map((name) => (
                    <li key={name}>
                      <Link
                        href={`${base}/groups/${encodeURIComponent(name)}`}
                        className="block px-4 py-2 font-mono text-sm text-text hover:bg-surface-2"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
