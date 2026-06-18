import "server-only";
import { isCincError } from "./errors";

export type Fetched<T> = { data: T } | { error: string };

/** Run a read against the server, mapping ACL/availability errors to a string. */
export async function safeGet<T>(fn: () => Promise<T>): Promise<Fetched<T>> {
  try {
    return { data: await fn() };
  } catch (e) {
    if (isCincError(e)) {
      if (e.forbidden) return { error: "forbidden" };
      if (e.notFound) return { error: "not found" };
      return { error: `server error (${e.status})` };
    }
    throw e;
  }
}

export function explainRead(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to view this in this organization.";
  return error;
}
