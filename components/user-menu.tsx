"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UserMenu({ user }: { user: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">{user}</span>
      <Button variant="ghost" onClick={logout} className="text-sm">
        Sign out
      </Button>
    </div>
  );
}
