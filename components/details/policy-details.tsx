import { DetailSection, Chips, isRecord } from "./primitives";
import { AttributeTree } from "./attribute-tree";

/**
 * Curated read-only view of a policy: its revision ids, with the full payload
 * as a tree underneath. `/policies/NAME` returns `{ revisions: { id: {} } }`.
 */
export function PolicyDetails({ data }: { data: unknown }) {
  const policy = isRecord(data) ? data : {};
  const revisions = isRecord(policy.revisions)
    ? Object.keys(policy.revisions)
    : [];

  return (
    <div className="space-y-4">
      <DetailSection title="Revisions">
        <Chips items={revisions} mono empty="No revisions." />
      </DetailSection>

      <DetailSection title="Details">
        <AttributeTree data={policy} defaultOpen={false} />
      </DetailSection>
    </div>
  );
}
