import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Themed 404 for unmatched routes and any `notFound()` call (e.g. a bogus org
 * slug). Without it the user drops to Next.js's bare default page.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-border bg-surface p-8 text-center">
        <p className="mb-3 font-mono text-6xl font-bold text-primary">404</p>
        <h1 className="mb-2 text-lg font-semibold">Nothing cooking here</h1>
        <p className="mb-6 text-sm text-muted">
          We checked every cookbook, data bag, and node &mdash; this page just
          isn&rsquo;t on the menu. It was deleted, never existed, or someone
          fat-fingered the URL. (No judgment.)
        </p>
        <Link href="/orgs">
          <Button>Back to your orgs</Button>
        </Link>
      </div>
    </main>
  );
}
