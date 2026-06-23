import {
  DetailSection,
  FieldGrid,
  Field,
  KeyValueTable,
  ScalarValue,
  isRecord,
} from "./primitives";
import { AttributeTree } from "./attribute-tree";

/**
 * Curated read-only view of an environment: description, cookbook version
 * constraints, and the default/override attribute trees.
 */
export function EnvironmentDetails({ data }: { data: unknown }) {
  const env = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      <DetailSection title="Overview">
        <FieldGrid>
          <Field label="Description">
            <ScalarValue value={env.description} />
          </Field>
        </FieldGrid>
      </DetailSection>

      <DetailSection title="Cookbook version constraints">
        <KeyValueTable
          data={env.cookbook_versions}
          emptyText="No version constraints."
        />
      </DetailSection>

      <DetailSection title="Default attributes">
        <AttributeTree data={env.default_attributes} />
      </DetailSection>

      <DetailSection title="Override attributes">
        <AttributeTree data={env.override_attributes} />
      </DetailSection>
    </div>
  );
}
