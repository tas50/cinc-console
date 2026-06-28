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
import { RunListEditor } from "./run-list-editor";
import { DescriptionEditor } from "./description-editor";
import type { ActionResult } from "@/lib/cinc/action";

/**
 * Curated read-only view of a role: description, the default run list, any
 * per-environment run lists, and the default/override attribute trees. When
 * save actions are supplied the overview and run list become editable.
 */
export function RoleDetails({
  data,
  onSaveRunList,
  onSaveOverview,
}: {
  data: unknown;
  /** When provided, the run list becomes editable and saves via this action. */
  onSaveRunList?: (json: string) => Promise<ActionResult>;
  /** When provided, the overview (description) becomes editable. */
  onSaveOverview?: (json: string) => Promise<ActionResult>;
}) {
  const role = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      {onSaveOverview ? (
        <DescriptionEditor data={role} onSave={onSaveOverview} />
      ) : (
        <DetailSection title="Overview">
          <FieldGrid>
            <Field label="Description">
              <ScalarValue value={role.description} />
            </Field>
          </FieldGrid>
        </DetailSection>
      )}

      {onSaveRunList ? (
        <RunListEditor data={role} onSave={onSaveRunList} />
      ) : (
        <DetailSection title="Run list">
          <RunList items={role.run_list} />
        </DetailSection>
      )}

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
