"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UserMenu({ name }: { name: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        title="Your profile"
        className="text-sm text-muted hover:text-link"
      >
        {name}
      </Link>
      <Button variant="ghost" onClick={logout} className="text-sm">
        Sign out
      </Button>
    </div>
  );
}
