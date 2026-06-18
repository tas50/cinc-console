import Link from "next/link";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  { label: "Nodes", slug: "nodes", note: "Managed systems" },
  { label: "Roles", slug: "roles", note: "Run-lists and attributes" },
  { label: "Environments", slug: "environments", note: "Cookbook constraints" },
  { label: "Data Bags", slug: "data_bags", note: "Shared data items" },
  { label: "Members", slug: "members", note: "Users and groups" },
  { label: "Cookbooks", slug: "cookbooks", note: "Read-only" },
];

export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">{org}</h1>
      <p className="mb-6 text-sm text-muted">Organization overview</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.slug} href={`/orgs/${org}/${s.slug}`}>
            <Card className="transition-colors hover:border-primary">
              <div className="font-medium">{s.label}</div>
              <div className="text-sm text-muted">{s.note}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
