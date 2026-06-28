import { DetailSection, Chips, isRecord } from "./primitives";
import { GroupMembersEditor, type GroupOptions } from "./group-members-editor";
import type { ActionResult } from "@/lib/cinc/action";

/**
 * Curated view of a group: its membership (users, clients, nested groups) and
 * the server-computed effective-members union. When a save action is supplied
 * the membership becomes editable (without raw JSON); the effective members
 * stay read-only since the server derives them by expanding nested groups.
 */
export function GroupDetails({
  data,
  onSaveMembers,
  options,
}: {
  data: unknown;
  /** When provided, group membership becomes editable and saves via this action. */
  onSaveMembers?: (json: string) => Promise<ActionResult>;
  /** Valid users/clients/groups to choose from when editing. */
  options?: GroupOptions;
}) {
  const group = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      {onSaveMembers ? (
        <GroupMembersEditor data={group} onSave={onSaveMembers} options={options} />
      ) : (
        <>
          <DetailSection title="Users">
            <Chips items={group.users} mono empty="No users." />
          </DetailSection>

          <DetailSection title="Clients">
            <Chips items={group.clients} mono empty="No clients." />
          </DetailSection>

          <DetailSection title="Groups">
            <Chips items={group.groups} mono empty="No nested groups." />
          </DetailSection>
        </>
      )}

      <DetailSection title="Effective members">
        <p className="mb-2 text-xs text-muted">
          Everyone the membership above resolves to, with nested groups expanded
          (computed by the server).
        </p>
        <Chips items={group.actors} mono empty="No members." />
      </DetailSection>
    </div>
  );
}
