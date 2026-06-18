import "server-only";
import { redirect } from "next/navigation";
import { getSession, requireUser, Unauthorized } from "./session";

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

/**
 * Return the logged-in user's identity (login name + display label) in a Server
 * Component, redirecting to /login if unauthenticated.
 */
export async function currentSession(): Promise<{
  username: string;
  displayName: string;
}> {
  const s = await getSession();
  if (!s.username) redirect("/login");
  return { username: s.username, displayName: s.displayName || s.username };
}
