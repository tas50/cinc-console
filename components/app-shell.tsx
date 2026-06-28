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
  displayName,
  children,
}: {
  org: string;
  orgs: Org[];
  displayName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/orgs/${org}`;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip link (WCAG 2.4.1): hidden until focused, lets keyboard users
          jump past the header and nav straight to the page content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/orgs"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Image
              src="/cinc/logo-icon.png"
              alt="Cinc"
              width={22}
              height={22}
              priority
              unoptimized
            />
            <span className="text-text">console</span>
          </Link>
          <OrgSwitcher orgs={orgs} />
        </div>
        <UserMenu name={displayName} />
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* On mobile the nav is a horizontal, scrollable strip under the header;
            from md it becomes the fixed left rail. */}
        <nav
          aria-label="Primary"
          className="shrink-0 overflow-x-auto border-b border-border bg-surface p-3 md:w-48 md:overflow-x-visible md:border-b-0 md:border-r"
        >
          <ul className="flex gap-1 md:flex-col md:space-y-1">
            {NAV.map((item) => {
              const href = `${base}/${item.slug}`;
              const active = pathname.startsWith(href);
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-surface-2 text-link font-medium"
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

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
