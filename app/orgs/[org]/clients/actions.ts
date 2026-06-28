"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createClient, deleteClient } from "@/lib/cinc/clients";
import { runAction, type ActionResult } from "@/lib/cinc/action";
import { isCincError } from "@/lib/cinc/errors";

export type CreateClientResult =
  | { ok: true; privateKey: string }
  | { error: string };

/**
 * Create a client and return its one-time private key. Unlike the generic
 * runAction flow this carries a payload (the key), so it maps errors itself.
 */
export async function createClientAction(
  org: string,
  name: string,
): Promise<CreateClientResult> {
  const user = await requireUser();
  try {
    const { privateKey } = await createClient(user, org, name);
    revalidatePath(`/orgs/${org}/clients`, "layout");
    return { ok: true, privateKey };
  } catch (e) {
    if (isCincError(e)) {
      if (e.forbidden) return { error: "forbidden" };
      if (e.conflict) return { error: "already exists" };
      return { error: `server error (${e.status})` };
    }
    throw e;
  }
}

export async function deleteClientAction(
  org: string,
  name: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(() => deleteClient(user, org, name), {
    revalidate: `/orgs/${org}/clients`,
  });
}
