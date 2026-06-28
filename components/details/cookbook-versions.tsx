"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailSection, EmptyState } from "./primitives";
import type { ActionResult } from "@/lib/cinc/action";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to delete cookbooks in this organization.";
  return error;
}

/**
 * Cookbook versions with delete controls: each version can be removed, or the
 * whole cookbook (all versions) at once. Both deletes go through a warning
 * dialog since they're irreversible. Deleting the last remaining version (or
 * the whole cookbook) returns to the list, where the cookbook no longer exists.
 */
export function CookbookVersions({
  org,
  name,
  versions,
  onDeleteVersion,
  onDeleteCookbook,
}: {
  org: string;
  name: string;
  versions: string[];
  onDeleteVersion: (version: string) => Promise<ActionResult>;
  onDeleteCookbook: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const sorted = [...versions].sort().reverse();
  const listHref = `/orgs/${org}/cookbooks`;

  function removeVersion(version: string) {
    setConfirmVersion(null);
    setError(null);
    startTransition(async () => {
      const res = await onDeleteVersion(version);
      if ("ok" in res) {
        if (versions.length <= 1) router.push(listHref);
        else router.refresh();
      } else {
        setError(explain(res.error));
      }
    });
  }

  function removeCookbook() {
    setConfirmAll(false);
    setError(null);
    startTransition(async () => {
      const res = await onDeleteCookbook();
      if ("ok" in res) {
        router.push(listHref);
        router.refresh();
      } else {
        setError(explain(res.error));
      }
    });
  }

  return (
    <DetailSection title="Versions">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </span>
          <Button
            variant="danger"
            onClick={() => setConfirmAll(true)}
            disabled={pending || versions.length === 0}
          >
            Delete cookbook
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        {sorted.length === 0 ? (
          <EmptyState>No versions.</EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {sorted.map((v) => (
              <li
                key={v}
                className="flex items-center justify-between px-3 py-1.5"
              >
                <span className="font-mono text-sm text-text">{v}</span>
                <Button
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  disabled={pending}
                  onClick={() => setConfirmVersion(v)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmVersion !== null}
        title={`Delete version ${confirmVersion}?`}
        confirmLabel="Delete version"
        confirmVariant="danger"
        onConfirm={() => confirmVersion && removeVersion(confirmVersion)}
        onCancel={() => setConfirmVersion(null)}
      >
        This permanently removes version{" "}
        <span className="font-mono">{confirmVersion}</span> of{" "}
        <span className="font-mono">{name}</span> from the server. This cannot
        be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAll}
        title={`Delete cookbook ${name}?`}
        confirmLabel={`Delete all ${versions.length} version${versions.length === 1 ? "" : "s"}`}
        confirmVariant="danger"
        onConfirm={removeCookbook}
        onCancel={() => setConfirmAll(false)}
      >
        This permanently deletes{" "}
        <strong>
          all {versions.length} version{versions.length === 1 ? "" : "s"}
        </strong>{" "}
        of <span className="font-mono">{name}</span>. This cannot be undone.
      </ConfirmDialog>
    </DetailSection>
  );
}
