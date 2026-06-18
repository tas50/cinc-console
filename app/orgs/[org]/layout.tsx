import type { ReactNode } from "react";
import { currentSession } from "@/lib/guard";
import { listUserOrgs } from "@/lib/cinc/orgs";
import { AppShell } from "@/components/app-shell";

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { username, displayName } = await currentSession();
  const { org } = await params;
  const orgs = await listUserOrgs(username).catch(() => [{ name: org }]);

  return (
    <AppShell org={org} orgs={orgs} displayName={displayName}>
      {children}
    </AppShell>
  );
}
