import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/cinc/auth";
import { getSession } from "@/lib/session";
import { log } from "@/lib/log";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "missing credentials" }, { status: 400 });
  }

  const authUser = await authenticateUser(username, password);
  if (!authUser) {
    log.warn("login.failed", { user: username });
    return NextResponse.json(
      { error: "invalid username or password" },
      { status: 401 },
    );
  }

  const session = await getSession();
  session.username = username;
  session.displayName = authUser.display_name || username;
  session.loginAt = Date.now();
  await session.save();
  log.info("login.success", { user: username });
  return NextResponse.json({ ok: true });
}
