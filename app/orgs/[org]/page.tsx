import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const SECTIONS = [
  { label: "Nodes", slug: "nodes", note: "Managed systems" },
  { label: "Roles", slug: "roles", note: "Run-lists and attributes" },
  { label: "Environments", slug: "environments", note: "Cookbook constraints" },
  { label: "Data Bags", slug: "data_bags", note: "Shared data items" },
  { label: "Members", slug: "members", note: "Users and groups" },
  { label: "Cookbooks", slug: "cookbooks", note: "Browse cookbooks" },
];

export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div>
      <PageHeader title={org} description="Organization overview" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.slug}
            href={`/orgs/${org}/${s.slug}`}
            className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Card className="h-full transition-colors group-hover:border-primary group-hover:bg-surface-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-text">{s.label}</span>
                <span
                  aria-hidden="true"
                  className="text-muted transition-colors group-hover:text-link"
                >
                  →
                </span>
              </div>
              <div className="mt-1 text-sm text-muted">{s.note}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
