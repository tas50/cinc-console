import {
  DetailSection,
  FieldGrid,
  Field,
  RunList,
  Chips,
  ScalarValue,
  isRecord,
} from "./primitives";
import { AttributeTree } from "./attribute-tree";

/** The node's reported platform (`automatic.platform`), if any. */
export function nodePlatform(data: unknown): unknown {
  const node = isRecord(data) ? data : {};
  const automatic = isRecord(node.automatic) ? node.automatic : {};
  return automatic.platform;
}

function platformText(auto: Record<string, unknown>): string | null {
  const p = auto.platform;
  const v = auto.platform_version;
  if (typeof p === "string" && typeof v === "string") return `${p} ${v}`;
  if (typeof p === "string") return p;
  return null;
}

/**
 * Curated read-only view of a Cinc node: a summary pulled from `automatic`,
 * the run list and tags, then each attribute precedence level as a tree.
 * Automatic attributes start collapsed — they are large and machine-generated.
 */
export function NodeDetails({ data }: { data: unknown }) {
  const node = isRecord(data) ? data : {};
  const automatic = isRecord(node.automatic) ? node.automatic : {};
  const normal = isRecord(node.normal) ? node.normal : {};

  return (
    <div className="space-y-4">
      <DetailSection title="Summary">
        <FieldGrid>
          <Field label="Environment">
            <ScalarValue value={node.chef_environment} />
          </Field>
          <Field label="Platform">
            <ScalarValue value={platformText(automatic)} />
          </Field>
          <Field label="FQDN">
            <ScalarValue value={automatic.fqdn} />
          </Field>
          <Field label="IP address">
            <ScalarValue value={automatic.ipaddress} />
          </Field>
          <Field label="Uptime">
            <ScalarValue value={automatic.uptime} />
          </Field>
        </FieldGrid>
      </DetailSection>

      <DetailSection title="Run list">
        <RunList items={node.run_list} />
      </DetailSection>

      <DetailSection title="Tags">
        <Chips items={normal.tags} empty="No tags." />
      </DetailSection>

      <DetailSection title="Normal attributes">
        <AttributeTree data={node.normal} />
      </DetailSection>

      <DetailSection title="Default attributes">
        <AttributeTree data={node.default} />
      </DetailSection>

      <DetailSection title="Override attributes">
        <AttributeTree data={node.override} />
      </DetailSection>

      <DetailSection title="Automatic attributes">
        <AttributeTree data={node.automatic} defaultOpen={false} />
      </DetailSection>
    </div>
  );
}
