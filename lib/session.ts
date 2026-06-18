import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { getConfig } from "./config";

export type SessionData = {
  username?: string;
  loginAt?: number;
};

export function buildSessionOptions(): SessionOptions {
  const cfg = getConfig();
  return {
    password: cfg.sessionSecret,
    cookieName: "cinc_console",
    ttl: cfg.sessionTtlSeconds,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  // Built lazily (not at module load) so `next build` doesn't require runtime
  // config to be present when route modules are imported.
  return getIronSession<SessionData>(await cookies(), buildSessionOptions());
}

export class Unauthorized extends Error {
  constructor() {
    super("not authenticated");
    this.name = "Unauthorized";
  }
}

/** Returns the logged-in username or throws Unauthorized. */
export async function requireUser(): Promise<string> {
  const s = await getSession();
  if (!s.username) throw new Unauthorized();
  return s.username;
}
