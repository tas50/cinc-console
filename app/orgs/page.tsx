import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@/lib/guard";
import { listUserOrgs } from "@/lib/cinc/orgs";
import { Card } from "@/components/ui/card";
import { UserMenu } from "@/components/user-menu";

export default async function OrgsPage() {
  const user = await currentUser();
  const orgs = await listUserOrgs(user);

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Image
            src="/cinc/logo-icon.png"
            alt="Cinc"
            width={22}
            height={22}
            unoptimized
          />
          <span className="text-text">console</span>
        </div>
        <UserMenu user={user} />
      </header>

      <div className="mx-auto max-w-3xl p-6">
        <h2 className="mb-4 text-sm uppercase tracking-wide text-muted">
          Your organizations
        </h2>

        {orgs.length === 0 ? (
          <p className="text-muted">
            You don&apos;t belong to any organizations.
          </p>
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
      </div>
    </main>
  );
}
