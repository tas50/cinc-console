"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for org pages. It lives under the org layout, so the AppShell
 * (header + nav) stays rendered and the failure is contained to the content
 * area — the user keeps their bearings and can navigate elsewhere, instead of
 * the whole screen being replaced by the root boundary.
 */
export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in server/browser logs for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md rounded-lg border border-border bg-surface p-6 text-center">
      <h2 className="mb-2 text-base font-semibold">Couldn&rsquo;t load this page</h2>
      <p className="mb-5 text-sm text-muted">
        The console hit an error talking to the Cinc server. This is usually
        transient — try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
