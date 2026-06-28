"use server";

import { requireUser } from "@/lib/session";
import { deletePolicy, deletePolicyRevision } from "@/lib/cinc/policies";
import { runAction, type ActionResult } from "@/lib/cinc/action";

export async function deletePolicyRevisionAction(
  org: string,
  name: string,
  revision: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => deletePolicyRevision(user, org, name, revision), {
    revalidate: `/orgs/${org}/policies`,
  });
}

export async function deletePolicyAction(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => deletePolicy(user, org, name), {
    revalidate: `/orgs/${org}/policies`,
  });
}
