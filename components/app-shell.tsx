"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Org } from "@/lib/cinc/orgs";
import { OrgSwitcher } from "@/components/org-switcher";
import { UserMenu } from "@/components/user-menu";
import { CommandPalette } from "@/components/command-palette";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NAV } from "@/lib/nav";

/** Shared styling for a left-nav link; `active` gets the current-page treatment. */
function navLinkClass(active: boolean): string {
  return cn(
    "block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
    active
      ? "bg-primary/15 text-link font-medium"
      : "text-muted hover:bg-surface-2 hover:text-text",
  );
}

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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
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
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <CommandPalette org={org} orgs={orgs} />
          </div>
          <UserMenu name={displayName} />
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* On mobile the nav is a horizontal, scrollable strip under the header;
            from md it becomes the fixed left rail. */}
        <nav
          aria-label="Primary"
          className="shrink-0 overflow-x-auto border-b border-border bg-surface p-3 md:w-48 md:overflow-x-visible md:border-b-0 md:border-r"
        >
          <ul className="flex gap-1 md:flex-col md:space-y-1">
            {/* Dashboard is the org root, not an object section, so it lives
                outside NAV and matches its path exactly — every sub-page's path
                starts with `base`, so startsWith would keep it always active. */}
            <li key="dashboard">
              <Link
                href={base}
                aria-current={pathname === base ? "page" : undefined}
                className={navLinkClass(pathname === base)}
              >
                Dashboard
              </Link>
            </li>
            {NAV.map((item) => {
              const href = `${base}/${item.slug}`;
              const active = pathname.startsWith(href);
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={navLinkClass(active)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
