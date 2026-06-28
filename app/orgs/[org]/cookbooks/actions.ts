"use server";

import { requireUser } from "@/lib/session";
import { deleteCookbook, deleteCookbookVersion } from "@/lib/cinc/cookbooks";
import { runAction, type ActionResult } from "@/lib/cinc/action";

export async function deleteCookbookVersionAction(
  org: string,
  name: string,
  version: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => deleteCookbookVersion(user, org, name, version), {
    revalidate: `/orgs/${org}/cookbooks`,
  });
}

export async function deleteCookbookAction(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => deleteCookbook(user, org, name), {
    revalidate: `/orgs/${org}/cookbooks`,
  });
}
