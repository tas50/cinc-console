import { PageHeader } from "@/components/ui/page-header";
import { FleetDashboard } from "@/components/fleet-dashboard";
import { currentUser } from "@/lib/guard";
import { explainRead } from "@/lib/cinc/safe-get";
import { loadFleetSnapshot } from "@/lib/cinc/fleet-snapshot";
import { nowMs } from "@/lib/cinc/client";

export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const user = await currentUser();

  // Render the first snapshot server-side so the dashboard paints populated;
  // the client component then polls /orgs/<org>/fleet every 10s to refresh.
  const res = await loadFleetSnapshot(user, org, nowMs());
  const initial = "error" in res ? null : res.data;
  const initialError = "error" in res ? explainRead(res.error) : null;

  return (
    <div className="space-y-6">
      <PageHeader title={org} description="Fleet overview" />
      <FleetDashboard
        org={org}
        initial={initial}
        initialError={initialError}
      />
    </div>
  );
}
