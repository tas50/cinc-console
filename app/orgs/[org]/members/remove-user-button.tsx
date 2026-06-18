"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/cinc/action";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to remove users in this organization.";
  return error;
}

export function RemoveUserButton({
  username,
  onRemove,
}: {
  username: string;
  onRemove: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Remove ${username} from this organization?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await onRemove();
      if ("ok" in res) {
        router.refresh();
      } else {
        setError(explain(res.error));
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
      <Button
        variant="ghost"
        onClick={remove}
        disabled={pending}
        className="text-danger hover:text-danger"
      >
        {pending ? "Removing…" : "Remove"}
      </Button>
    </div>
  );
}
