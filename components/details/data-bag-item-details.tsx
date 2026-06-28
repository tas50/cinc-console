import { DetailSection, isRecord } from "./primitives";
import { AttributeTree } from "./attribute-tree";

/**
 * Curated read-only view of a data bag item. The item's `id` is already the
 * page title, so we only render the remaining contents — which are arbitrary —
 * as an attribute tree.
 */
export function DataBagItemDetails({ data }: { data: unknown }) {
  const item = isRecord(data) ? data : {};
  const contents = Object.fromEntries(
    Object.entries(item).filter(([key]) => key !== "id"),
  );

  return (
    <DetailSection title="Contents">
      <AttributeTree data={contents} />
    </DetailSection>
  );
}
