import "server-only";
import { cincRequest } from "./client";
import { isCincError } from "./errors";

export type AuthUser = {
  username: string;
  display_name?: string;
  [k: string]: unknown;
};

/**
 * Validate a username/password against the server by signing a top-level
 * POST /authenticate_user with the webui key. Returns the authenticated user
 * (the endpoint echoes the user record, including display_name) on success,
 * null on bad credentials (401), and rethrows anything else.
 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  try {
    const res = await cincRequest<{ user?: AuthUser }>({
      user: username,
      method: "POST",
      path: "/authenticate_user",
      body: { username, password },
    });
    return res?.user ?? { username };
  } catch (e) {
    if (isCincError(e) && e.status === 401) return null;
    throw e;
  }
}
