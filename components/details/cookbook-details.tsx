import { DetailSection, Chips, isRecord } from "./primitives";
import { AttributeTree } from "./attribute-tree";

/**
 * Pulls the version strings out of a cookbook payload. The `/cookbooks/NAME`
 * endpoint nests them as `{ NAME: { versions: [{ version, url }, …] } }`, so we
 * look for the first value carrying a `versions` array rather than assuming the
 * cookbook's name as the key.
 */
function versionList(data: Record<string, unknown>): string[] {
  for (const value of Object.values(data)) {
    if (isRecord(value) && Array.isArray(value.versions)) {
      return value.versions
        .map((v) =>
          isRecord(v) && typeof v.version === "string" ? v.version : null,
        )
        .filter((v): v is string => v !== null);
    }
  }
  return [];
}

/**
 * Curated read-only view of a cookbook: its available versions, with the full
 * payload as a tree underneath since cookbook shapes vary by server version.
 */
export function CookbookDetails({ data }: { data: unknown }) {
  const cookbook = isRecord(data) ? data : {};

  return (
    <div className="space-y-4">
      <DetailSection title="Versions">
        <Chips items={versionList(cookbook)} mono empty="No versions." />
      </DetailSection>

      <DetailSection title="Details">
        <AttributeTree data={cookbook} defaultOpen={false} />
      </DetailSection>
    </div>
  );
}
