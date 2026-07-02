// Chef v1.3 (SHA-256) signed-header protocol.
//
// This is a faithful TypeScript port of cinc-api/internal/signing. The
// canonical string layout, header names, server-api-version, and 60-char
// authorization chunking must stay byte-for-byte identical to that
// implementation — the conformance test in signing.test.ts pins it.
import { createHash, createSign } from "node:crypto";

export const SERVER_API_VERSION = "1";

export type SignRequest = {
  method: string;
  path: string;
  body?: string | Buffer;
  userId: string;
  /** ISO-8601 UTC, e.g. 2024-01-01T00:00:00Z */
  timestamp: string;
};

/** Collapse repeated slashes and strip a trailing slash. */
export function canonicalPath(p: string): string {
  if (p === "") return "/";
  let out = p.includes("//") ? p.replace(/\/+/g, "/") : p;
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

/** base64(sha256(body)) */
export function contentHash(body: string | Buffer = ""): string {
  return createHash("sha256").update(body).digest("base64");
}

/** The v1.3 string-to-sign for r. */
export function canonicalRequest(r: SignRequest): string {
  const ch = contentHash(r.body ?? "");
  return (
    "Method:" +
    r.method +
    "\nPath:" +
    canonicalPath(r.path) +
    "\nX-Ops-Content-Hash:" +
    ch +
    "\nX-Ops-Sign:version=1.3" +
    "\nX-Ops-Timestamp:" +
    r.timestamp +
    "\nX-Ops-UserId:" +
    r.userId +
    "\nX-Ops-Server-API-Version:" +
    SERVER_API_VERSION
  );
}

function chunk60(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += 60) out.push(s.slice(i, i + 60));
  return out;
}

/** Sign r with a PEM private key and return the headers to add to the request. */
export function signHeaders(
  r: SignRequest,
  pemKey: string,
): Record<string, string> {
  const ch = contentHash(r.body ?? "");
  // createSign('RSA-SHA256') signs sha256(canonical) with PKCS#1 v1.5 padding,
  // identical to the Go rsa.SignPKCS1v15(..., crypto.SHA256, ...) call.
  const sig = createSign("RSA-SHA256")
    .update(canonicalRequest(r))
    .sign(pemKey, "base64");
  const h: Record<string, string> = {
    "X-Ops-Sign": "version=1.3",
    "X-Ops-UserId": r.userId,
    "X-Ops-Timestamp": r.timestamp,
    "X-Ops-Content-Hash": ch,
    "X-Ops-Server-API-Version": SERVER_API_VERSION,
  };
  chunk60(sig).forEach((c, i) => {
    // `i` is a numeric array index, so the key is always the fixed literal
    // `X-Ops-Authorization-<n>` — no user-controlled string reaches it, so
    // prototype-pollution / property-injection is not possible here.
    h[`X-Ops-Authorization-${i + 1}`] = c; // nosemgrep: javascript-remote-property-injection
  });
  return h;
}
