// Server-only transport for the cinc server.
//
// Every request is signed with the webui key while impersonating the
// logged-in user (X-Ops-UserId + X-Ops-Request-Source: web), so the server
// enforces that user's real ACLs. This module must never be imported into a
// Client Component — it holds the webui key.
import "server-only";
import { Agent, setGlobalDispatcher } from "undici";
import { getConfig } from "../config";
import { signHeaders } from "./signing";
import { CincError } from "./errors";

let dispatcherReady = false;

function ensureTls() {
  if (dispatcherReady) return;
  const { caCert, sslNoVerify } = getConfig();
  if (sslNoVerify || caCert) {
    setGlobalDispatcher(
      new Agent({ connect: { rejectUnauthorized: !sslNoVerify, ca: caCert } }),
    );
  }
  dispatcherReady = true;
}

/** ISO-8601 UTC with no fractional seconds, e.g. 2024-01-01T00:00:00Z. */
export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

export type CincRequestOptions = {
  user: string;
  method: string;
  path: string;
  body?: unknown;
  /** When set, the path is prefixed with /organizations/<org>. */
  org?: string;
};

export async function cincRequest<T>(opts: CincRequestOptions): Promise<T> {
  ensureTls();
  const { serverUrl, webuiKey, chefVersion } = getConfig();
  const fullPath = opts.org
    ? `/organizations/${opts.org}${opts.path}`
    : opts.path;
  const bodyStr = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = {
    ...signHeaders(
      {
        method: opts.method,
        path: fullPath,
        body: bodyStr,
        userId: opts.user,
        timestamp: nowIso(),
      },
      webuiKey,
    ),
    "X-Ops-Request-Source": "web",
    "X-Chef-Version": chefVersion,
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(serverUrl + fullPath, {
    method: opts.method,
    headers,
    body: opts.body === undefined ? undefined : bodyStr,
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!res.ok) throw new CincError(res.status, parsed ?? text);
  return parsed as T;
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
