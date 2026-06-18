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

export const sessionOptions = buildSessionOptions();

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
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
