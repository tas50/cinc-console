/**
 * True only for an internal absolute path — used to guard post-login redirect
 * targets against open redirects. Requires a leading `/` that is NOT followed
 * by another `/` or a `\`: browsers normalize `\` to `/`, so `/\evil.com` would
 * otherwise resolve to the protocol-relative `//evil.com` (an external host).
 * Rejects absolute URLs (`https://…`), protocol-relative URLs (`//…`), and
 * relative paths.
 */
export function isInternalPath(path: string | null | undefined): path is string {
  return typeof path === "string" && /^\/(?![/\\])/.test(path);
}
