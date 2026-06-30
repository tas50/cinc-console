import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconWarning, IconQuestion } from "@/components/ui/icons";
import { ListSkeleton, TileSkeleton } from "@/components/fleet-skeleton";
import type { FleetCounts } from "@/lib/cinc/fleet-counts";

/**
 * The fast first-paint of the dashboard, shown inside the Suspense fallback
 * while the heavy fleet sweep loads. The Missing and Unconfigured counts come
 * from cheap `rows=0` searches (resolved by `countsPromise`), so they appear
 * well before the full snapshot. The Outdated tile and the node list still need
 * the sweep — they stay skeletons here and the interactive `FleetDashboard`
 * replaces this whole preview once the snapshot lands.
 *
 * These tiles are intentionally non-interactive: there's no node list yet for a
 * tile filter to act on, so they render as plain cards, not filter buttons.
 */
export async function LeadingPreview({
  countsPromise,
}: {
  countsPromise: Promise<FleetCounts>;
}) {
  const counts = await countsPromise;
  return (
    <div className="space-y-6">
      <p role="status" className="sr-only">
        Loaded the fleet summary; loading the node list…
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PreviewTile
          label="Missing"
          help="No check-in in the last 12 hours"
          count={counts.missing}
          tone="danger"
          icon={<IconWarning />}
        />
        <PreviewTile
          label="Unconfigured"
          help="Empty run-list and no policy"
          count={counts.unconfigured}
          tone="warn"
          icon={<IconQuestion />}
        />
        {/* Outdated classification needs the full sweep + lifecycle data. */}
        <TileSkeleton label="Outdated clients" />
      </div>
      <ListSkeleton />
    </div>
  );
}

function PreviewTile({
  label,
  help,
  count,
  tone,
  icon,
}: {
  label: string;
  help: string;
  count: number | null;
  tone: "danger" | "warn";
  icon: React.ReactNode;
}) {
  const toneText = { danger: "text-danger", warn: "text-warn" }[tone];
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className={cn("shrink-0", toneText)} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tabular-nums", toneText)}>
        {count === null ? "—" : count}
      </div>
      <div className="mt-1 text-xs text-muted">{help}</div>
    </Card>
  );
}
