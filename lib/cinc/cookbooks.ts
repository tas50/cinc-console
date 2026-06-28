import "server-only";
import { cincRequest } from "./client";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Pull version strings out of a `/cookbooks/NAME` payload, which nests them as
 * `{ NAME: { versions: [{ version, url }, …] } }`. Pure — no request — so a page
 * that already fetched the cookbook can reuse it.
 */
export function parseCookbookVersions(data: unknown): string[] {
  if (!isRecord(data)) return [];
  for (const value of Object.values(data)) {
    if (isRecord(value) && Array.isArray(value.versions)) {
      return value.versions
        .map((v) => (isRecord(v) && typeof v.version === "string" ? v.version : null))
        .filter((v): v is string => v !== null);
    }
  }
  return [];
}

/** Version strings for a cookbook (`GET /cookbooks/NAME`). */
export async function listCookbookVersions(
  user: string,
  org: string,
  name: string,
): Promise<string[]> {
  const data = await cincRequest<Record<string, unknown>>({
    user,
    org,
    method: "GET",
    path: `/cookbooks/${name}`,
  });
  return parseCookbookVersions(data);
}

/** Delete a single cookbook version (`DELETE /cookbooks/NAME/VERSION`). */
export async function deleteCookbookVersion(
  user: string,
  org: string,
  name: string,
  version: string,
): Promise<void> {
  await cincRequest({
    user,
    org,
    method: "DELETE",
    path: `/cookbooks/${name}/${version}`,
  });
}

/**
 * Delete an entire cookbook. Chef has no whole-cookbook delete; remove every
 * version. Sequential so a mid-way ACL/transport failure surfaces clearly
 * rather than firing a burst of partially-applied deletes.
 */
export async function deleteCookbook(
  user: string,
  org: string,
  name: string,
): Promise<void> {
  const versions = await listCookbookVersions(user, org, name);
  for (const version of versions) {
    await deleteCookbookVersion(user, org, name, version);
  }
}
