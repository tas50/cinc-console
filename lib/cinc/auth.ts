import "server-only";
import { cincRequest } from "./client";
import { isCincError } from "./errors";

/**
 * Validate a username/password against the server by signing a top-level
 * POST /authenticate_user with the webui key. Returns true on success,
 * false on bad credentials (401), and rethrows anything else.
 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    await cincRequest({
      user: username,
      method: "POST",
      path: "/authenticate_user",
      body: { username, password },
    });
    return true;
  } catch (e) {
    if (isCincError(e) && e.status === 401) return false;
    throw e;
  }
}
