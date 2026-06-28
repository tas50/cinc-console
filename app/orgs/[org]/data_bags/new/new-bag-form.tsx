"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nameError } from "@/lib/cinc/names";
import type { ActionResult } from "@/lib/cinc/action";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to create this in this organization.";
  return error;
}

/**
 * Minimal create form for a data bag: a name field plus a Create button. The
 * bound `createBag(name)` server action handles the request; on success we
 * navigate into the new (empty) bag.
 */
export function NewBagForm({
  org,
  onCreate,
}: {
  org: string;
  onCreate: (name: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameErr = nameError("data_bag", name);

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await onCreate(name);
      if ("ok" in res) {
        router.push(`/orgs/${org}/data_bags/${encodeURIComponent(name)}`);
        router.refresh();
      } else {
        setError(explain(res.error));
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        href={`/orgs/${org}/data_bags`}
        className="text-sm text-muted hover:text-text"
      >
        ← back
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">New data bag</h1>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm text-muted">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
          autoFocus
          aria-invalid={nameErr ? true : undefined}
          aria-describedby={nameErr ? "name-error" : undefined}
        />
        {nameErr && (
          <p id="name-error" role="alert" className="text-sm text-danger">
            {nameErr}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button onClick={create} disabled={pending || !name.trim() || !!nameErr}>
        {pending ? "Creating…" : "Create"}
      </Button>
    </div>
  );
}
