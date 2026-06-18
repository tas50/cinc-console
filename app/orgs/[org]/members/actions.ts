"use server";

import { requireUser } from "@/lib/session";
import { members } from "@/lib/cinc/members";
import { runAction, parseJsonObject, type ActionResult } from "@/lib/cinc/action";

export async function inviteUser(
  org: string,
  username: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => members.invite(user, org, username));
}

export async function removeUser(
  org: string,
  username: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => members.removeUser(user, org, username));
}

export async function saveGroup(
  org: string,
  group: string,
  json: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseJsonObject(json);
  if (!parsed.ok) return { error: "invalid JSON" };
  return runAction(() => members.updateGroup(user, org, group, parsed.value));
}
