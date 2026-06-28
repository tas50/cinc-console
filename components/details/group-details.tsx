import { DetailSection, Chips, isRecord } from "./primitives";
import { GroupMembersEditor } from "./group-members-editor";
import type { ActionResult } from "@/lib/cinc/action";

/**
 * Curated view of a group: its member users, clients, and nested groups, plus
 * the server-computed `actors` union. When a save action is supplied the
 * membership becomes editable (without raw JSON); `actors` stays read-only
 * since the server derives it.
 */
export function GroupDetails({
  data,
  onSaveMembers,
}: {
  data: unknown;
  /** When provided, group membership becomes editable and saves via this action. */
  onSaveMembers?: (json: string) => Promise<ActionResult>;
}) {
  const group = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      {onSaveMembers ? (
        <GroupMembersEditor data={group} onSave={onSaveMembers} />
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

      <DetailSection title="Actors">
        <Chips items={group.actors} mono empty="No actors." />
      </DetailSection>
    </div>
  );
}
