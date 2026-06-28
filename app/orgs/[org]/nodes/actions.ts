"use server";

import { requireUser } from "@/lib/session";
import { makeResource } from "@/lib/cinc/resource";
import { runAction, parseJsonObject, type ActionResult } from "@/lib/cinc/action";

const nodes = makeResource("nodes");

export async function saveNode(
  org: string,
  name: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => nodes.update(user, org, name, parsed.value), {
    revalidate: `/orgs/${org}/nodes`,
  });
}

export async function createNode(
  org: string,
  name: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => nodes.create(user, org, { ...parsed.value, name }), {
    revalidate: `/orgs/${org}/nodes`,
  });
}

export async function deleteNode(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => nodes.remove(user, org, name), {
    revalidate: `/orgs/${org}/nodes`,
  });
}
