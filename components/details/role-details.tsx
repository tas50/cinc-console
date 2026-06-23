import {
  DetailSection,
  FieldGrid,
  Field,
  RunList,
  KeyValueTable,
  ScalarValue,
  isRecord,
} from "./primitives";
import { AttributeTree } from "./attribute-tree";

/**
 * Curated read-only view of a role: description, the default run list, any
 * per-environment run lists, and the default/override attribute trees.
 */
export function RoleDetails({ data }: { data: unknown }) {
  const role = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      <DetailSection title="Overview">
        <FieldGrid>
          <Field label="Description">
            <ScalarValue value={role.description} />
          </Field>
        </FieldGrid>
      </DetailSection>

      <DetailSection title="Run list">
        <RunList items={role.run_list} />
      </DetailSection>

      <DetailSection title="Per-environment run lists">
        <KeyValueTable
          data={role.env_run_lists}
          emptyText="No environment-specific run lists."
        />
      </DetailSection>

      <DetailSection title="Default attributes">
        <AttributeTree data={role.default_attributes} />
      </DetailSection>

      <DetailSection title="Override attributes">
        <AttributeTree data={role.override_attributes} />
      </DetailSection>
    </div>
  );
}
