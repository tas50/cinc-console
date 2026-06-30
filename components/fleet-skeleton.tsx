import { Card } from "@/components/ui/card";

/**
 * Loading placeholders for the streamed dashboard. They render while a Suspense
 * boundary waits on Cinc data. `motion-safe:animate-pulse` respects
 * `prefers-reduced-motion`; the bars are `aria-hidden` and each waiting region
 * carries an SR-only `role="status"` so screen readers are told work is in
 * flight (see DashboardSkeleton / the leading preview).
 */

/** Soft pulsing bar used to stand in for a not-yet-loaded value. */
function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded bg-surface-2 motion-safe:animate-pulse ${className ?? ""}`}
    />
  );
}

/**
 * A stat-tile placeholder. A `label` keeps the tile's heading stable while only
 * its number is loading (used for the Outdated tile during the fast-count
 * phase); omit it to skeleton the whole tile.
 */
export function TileSkeleton({ label }: { label?: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        {label ? (
          <span className="text-sm font-medium text-text">{label}</span>
        ) : (
          <Bar className="h-4 w-24" />
        )}
        <Bar className="h-4 w-4" />
      </div>
      <Bar className="mt-2 h-9 w-12" />
      <Bar className="mt-2 h-3 w-28" />
    </Card>
  );
}

/** Row of three tile placeholders matching the dashboard's tile grid. */
export function TilesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <TileSkeleton />
      <TileSkeleton />
      <TileSkeleton />
    </div>
  );
}

/** The node-list card as a skeleton: a header bar plus a few empty rows. */
export function ListSkeleton() {
  return (
    <Card className="p-0">
      <div className="border-b border-border px-4 py-3">
        <Bar className="h-4 w-20" />
      </div>
      <div aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            <Bar className="h-4 w-40" />
            <Bar className="h-4 w-20" />
            <Bar className="h-4 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Full-dashboard skeleton: the instant first paint before any data lands. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <p role="status" className="sr-only">
        Loading fleet…
      </p>
      <TilesSkeleton />
      <ListSkeleton />
    </div>
  );
}
