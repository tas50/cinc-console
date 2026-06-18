"use server";

import { requireUser } from "@/lib/session";
import { getUser, putUser } from "@/lib/cinc/users";
import { runAction, type ActionResult } from "@/lib/cinc/action";

export type ProfileDetails = {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

/** Update the logged-in user's profile fields (PUT replaces, so merge first). */
export async function saveProfile(
  details: ProfileDetails,
): Promise<ActionResult> {
  const user = await requireUser();
  const current = await getUser(user);
  return runAction(() => putUser(user, { ...current, ...details }));
}

/** Change the logged-in user's web-login password. */
export async function changePassword(password: string): Promise<ActionResult> {
  const user = await requireUser();
  if (password.length < 6) {
    return { error: "password must be at least 6 characters" };
  }
  const current = await getUser(user);
  return runAction(() => putUser(user, { ...current, password }));
}
