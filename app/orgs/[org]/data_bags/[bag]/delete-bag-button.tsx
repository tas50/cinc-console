"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ActionResult } from "@/lib/cinc/action";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to delete data bags in this organization.";
  return error;
}

/**
 * Deletes an entire data bag. The warning is explicit that this removes every
 * item in the bag, since the server cascades the delete and it can't be undone.
 */
export function DeleteBagButton({
  org,
  bag,
  itemCount,
  onDelete,
}: {
  org: string;
  bag: string;
  itemCount: number;
  onDelete: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setConfirming(false);
    setError(null);
    startTransition(async () => {
      const res = await onDelete();
      if ("ok" in res) {
        router.push(`/orgs/${org}/data_bags`);
        router.refresh();
      } else {
        setError(explain(res.error));
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      )}
      <Button
        variant="danger"
        onClick={() => setConfirming(true)}
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete data bag"}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={`Delete data bag ${bag}?`}
        confirmLabel="Delete data bag"
        confirmVariant="danger"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        This permanently deletes the data bag{" "}
        <span className="font-mono">{bag}</span> and{" "}
        <strong>
          all {itemCount} item{itemCount === 1 ? "" : "s"}
        </strong>{" "}
        inside it. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
