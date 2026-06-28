"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JsonEditor } from "./json-editor";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { ActionResult } from "@/lib/cinc/action";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to create this in this organization.";
  return error;
}

/**
 * Create form: a name field plus a JSON body. `onCreate` is a server action,
 * which injects the name/id into the created object server-side, so the body
 * is just the skeleton. `initialJson` seeds the editor.
 */
export function NewObjectForm({
  title,
  onCreate,
  backHref,
  initialJson,
}: {
  title: string;
  onCreate: (name: string, json: string) => Promise<ActionResult>;
  backHref: string;
  initialJson: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [json, setJson] = useState(initialJson);
  const [valid, setValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await onCreate(name, json);
      if ("ok" in res) {
        router.push(`${backHref}/${encodeURIComponent(name)}`);
        router.refresh();
      } else {
        setError(explain(res.error));
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link href={backHref} className="text-sm text-muted hover:text-text">
        ← back
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm text-muted">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
          autoFocus
        />
      </div>

      <JsonEditor value={json} onChange={setJson} onValidityChange={setValid} rows={16} />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button onClick={create} disabled={pending || !valid || !name}>
        {pending ? "Creating…" : "Create"}
      </Button>
    </div>
  );
}
