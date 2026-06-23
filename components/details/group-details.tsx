import { DetailSection, Chips, isRecord } from "./primitives";

/**
 * Curated read-only view of a group: its member users, clients, and nested
 * groups. `actors` is the flattened union the server computes from the rest.
 */
export function GroupDetails({ data }: { data: unknown }) {
  const group = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      <DetailSection title="Users">
        <Chips items={group.users} mono empty="No users." />
      </DetailSection>

      <DetailSection title="Clients">
        <Chips items={group.clients} mono empty="No clients." />
      </DetailSection>

      <DetailSection title="Groups">
        <Chips items={group.groups} mono empty="No nested groups." />
      </DetailSection>

      <DetailSection title="Actors">
        <Chips items={group.actors} mono empty="No actors." />
      </DetailSection>
    </div>
  );
}
