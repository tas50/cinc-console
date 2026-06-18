import type { ReactNode } from "react";
import { currentUser } from "@/lib/guard";
import { listUserOrgs } from "@/lib/cinc/orgs";
import { AppShell } from "@/components/app-shell";

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ org: string }>;
}) {
  const user = await currentUser();
  const { org } = await params;
  const orgs = await listUserOrgs(user).catch(() => [{ name: org }]);

  return (
    <AppShell org={org} orgs={orgs} user={user}>
      {children}
    </AppShell>
  );
}
