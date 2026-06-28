"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Catches anything a Server Component throws that isn't a
 * CincError already mapped to a friendly read state (those render inline). This
 * is the last line of defence so a transport/parse failure shows a usable
 * surface instead of the bare Next.js error page.
 */
export default function Error({
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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold">Something went wrong</h1>
        <p className="mb-5 text-sm text-muted">
          The console hit an unexpected error talking to the Cinc server. This is
          usually transient — try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
