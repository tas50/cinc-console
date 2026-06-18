"use client";

import { useRouter, useParams } from "next/navigation";
import type { Org } from "@/lib/cinc/orgs";

export function OrgSwitcher({ orgs }: { orgs: Org[] }) {
  const router = useRouter();
  const params = useParams<{ org?: string }>();
  const current = params?.org ?? "";

  return (
    <select
      aria-label="Organization"
      value={current}
      onChange={(e) => router.push(`/orgs/${e.target.value}`)}
      className="rounded-md border border-border bg-bg px-2 py-1 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {orgs.map((o) => (
        <option key={o.name} value={o.name}>
          {o.full_name ?? o.name}
        </option>
      ))}
    </select>
  );
}
