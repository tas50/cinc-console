"use server";

import { requireUser } from "@/lib/session";
import { dataBags } from "@/lib/cinc/databags";
import { runAction, parseJsonObject, type ActionResult } from "@/lib/cinc/action";

export async function createBag(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => dataBags.createBag(user, org, name));
}

export async function deleteBag(
  org: string,
  bag: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => dataBags.removeBag(user, org, bag));
}

export async function saveItem(
  org: string,
  bag: string,
  id: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => dataBags.putItem(user, org, bag, id, parsed.value));
}

export async function createItem(
  org: string,
  bag: string,
  id: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() =>
    dataBags.createItem(user, org, bag, { ...parsed.value, id }),
  );
}

export async function deleteItem(
  org: string,
  bag: string,
  id: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => dataBags.removeItem(user, org, bag, id));
}
