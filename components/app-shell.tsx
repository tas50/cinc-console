"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Org } from "@/lib/cinc/orgs";
import { OrgSwitcher } from "@/components/org-switcher";
import { UserMenu } from "@/components/user-menu";

const NAV: { label: string; slug: string }[] = [
  { label: "Nodes", slug: "nodes" },
  { label: "Roles", slug: "roles" },
  { label: "Environments", slug: "environments" },
  { label: "Data Bags", slug: "data_bags" },
  { label: "Members", slug: "members" },
  { label: "Cookbooks", slug: "cookbooks" },
  { label: "Policies", slug: "policies" },
  { label: "Clients", slug: "clients" },
];

export function AppShell({
  org,
  orgs,
  user,
  children,
}: {
  org: string;
  orgs: Org[];
  user: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/orgs/${org}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/orgs"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Image src="/cinc/logo-icon.png" alt="Cinc" width={22} height={22} />
            <span className="text-text">console</span>
          </Link>
          <OrgSwitcher orgs={orgs} />
        </div>
        <UserMenu user={user} />
      </header>

      <div className="flex flex-1">
        <nav className="w-48 shrink-0 border-r border-border bg-surface p-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const href = `${base}/${item.slug}`;
              const active = pathname.startsWith(href);
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-surface-2 text-primary font-medium"
                        : "text-muted hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
