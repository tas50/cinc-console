"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { JsonEditor } from "./json-editor";
import { DetailSection } from "./details/primitives";
import { DescriptionField } from "./details/description-field";
import { RunListField } from "./details/run-list-field";
import { CookbookConstraintsField } from "./details/cookbook-constraints-field";
import { nameError, type NameKind } from "@/lib/cinc/names";
import type { ActionResult } from "@/lib/cinc/action";

type Kind = "role" | "environment";

/** Per-kind starting body. Deliberately has no `name` — the Name field is the
 * single source of truth and the create action injects it server-side. */
const SKELETONS: Record<Kind, Record<string, unknown>> = {
  role: {
    description: "",
    json_class: "Chef::Role",
    chef_type: "role",
    default_attributes: {},
    override_attributes: {},
    run_list: [],
  },
  environment: {
    description: "",
    json_class: "Chef::Environment",
    chef_type: "environment",
    default_attributes: {},
    override_attributes: {},
    cookbook_versions: {},
  },
};

const TITLES: Record<Kind, string> = {
  role: "New role",
  environment: "New environment",
};

function explain(error: string): string {
  if (error === "forbidden")
    return "You don't have permission to create this in this organization.";
  return error;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

/**
 * Rich create form for roles and environments. Mirrors the edit experience:
 * a single validated Name field plus the same curated section editors used on
 * the detail page (description, run list / cookbook constraints), with a
 * Form ⇄ JSON toggle so attributes — which have no curated editor — are still
 * settable. The whole object is assembled locally and created in one request.
 */
export function CreateObjectForm({
  kind,
  onCreate,
  backHref,
}: {
  kind: Kind;
  onCreate: (name: string, json: string) => Promise<ActionResult>;
  backHref: string;
}) {
  const router = useRouter();
  const nameKind: NameKind = kind;
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown>>(SKELETONS[kind]);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonValid, setJsonValid] = useState(true);
  const [constraintsValid, setConstraintsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameErr = nameError(nameKind, name);
  const formValid = kind === "environment" ? constraintsValid : true;
  const bodyValid = mode === "json" ? jsonValid : formValid;
  const canCreate = !pending && name.trim() !== "" && !nameErr && bodyValid;

  function patch(part: Record<string, unknown>) {
    setDraft((d) => ({ ...d, ...part }));
  }

  function toJson() {
    setJsonText(JSON.stringify(draft, null, 2));
    setJsonValid(true);
    setMode("json");
  }

  function toForm() {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setDraft(parsed as Record<string, unknown>);
      }
    } catch {
      return; // toggle is disabled while invalid, so this is belt-and-suspenders
    }
    setMode("form");
  }

  function create() {
    if (!canCreate) return;
    let body: Record<string, unknown>;
    if (mode === "json") {
      try {
        body = JSON.parse(jsonText);
      } catch {
        return;
      }
    } else {
      body = draft;
    }
    setError(null);
    const trimmed = name.trim();
    startTransition(async () => {
      const res = await onCreate(trimmed, JSON.stringify(body));
      if ("ok" in res) {
        router.push(`${backHref}/${encodeURIComponent(trimmed)}`);
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

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{TITLES[kind]}</h1>
        <Button
          variant="secondary"
          onClick={mode === "json" ? toForm : toJson}
          disabled={pending || (mode === "json" && !jsonValid)}
        >
          {mode === "json" ? "Edit as form" : "Edit as JSON"}
        </Button>
      </div>

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
          aria-invalid={nameErr ? true : undefined}
          aria-describedby={nameErr ? "name-error" : undefined}
        />
        {nameErr && (
          <p id="name-error" role="alert" className="text-sm text-danger">
            {nameErr}
          </p>
        )}
      </div>

      {mode === "json" ? (
        <JsonEditor
          value={jsonText}
          onChange={setJsonText}
          onValidityChange={setJsonValid}
          rows={20}
        />
      ) : (
        <>
          <DetailSection title="Overview">
            <DescriptionField
              value={asString(draft.description)}
              onChange={(v) => patch({ description: v })}
              disabled={pending}
            />
          </DetailSection>

          {kind === "role" ? (
            <DetailSection title="Run list">
              <RunListField
                items={asStringArray(draft.run_list)}
                onChange={(items) => patch({ run_list: items })}
                disabled={pending}
              />
            </DetailSection>
          ) : (
            <DetailSection title="Cookbook version constraints">
              <CookbookConstraintsField
                data={draft}
                onChange={(versions) => patch({ cookbook_versions: versions })}
                onValidityChange={setConstraintsValid}
                disabled={pending}
              />
            </DetailSection>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button onClick={create} disabled={!canCreate}>
        {pending ? "Creating…" : "Create"}
      </Button>
    </div>
  );
}
