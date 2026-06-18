import "server-only";
import { redirect } from "next/navigation";
import { requireUser, Unauthorized } from "./session";

/**
 * Return the logged-in username in a Server Component, redirecting to /login
 * if the session is missing or invalid.
 */
export async function currentUser(): Promise<string> {
  try {
    return await requireUser();
  } catch (e) {
    if (e instanceof Unauthorized) redirect("/login");
    throw e;
  }
}
