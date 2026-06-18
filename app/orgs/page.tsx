import Link from "next/link";
import { currentUser } from "@/lib/guard";
import { listUserOrgs } from "@/lib/cinc/orgs";
import { Card } from "@/components/ui/card";
import { UserMenu } from "@/components/user-menu";

export default async function OrgsPage() {
  const user = await currentUser();
  const orgs = await listUserOrgs(user);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          <span className="text-primary">cinc</span> console
        </h1>
        <UserMenu user={user} />
      </header>

      <h2 className="mb-4 text-sm uppercase tracking-wide text-muted">
        Your organizations
      </h2>

      {orgs.length === 0 ? (
        <p className="text-muted">You don&apos;t belong to any organizations.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {orgs.map((o) => (
            <Link key={o.name} href={`/orgs/${o.name}`}>
              <Card className="transition-colors hover:border-primary">
                <div className="font-medium">{o.full_name ?? o.name}</div>
                <div className="text-sm text-muted">{o.name}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
