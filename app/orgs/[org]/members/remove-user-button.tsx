"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    setConfirming(false);
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
        onClick={() => setConfirming(true)}
        disabled={pending}
        className="text-danger hover:text-danger"
      >
        {pending ? "Removing…" : "Remove"}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={`Remove ${username}?`}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        This removes <span className="font-mono">{username}</span> from this
        organization. They can be invited back later.
      </ConfirmDialog>
    </div>
  );
}
