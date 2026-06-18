import "server-only";
import { isCincError } from "./errors";

export type ActionResult = { ok: true } | { error: string };

/**
 * Run a cinc mutation and translate server errors into a UI-friendly result.
 * 403 (the server's ACL gate) becomes "forbidden" so the UI can explain it
 * rather than crashing.
 */
export async function runAction(
  fn: () => Promise<unknown>,
): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (isCincError(e)) {
      if (e.forbidden) return { error: "forbidden" };
      if (e.notFound) return { error: "not found" };
      if (e.conflict) return { error: "already exists" };
      return { error: `server error (${e.status})` };
    }
    throw e;
  }
}

export function parseJsonObject(
  json: string,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  try {
    const value = JSON.parse(json);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ok: true, value };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
