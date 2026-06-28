/**
 * Streaming fallback for org pages while their Server Component awaits the Cinc
 * server. The layout (AppShell: header + nav) renders immediately; this skeleton
 * fills the main content area so navigation feels instant on slow reads.
 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-4 h-6 w-40 rounded bg-surface-2" />
      <div className="overflow-hidden rounded-lg border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-11 border-b border-border bg-surface last:border-b-0"
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
