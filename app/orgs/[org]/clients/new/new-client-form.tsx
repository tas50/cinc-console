"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CreateClientResult } from "../actions";

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to create clients in this organization.";
  if (error === "already exists")
    return "A client with that name already exists.";
  return error;
}

export function NewClientForm({
  org,
  onCreate,
}: {
  org: string;
  onCreate: (name: string) => Promise<CreateClientResult>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; privateKey: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setError(null);
    startTransition(async () => {
      const res = await onCreate(n);
      if ("ok" in res) setCreated({ name: n, privateKey: res.privateKey });
      else setError(explain(res.error));
    });
  }

  async function copyKey() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the key and copy manually.");
    }
  }

  function downloadKey() {
    if (!created) return;
    const blob = new Blob([created.privateKey], {
      type: "application/x-pem-file",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${created.name}.pem`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (created) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Client <span className="font-mono">{created.name}</span> created
        </h1>

        <div
          role="alert"
          className="rounded-md border border-warn/50 bg-warn/10 p-3 text-sm text-text"
        >
          <strong>Save this private key now.</strong> It is shown only once and
          cannot be retrieved later. Store it where the client (e.g.
          chef-client) can read it.
        </div>

        <textarea
          readOnly
          rows={14}
          value={created.privateKey}
          aria-label={`Private key for ${created.name}`}
          spellCheck={false}
          className="w-full rounded-md border border-border bg-bg p-3 font-mono text-xs text-text"
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={copyKey}>{copied ? "Copied ✓" : "Copy key"}</Button>
          <Button variant="secondary" onClick={downloadKey}>
            Download .pem
          </Button>
          <Link href={`/orgs/${org}/clients`}>
            <Button variant="ghost">Done</Button>
          </Link>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <Link
        href={`/orgs/${org}/clients`}
        className="text-sm text-muted hover:text-text"
      >
        ← back
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">New client</h1>

      <div className="space-y-1">
        <label htmlFor="client-name" className="block text-sm text-muted">
          Name
        </label>
        <Input
          id="client-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
          autoFocus
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "Create client"}
      </Button>
    </form>
  );
}
