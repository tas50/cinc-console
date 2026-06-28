"use server";

import { requireUser } from "@/lib/session";
import { makeResource } from "@/lib/cinc/resource";
import { runAction, parseJsonObject, type ActionResult } from "@/lib/cinc/action";

const roles = makeResource("roles");

export async function saveRole(
  org: string,
  name: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => roles.update(user, org, name, parsed.value), {
    revalidate: `/orgs/${org}/roles`,
  });
}

export async function createRole(
  org: string,
  name: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => roles.create(user, org, { ...parsed.value, name }), {
    revalidate: `/orgs/${org}/roles`,
  });
}

export async function deleteRole(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => roles.remove(user, org, name), {
    revalidate: `/orgs/${org}/roles`,
  });
}
