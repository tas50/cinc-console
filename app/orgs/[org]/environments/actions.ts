"use server";

import { requireUser } from "@/lib/session";
import { makeResource } from "@/lib/cinc/resource";
import { runAction, parseJsonObject, type ActionResult } from "@/lib/cinc/action";

const environments = makeResource("environments");

export async function saveEnvironment(
  org: string,
  name: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => environments.update(user, org, name, parsed.value), {
    revalidate: `/orgs/${org}/environments`,
  });
}

export async function createEnvironment(
  org: string,
  name: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(
    () => environments.create(user, org, { ...parsed.value, name }),
    { revalidate: `/orgs/${org}/environments` },
  );
}

export async function deleteEnvironment(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => environments.remove(user, org, name), {
    revalidate: `/orgs/${org}/environments`,
  });
}
