import { DetailSection, FieldGrid, Field, ScalarValue, isRecord } from "./primitives";
import { AttributeTree } from "./attribute-tree";

/**
 * Curated read-only view of a data bag item. The contents are arbitrary, so
 * beyond the required `id` the whole item renders as an attribute tree.
 */
export function DataBagItemDetails({ data }: { data: unknown }) {
  const item = isRecord(data) ? data : {};
  const { id, ...rest } = item;

  return (
    <div className="space-y-4">
      <DetailSection title="Item">
        <FieldGrid>
          <Field label="id">
            <ScalarValue value={id} />
          </Field>
        </FieldGrid>
      </DetailSection>

      <DetailSection title="Contents">
        <AttributeTree data={rest} />
      </DetailSection>
    </div>
  );
}
