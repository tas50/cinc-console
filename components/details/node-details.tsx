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
import { JsonTree } from "./json-tree";
import { RunListEditor } from "./run-list-editor";
import { TagsEditor } from "./tags-editor";
import type { ActionResult } from "@/lib/cinc/action";
import type { ClientStatus } from "@/lib/cinc/fleet";

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

/** The reported client version (`automatic.chef_packages.chef.version`). */
function clientVersion(auto: Record<string, unknown>): unknown {
  const pkgs = isRecord(auto.chef_packages) ? auto.chef_packages : {};
  const chef = isRecord(pkgs.chef) ? pkgs.chef : {};
  return chef.version;
}

/**
 * Lifecycle warning shown next to the client version: amber when the client is
 * a major release behind, red when it's end-of-life. Text carries the meaning
 * (not color alone) and an icon + role="img" label make it screen-reader clear.
 */
function ClientVersionWarning({ status }: { status?: ClientStatus }) {
  if (status !== "major-behind" && status !== "eol") return null;
  const eol = status === "eol";
  const tone = eol ? "border-danger text-danger" : "border-warn text-warn";
  const label = eol ? "End-of-life release" : "One major release behind";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${tone}`}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M8 1.8 15 14H1L8 1.8Z" />
        <path d="M8 6.3v3.4M8 11.7v.01" />
      </svg>
      {eol ? "EOL" : "major release behind"}
    </span>
  );
}

/**
 * Curated read-only view of a Cinc node: a summary pulled from `automatic`,
 * the run list and tags, then each attribute precedence level as a tree.
 * Automatic attributes start collapsed — they are large and machine-generated.
 */
export function NodeDetails({
  data,
  clientStatus,
  onSaveRunList,
  onSaveTags,
}: {
  data: unknown;
  /** Client-version lifecycle standing, for the warning next to the version. */
  clientStatus?: ClientStatus;
  /** When provided, the run list becomes editable and saves via this action. */
  onSaveRunList?: (json: string) => Promise<ActionResult>;
  /** When provided, the tags become editable and save via this action. */
  onSaveTags?: (json: string) => Promise<ActionResult>;
}) {
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
          <Field label="Client version">
            <span className="inline-flex items-center gap-2">
              <ScalarValue value={clientVersion(automatic)} />
              <ClientVersionWarning status={clientStatus} />
            </span>
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

      {onSaveRunList ? (
        <RunListEditor data={node} onSave={onSaveRunList} />
      ) : (
        <DetailSection title="Run list">
          <RunList items={node.run_list} />
        </DetailSection>
      )}

      {onSaveTags ? (
        <TagsEditor data={node} onSave={onSaveTags} />
      ) : (
        <DetailSection title="Tags">
          <Chips items={normal.tags} empty="No tags." />
        </DetailSection>
      )}

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
        <JsonTree value={node.automatic ?? {}} />
      </DetailSection>
    </div>
  );
}
