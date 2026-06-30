// Small, pure time-formatting helpers for the UI. No React and no I/O so they
// unit-test cleanly and can be shared by server and client components alike.

/** "just now" / "5s ago" / "3m ago" / "2h ago" / "4d ago" from a ms delta. */
export function relativeAgo(deltaMs: number): string {
  const s = Math.max(0, Math.floor(deltaMs / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
