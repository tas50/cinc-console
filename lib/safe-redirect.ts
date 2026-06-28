/**
 * True only for a safe in-app redirect target: a single-slash absolute path
 * with no scheme or host. Rejects protocol-relative (`//host`), backslash
 * tricks (`/\host`, which some browsers normalize to `//host`), and absolute
 * URLs — all of which would be open redirects.
 */
export function isInternalPath(path: string | null | undefined): path is string {
  return typeof path === "string" && /^\/(?![/\\])/.test(path);
}
