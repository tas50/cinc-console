import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@/lib/guard";
import { getUser } from "@/lib/cinc/users";
import { safeGet, explainRead } from "@/lib/cinc/safe-get";
import { UserMenu } from "@/components/user-menu";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await currentUser();
  const res = await safeGet(() => getUser(user));

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Link
          href="/orgs"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <Image
            src="/cinc/logo-icon.png"
            alt="Cinc"
            width={22}
            height={22}
            priority
            unoptimized
          />
          <span className="text-text">console</span>
        </Link>
        <UserMenu user={user} />
      </header>

      <div className="mx-auto max-w-xl p-6">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          Your profile
        </h1>
        <p className="mb-6 font-mono text-sm text-muted">{user}</p>
        {"error" in res ? (
          <p className="text-sm text-danger">{explainRead(res.error)}</p>
        ) : (
          <ProfileForm initial={res.data} />
        )}
      </div>
    </main>
  );
}
