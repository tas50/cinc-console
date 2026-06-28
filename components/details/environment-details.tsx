import {
  DetailSection,
  FieldGrid,
  Field,
  KeyValueTable,
  ScalarValue,
  isRecord,
} from "./primitives";
import { AttributeTree } from "./attribute-tree";
import { DescriptionEditor } from "./description-editor";
import type { ActionResult } from "@/lib/cinc/action";

/**
 * Curated read-only view of an environment: description, cookbook version
 * constraints, and the default/override attribute trees. With a save action the
 * overview (description) becomes editable.
 */
export function EnvironmentDetails({
  data,
  onSaveOverview,
}: {
  data: unknown;
  /** When provided, the overview (description) becomes editable. */
  onSaveOverview?: (json: string) => Promise<ActionResult>;
}) {
  const env = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      {onSaveOverview ? (
        <DescriptionEditor data={env} onSave={onSaveOverview} />
      ) : (
        <DetailSection title="Overview">
          <FieldGrid>
            <Field label="Description">
              <ScalarValue value={env.description} />
            </Field>
          </FieldGrid>
        </DetailSection>
      )}

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
