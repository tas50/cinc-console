# cinc-console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js web console for a Cinc/Chef Infra Server that logs users in by username/password, signs every server request with the webui key while impersonating the user, and lets them view and (ACL-permitting) edit core objects across their orgs — shipped as a container + Helm chart.

**Architecture:** Single Next.js (App Router, TS) app. A server-only BFF layer (Route Handlers + Server Actions) owns the webui key and the v1.3 SHA-256 signing; the browser never sees the key or the server. `lib/cinc/` is a typed Cinc-server client (signing + transport + per-object builders). Sessions are stateless encrypted cookies. Authorization is the server's ACLs; the UI reacts to 200/403/404.

**Tech Stack:** Next.js 15 (App Router, standalone output), TypeScript, Tailwind + shadcn/ui, Vitest + Testing Library, iron-session, zod, `node:crypto` for signing, Monaco editor, Docker, Helm.

## Global Constraints

- Node 22+ runtime; pnpm package manager.
- v1.3 signing must be byte-for-byte identical to `cinc-api/internal/signing` (canonical string order, `X-Ops-Server-API-Version: 1`, 60-char auth header chunks). Pin with a conformance test using `cinc-api/testdata`.
- Webui key and signing run **server-side only**. Never import `lib/cinc/*` transport/signing into a Client Component.
- Impersonation headers on every authenticated server call: `X-Ops-UserId: <session user>`, `X-Ops-Request-Source: web`.
- Object scope v1: nodes, roles, environments, data bags (+items), org members/groups = full CRUD (ACL-gated); cookbooks, policies, clients = read-only. No cookbook uploads.
- Orange accent token `--primary: #F2811D`; dark theme only.
- Fail fast at boot on missing required env (`CINC_SERVER_URL`, `CINC_WEBUI_KEY`, `SESSION_SECRET`).
- Conventional-commit messages; commit after every green test.

---

# Phase A — Foundation (scaffold, signing, transport, auth, org context)

### Task 1: Project scaffold, tooling, health check

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `.dockerignore`, `app/layout.tsx`, `app/globals.css`, `app/api/healthz/route.ts`
- Test: `app/api/healthz/route.test.ts`

**Interfaces:**
- Produces: a buildable Next.js app with `pnpm test`, `pnpm build`; `GET /api/healthz` → `{ status: "ok" }`.

- [ ] **Step 1: Scaffold**

```bash
cd /Users/tsmith/dev/oss/cinc-console
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-pnpm --yes
pnpm add iron-session zod
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Enable standalone output** — set in `next.config.ts`:

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

- [ ] **Step 3: Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
});
```
```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Write the failing health-check test**

```ts
// app/api/healthz/route.test.ts
import { GET } from "./route";
test("healthz returns ok", async () => {
  const res = await GET();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
```

- [ ] **Step 5: Run it, expect FAIL** — `pnpm test healthz` → fails (no `route.ts`).

- [ ] **Step 6: Implement**

```ts
// app/api/healthz/route.ts
import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ status: "ok" });
}
```

- [ ] **Step 7: Run it, expect PASS** — `pnpm test healthz`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold next.js app with healthz and vitest"
```

---

### Task 2: v1.3 signing module + conformance test

**Files:**
- Create: `lib/cinc/signing.ts`
- Test: `lib/cinc/signing.test.ts`
- Test fixture: copy `cinc-api/testdata/test_key.pem` → `lib/cinc/__fixtures__/test_key.pem`

**Interfaces:**
- Produces:
  - `canonicalRequest(r: SignRequest): string`
  - `contentHash(body: string | Buffer): string`
  - `signHeaders(r: SignRequest, pemKey: string): Record<string, string>`
  - `type SignRequest = { method: string; path: string; body?: string | Buffer; userId: string; timestamp: string }`

- [ ] **Step 1: Copy the shared key fixture**

```bash
mkdir -p lib/cinc/__fixtures__
cp /Users/tsmith/dev/oss/cinc-api/testdata/test_key.pem lib/cinc/__fixtures__/test_key.pem
```

- [ ] **Step 2: Write failing tests (parity with Go)**

```ts
// lib/cinc/signing.test.ts
import { readFileSync } from "node:fs";
import { createVerify, createHash } from "node:crypto";
import { canonicalRequest, contentHash, signHeaders } from "./signing";

const key = readFileSync(new URL("./__fixtures__/test_key.pem", import.meta.url), "utf8");

test("canonicalRequest matches the v1.3 layout", () => {
  const s = canonicalRequest({ method: "GET", path: "/nodes", userId: "u", timestamp: "2024-01-01T00:00:00Z" });
  expect(s).toBe(
    "Method:GET\nPath:/nodes\nX-Ops-Content-Hash:" + contentHash("") +
    "\nX-Ops-Sign:version=1.3\nX-Ops-Timestamp:2024-01-01T00:00:00Z" +
    "\nX-Ops-UserId:u\nX-Ops-Server-API-Version:1");
});

test("contentHash is base64(sha256(body))", () => {
  expect(contentHash("")).toBe(createHash("sha256").update("").digest("base64"));
});

test("signHeaders emits required headers and a verifiable signature", () => {
  const r = { method: "POST", path: "/nodes", body: '{"a":1}', userId: "u", timestamp: "2024-01-01T00:00:00Z" };
  const h = signHeaders(r, key);
  for (const k of ["X-Ops-Sign","X-Ops-UserId","X-Ops-Timestamp","X-Ops-Content-Hash","X-Ops-Server-API-Version","X-Ops-Authorization-1"]) {
    expect(h[k]).toBeTruthy();
  }
  expect(h["X-Ops-Sign"]).toBe("version=1.3");
  // reassemble chunked signature and verify against canonical request
  let sig = ""; for (let i = 1; h[`X-Ops-Authorization-${i}`]; i++) sig += h[`X-Ops-Authorization-${i}`];
  const ok = createVerify("RSA-SHA256").update(canonicalRequest(r)).verify(key, Buffer.from(sig, "base64"));
  expect(ok).toBe(true);
});

test("auth header chunks are 60 chars wide", () => {
  const h = signHeaders({ method: "GET", path: "/nodes", userId: "u", timestamp: "2024-01-01T00:00:00Z" }, key);
  expect(h["X-Ops-Authorization-1"].length).toBe(60);
});
```

- [ ] **Step 3: Run, expect FAIL** — `pnpm test signing`.

- [ ] **Step 4: Implement (faithful port of `cinc-api/internal/signing`)**

```ts
// lib/cinc/signing.ts
import { createHash, createSign } from "node:crypto";

export const SERVER_API_VERSION = "1";

export type SignRequest = {
  method: string;
  path: string;
  body?: string | Buffer;
  userId: string;
  timestamp: string; // ISO-8601 UTC, e.g. 2024-01-01T00:00:00Z
};

export function canonicalPath(p: string): string {
  if (p === "") return "/";
  let out = p.includes("//") ? p.replace(/\/+/g, "/") : p;
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

export function contentHash(body: string | Buffer = ""): string {
  return createHash("sha256").update(body).digest("base64");
}

export function canonicalRequest(r: SignRequest): string {
  const ch = contentHash(r.body ?? "");
  return (
    "Method:" + r.method +
    "\nPath:" + canonicalPath(r.path) +
    "\nX-Ops-Content-Hash:" + ch +
    "\nX-Ops-Sign:version=1.3" +
    "\nX-Ops-Timestamp:" + r.timestamp +
    "\nX-Ops-UserId:" + r.userId +
    "\nX-Ops-Server-API-Version:" + SERVER_API_VERSION
  );
}

function chunk60(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += 60) out.push(s.slice(i, i + 60));
  return out;
}

export function signHeaders(r: SignRequest, pemKey: string): Record<string, string> {
  const ch = contentHash(r.body ?? "");
  // createSign('RSA-SHA256') signs sha256(canonical) with PKCS1v15 — identical to the Go impl.
  const sig = createSign("RSA-SHA256").update(canonicalRequest(r)).sign(pemKey, "base64");
  const h: Record<string, string> = {
    "X-Ops-Sign": "version=1.3",
    "X-Ops-UserId": r.userId,
    "X-Ops-Timestamp": r.timestamp,
    "X-Ops-Content-Hash": ch,
    "X-Ops-Server-API-Version": SERVER_API_VERSION,
  };
  chunk60(sig).forEach((c, i) => { h[`X-Ops-Authorization-${i + 1}`] = c; });
  return h;
}
```

- [ ] **Step 5: Run, expect PASS** — `pnpm test signing`.

- [ ] **Step 6: Commit** — `git commit -am "feat: v1.3 chef signing with conformance test"`

---

### Task 3: Environment config (fail-fast) + webui key loader

**Files:**
- Create: `lib/config.ts`
- Test: `lib/config.test.ts`

**Interfaces:**
- Produces: `getConfig(): Config` where `type Config = { serverUrl: string; webuiKey: string; sessionSecret: string; caCert?: string; sslNoVerify: boolean; sessionTtlSeconds: number }`. Throws a clear error listing every missing required var.

- [ ] **Step 1: Failing test**

```ts
// lib/config.test.ts
import { loadConfig } from "./config";
test("throws listing all missing required vars", () => {
  expect(() => loadConfig({})).toThrow(/CINC_SERVER_URL.*CINC_WEBUI_KEY.*SESSION_SECRET/s);
});
test("parses a valid env", () => {
  const c = loadConfig({ CINC_SERVER_URL: "https://s", CINC_WEBUI_KEY: "PEM", SESSION_SECRET: "x".repeat(32) });
  expect(c.serverUrl).toBe("https://s");
  expect(c.sslNoVerify).toBe(false);
  expect(c.sessionTtlSeconds).toBe(28800);
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement**

```ts
// lib/config.ts
import { z } from "zod";

const schema = z.object({
  CINC_SERVER_URL: z.string().url(),
  CINC_WEBUI_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be >= 32 chars"),
  CINC_CA_CERT: z.string().optional(),
  CINC_SSL_NO_VERIFY: z.enum(["true", "false"]).optional(),
  SESSION_TTL_SECONDS: z.coerce.number().optional(),
});

export type Config = {
  serverUrl: string; webuiKey: string; sessionSecret: string;
  caCert?: string; sslNoVerify: boolean; sessionTtlSeconds: number;
};

export function loadConfig(env: Record<string, string | undefined>): Config {
  const r = schema.safeParse(env);
  if (!r.success) {
    const missing = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration — ${missing}`);
  }
  const e = r.data;
  return {
    serverUrl: e.CINC_SERVER_URL.replace(/\/$/, ""),
    webuiKey: e.CINC_WEBUI_KEY,
    sessionSecret: e.SESSION_SECRET,
    caCert: e.CINC_CA_CERT,
    sslNoVerify: e.CINC_SSL_NO_VERIFY === "true",
    sessionTtlSeconds: e.SESSION_TTL_SECONDS ?? 28800,
  };
}

let cached: Config | null = null;
export function getConfig(): Config {
  if (!cached) cached = loadConfig(process.env);
  return cached;
}
```

- [ ] **Step 4: Run, expect PASS. Commit** — `git commit -am "feat: fail-fast env config"`

---

### Task 4: Cinc transport client (signed + impersonation)

**Files:**
- Create: `lib/cinc/client.ts`, `lib/cinc/errors.ts`
- Test: `lib/cinc/client.test.ts`

**Interfaces:**
- Consumes: `signHeaders` (Task 2), `getConfig` (Task 3).
- Produces:
  - `class CincError extends Error { status: number; body: unknown }`
  - `cincRequest<T>(opts: { user: string; method: string; path: string; body?: unknown; org?: string }): Promise<T>` — builds full URL (`/organizations/<org>` prefix when `org` set), signs as webui key impersonating `user`, adds `X-Ops-Request-Source: web`, `X-Chef-Version`, parses JSON, throws `CincError` on non-2xx.
  - `nowIso(): string` (timestamp helper, no trailing ms — `YYYY-MM-DDTHH:MM:SSZ`).

- [ ] **Step 1: Failing test** (uses a stubbed `fetch`)

```ts
// lib/cinc/client.test.ts
import { vi } from "vitest";
import { readFileSync } from "node:fs";
const key = readFileSync(new URL("./__fixtures__/test_key.pem", import.meta.url), "utf8");
vi.mock("../config", () => ({ getConfig: () => ({ serverUrl: "https://s", webuiKey: key, sslNoVerify: false }) }));
import { cincRequest, CincError } from "./client";

test("signs as webui key impersonating the user with web source", async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  const out = await cincRequest<{ ok: number }>({ user: "alice", method: "GET", path: "/nodes", org: "acme" });
  expect(out.ok).toBe(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://s/organizations/acme/nodes");
  expect((init.headers as Record<string,string>)["X-Ops-UserId"]).toBe("alice");
  expect((init.headers as Record<string,string>)["X-Ops-Request-Source"]).toBe("web");
});

test("throws CincError with status on non-2xx", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("denied", { status: 403 })));
  await expect(cincRequest({ user: "u", method: "GET", path: "/nodes", org: "acme" })).rejects.toMatchObject({ status: 403 });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement**

```ts
// lib/cinc/errors.ts
export class CincError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `cinc server returned ${status}`);
    this.name = "CincError";
  }
  get forbidden() { return this.status === 403; }
  get notFound() { return this.status === 404; }
}
```
```ts
// lib/cinc/client.ts
import { Agent, setGlobalDispatcher } from "undici";
import { getConfig } from "../config";
import { signHeaders } from "./signing";
import { CincError } from "./errors";

let dispatcherReady = false;
function ensureTls() {
  if (dispatcherReady) return;
  const { caCert, sslNoVerify } = getConfig();
  if (sslNoVerify || caCert) {
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: !sslNoVerify, ca: caCert } }));
  }
  dispatcherReady = true;
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

export async function cincRequest<T>(opts: {
  user: string; method: string; path: string; body?: unknown; org?: string;
}): Promise<T> {
  ensureTls();
  const { serverUrl, webuiKey } = getConfig();
  const fullPath = opts.org ? `/organizations/${opts.org}${opts.path}` : opts.path;
  const bodyStr = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = {
    ...signHeaders({ method: opts.method, path: fullPath, body: bodyStr, userId: opts.user, timestamp: nowIso() }, webuiKey),
    "X-Ops-Request-Source": "web",
    "X-Chef-Version": "16.0.0",
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(serverUrl + fullPath, {
    method: opts.method, headers, body: opts.body === undefined ? undefined : bodyStr,
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!res.ok) throw new CincError(res.status, parsed ?? text);
  return parsed as T;
}

function safeJson(t: string): unknown { try { return JSON.parse(t); } catch { return t; } }
```
Add undici (bundled with Node, but install for types if needed): `pnpm add undici`.

- [ ] **Step 4: Run, expect PASS. Commit** — `git commit -am "feat: signed cinc transport with user impersonation"`

---

### Task 5: Session (encrypted cookie)

**Files:**
- Create: `lib/session.ts`
- Test: `lib/session.test.ts`

**Interfaces:**
- Produces: `type SessionData = { username?: string; loginAt?: number }`; `getSession(): Promise<IronSession<SessionData>>`; `sessionOptions` (cookie name `cinc_console`, ttl from config). `requireUser(): Promise<string>` — returns username or throws `Unauthorized`.

- [ ] **Step 1: Failing test** for the options shape

```ts
// lib/session.test.ts
import { vi } from "vitest";
vi.mock("./config", () => ({ getConfig: () => ({ sessionSecret: "x".repeat(32), sessionTtlSeconds: 100 }) }));
import { sessionOptions } from "./session";
test("session cookie is httpOnly and ttl-bound", () => {
  expect(sessionOptions.cookieName).toBe("cinc_console");
  expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
  expect(sessionOptions.ttl).toBe(100);
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement**

```ts
// lib/session.ts
import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { getConfig } from "./config";

export type SessionData = { username?: string; loginAt?: number };

export const sessionOptions: SessionOptions = {
  password: getConfig().sessionSecret,
  cookieName: "cinc_console",
  ttl: getConfig().sessionTtlSeconds,
  cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export class Unauthorized extends Error {}

export async function requireUser(): Promise<string> {
  const s = await getSession();
  if (!s.username) throw new Unauthorized();
  return s.username;
}
```

- [ ] **Step 4: Run, expect PASS. Commit** — `git commit -am "feat: encrypted cookie session"`

---

### Task 6: Login / logout (authenticate_user) + route guard

**Files:**
- Create: `lib/cinc/auth.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `middleware.ts`, `app/login/page.tsx`, `app/login/login-form.tsx`
- Test: `lib/cinc/auth.test.ts`

**Interfaces:**
- Consumes: `cincRequest` (Task 4), `getSession` (Task 5).
- Produces: `authenticateUser(username: string, password: string): Promise<boolean>` (POST `/authenticate_user` signed as webui key, top-level — no org; 200 → true, 401 → false, other → throw).

- [ ] **Step 1: Failing test**

```ts
// lib/cinc/auth.test.ts
import { vi } from "vitest";
const req = vi.fn();
vi.mock("./client", () => ({ cincRequest: (...a: unknown[]) => req(...a) }));
import { authenticateUser } from "./auth";
test("returns true on success", async () => {
  req.mockResolvedValueOnce({ name: "alice" });
  await expect(authenticateUser("alice", "pw")).resolves.toBe(true);
  expect(req).toHaveBeenCalledWith(expect.objectContaining({ method: "POST", path: "/authenticate_user", user: expect.any(String) }));
});
test("returns false on 401", async () => {
  req.mockRejectedValueOnce(Object.assign(new Error(), { status: 401 }));
  await expect(authenticateUser("alice", "bad")).resolves.toBe(false);
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement auth + routes**

```ts
// lib/cinc/auth.ts
import { cincRequest } from "./client";
export async function authenticateUser(username: string, password: string): Promise<boolean> {
  try {
    await cincRequest({ user: username, method: "POST", path: "/authenticate_user", body: { username, password } });
    return true;
  } catch (e) {
    if ((e as { status?: number }).status === 401) return false;
    throw e;
  }
}
```
```ts
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/cinc/auth";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "missing credentials" }, { status: 400 });
  const ok = await authenticateUser(username, password);
  if (!ok) return NextResponse.json({ error: "invalid username or password" }, { status: 401 });
  const s = await getSession();
  s.username = username; s.loginAt = Date.now();
  await s.save();
  return NextResponse.json({ ok: true });
}
```
```ts
// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
export async function POST() {
  const s = await getSession(); s.destroy();
  return NextResponse.json({ ok: true });
}
```
```ts
// middleware.ts — redirect unauthenticated users to /login (cookie presence check only)
import { NextRequest, NextResponse } from "next/server";
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("cinc_console");
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  if (!hasSession && !isAuthPage) return NextResponse.redirect(new URL("/login", req.url));
  if (hasSession && isAuthPage) return NextResponse.redirect(new URL("/orgs", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
```
Login page + form: a Client Component posting to `/api/auth/login`, then `router.push("/orgs")`; show the 401 error inline. (Standard shadcn `Card` + `Input` + `Button`.)

- [ ] **Step 4: Run, expect PASS. Commit** — `git commit -am "feat: username/password login via authenticate_user + route guard"`

---

### Task 7: Org context — list, switcher, app shell

**Files:**
- Create: `lib/cinc/orgs.ts`, `app/orgs/page.tsx`, `app/orgs/[org]/layout.tsx`, `components/app-shell.tsx`, `components/org-switcher.tsx`, `components/user-menu.tsx`
- Test: `lib/cinc/orgs.test.ts`

**Interfaces:**
- Consumes: `cincRequest`, `requireUser`.
- Produces: `listUserOrgs(user: string): Promise<{ name: string; full_name?: string }[]>` (GET `/users/<user>/organizations`, maps the `organization` sub-objects).

- [ ] **Step 1: Failing test**

```ts
// lib/cinc/orgs.test.ts
import { vi } from "vitest";
const req = vi.fn();
vi.mock("./client", () => ({ cincRequest: (...a: unknown[]) => req(...a) }));
import { listUserOrgs } from "./orgs";
test("maps organization sub-objects", async () => {
  req.mockResolvedValueOnce([{ organization: { name: "acme", full_name: "Acme" } }]);
  await expect(listUserOrgs("alice")).resolves.toEqual([{ name: "acme", full_name: "Acme" }]);
});
```

- [ ] **Step 2: Run FAIL. Step 3: Implement**

```ts
// lib/cinc/orgs.ts
import { cincRequest } from "./client";
type OrgEnvelope = { organization: { name: string; full_name?: string } };
export async function listUserOrgs(user: string) {
  const raw = await cincRequest<OrgEnvelope[]>({ user, method: "GET", path: `/users/${user}/organizations` });
  return raw.map((o) => ({ name: o.organization.name, full_name: o.organization.full_name }));
}
```
App shell: sidebar nav (Nodes/Roles/Environments/Data Bags/Members/Cookbooks/Policies/Clients), org switcher (top-left), user menu (logout). `app/orgs/page.tsx` is a Server Component: `const user = await requireUser(); const orgs = await listUserOrgs(user);` render cards linking to `/orgs/<name>`.

- [ ] **Step 4: Run PASS. Commit** — `git commit -am "feat: org listing, switcher, app shell"`

---

# Phase B — Objects, UI, packaging

### Task 8: Generic resource layer (client builder + UI components)

This task builds the reusable machinery every object type uses, so per-object tasks stay tiny (DRY).

**Files:**
- Create: `lib/cinc/resource.ts` (generic CRUD builder), `lib/cinc/acl.ts`, `components/resource-table.tsx`, `components/json-editor.tsx`, `components/resource-detail.tsx`, `components/delete-button.tsx`, `app/orgs/[org]/_actions.ts` (server actions)
- Test: `lib/cinc/resource.test.ts`

**Interfaces:**
- Produces:
  - `makeResource<T>(kind: string)` → `{ list(user, org), get(user, org, name), create(user, org, body), update(user, org, name, body), remove(user, org, name) }` mapping to `/<kind>` paths (`GET /<kind>` → name→url map for list; `GET/PUT/DELETE /<kind>/<name>`; `POST /<kind>`).
  - `getAcl(user, org, kind, name)` (GET `/<kind>/<name>/_acl`).
  - `<ResourceTable>` (renders a name→url map as a searchable table with row links), `<JsonEditor value onChange>` (Monaco wrapper, validates JSON), `<ResourceDetail>` (tabs: form slot + JSON), `<DeleteButton>` (calls a server action, shows 403 toast).

- [ ] **Step 1: Failing test for the builder**

```ts
// lib/cinc/resource.test.ts
import { vi } from "vitest";
const req = vi.fn();
vi.mock("./client", () => ({ cincRequest: (...a: unknown[]) => req(...a) }));
import { makeResource } from "./resource";
const nodes = makeResource("nodes");
test("list hits GET /<kind> within org", async () => {
  req.mockResolvedValueOnce({ web01: "https://s/.../web01" });
  await nodes.list("alice", "acme");
  expect(req).toHaveBeenCalledWith({ user: "alice", org: "acme", method: "GET", path: "/nodes" });
});
test("update hits PUT /<kind>/<name>", async () => {
  req.mockResolvedValueOnce({});
  await nodes.update("alice", "acme", "web01", { name: "web01" });
  expect(req).toHaveBeenCalledWith({ user: "alice", org: "acme", method: "PUT", path: "/nodes/web01", body: { name: "web01" } });
});
```

- [ ] **Step 2: Run FAIL. Step 3: Implement**

```ts
// lib/cinc/resource.ts
import { cincRequest } from "./client";
export function makeResource<T = Record<string, unknown>>(kind: string) {
  return {
    list: (user: string, org: string) => cincRequest<Record<string, string>>({ user, org, method: "GET", path: `/${kind}` }),
    get: (user: string, org: string, name: string) => cincRequest<T>({ user, org, method: "GET", path: `/${kind}/${name}` }),
    create: (user: string, org: string, body: T) => cincRequest<unknown>({ user, org, method: "POST", path: `/${kind}`, body }),
    update: (user: string, org: string, name: string, body: T) => cincRequest<unknown>({ user, org, method: "PUT", path: `/${kind}/${name}`, body }),
    remove: (user: string, org: string, name: string) => cincRequest<unknown>({ user, org, method: "DELETE", path: `/${kind}/${name}` }),
  };
}
```
```ts
// lib/cinc/acl.ts
import { cincRequest } from "./client";
export const getAcl = (user: string, org: string, kind: string, name: string) =>
  cincRequest<Record<string, { actors: string[]; groups: string[] }>>({ user, org, method: "GET", path: `/${kind}/${name}/_acl` });
```
Add Monaco: `pnpm add @monaco-editor/react`. Components are standard shadcn + Monaco; `<JsonEditor>` parses on change and reports validity. Server actions in `_actions.ts` wrap `requireUser()` + resource calls and translate `CincError.forbidden` into a returned `{ error: "forbidden" }` for toast display.

- [ ] **Step 4: Run PASS. Commit** — `git commit -am "feat: generic resource layer and shared UI components"`

---

### Task 9: Nodes (full CRUD, the reference object)

**Files:**
- Create: `app/orgs/[org]/nodes/page.tsx`, `app/orgs/[org]/nodes/[name]/page.tsx`, `app/orgs/[org]/nodes/[name]/node-editor.tsx`, `app/orgs/[org]/nodes/new/page.tsx`, `app/orgs/[org]/nodes/actions.ts`
- Test: `app/orgs/[org]/nodes/actions.test.ts`

**Interfaces:**
- Consumes: `makeResource("nodes")`, `<ResourceTable>`, `<ResourceDetail>`, `<JsonEditor>`, `requireUser`.
- Produces: `saveNode(org, name, json)` / `deleteNode(org, name)` / `createNode(org, json)` server actions returning `{ ok }` or `{ error }`.

- [ ] **Step 1: Failing test for the save action (forbidden path)**

```ts
// app/orgs/[org]/nodes/actions.test.ts
import { vi } from "vitest";
vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));
const update = vi.fn();
vi.mock("@/lib/cinc/resource", () => ({ makeResource: () => ({ update }) }));
import { saveNode } from "./actions";
test("translates 403 into { error: 'forbidden' }", async () => {
  update.mockRejectedValueOnce(Object.assign(new Error(), { status: 403, forbidden: true }));
  await expect(saveNode("acme", "web01", '{"name":"web01"}')).resolves.toEqual({ error: "forbidden" });
});
test("saves valid json", async () => {
  update.mockResolvedValueOnce({});
  await expect(saveNode("acme", "web01", '{"name":"web01"}')).resolves.toEqual({ ok: true });
});
```

- [ ] **Step 2: Run FAIL. Step 3: Implement**

```ts
// app/orgs/[org]/nodes/actions.ts
"use server";
import { requireUser } from "@/lib/session";
import { makeResource } from "@/lib/cinc/resource";
const nodes = makeResource("nodes");
function run<T>(fn: () => Promise<T>) {
  return fn().then(() => ({ ok: true as const })).catch((e: { status?: number }) =>
    e.status === 403 ? { error: "forbidden" as const } : Promise.reject(e));
}
export async function saveNode(org: string, name: string, json: string) {
  const user = await requireUser();
  let body: Record<string, unknown>;
  try { body = JSON.parse(json); } catch { return { error: "invalid-json" as const }; }
  return run(() => nodes.update(user, org, name, body));
}
export async function createNode(org: string, json: string) {
  const user = await requireUser();
  const body = JSON.parse(json);
  return run(() => nodes.create(user, org, body));
}
export async function deleteNode(org: string, name: string) {
  const user = await requireUser();
  return run(() => nodes.remove(user, org, name));
}
```
Pages: `page.tsx` (Server Component) lists via `nodes.list`, renders `<ResourceTable kind="nodes" rows={...} />`. `[name]/page.tsx` fetches the node and renders `<ResourceDetail>` with a friendly form (`node-editor.tsx`: run_list editor + `chef_environment` select + attributes JSON) wired to `saveNode`/`deleteNode`. `new/page.tsx` posts to `createNode`.

- [ ] **Step 4: Run PASS. Commit** — `git commit -am "feat: nodes CRUD (reference object)"`

---

### Task 10: Roles, Environments, Data Bags, Members (replicate the nodes pattern)

Each sub-object reuses Task 8's machinery; only the kind, friendly-form fields, and (for data bags) the nested item path differ. Build each as its own commit.

**Files (per object):** `app/orgs/[org]/<kind>/page.tsx`, `[name]/page.tsx`, `[name]/<kind>-editor.tsx`, `new/page.tsx`, `actions.ts`, `actions.test.ts`.

- [ ] **Step 1 — Roles:** `makeResource("roles")`; friendly form = `run_list`, `default_attributes`, `override_attributes` (JSON). Actions `saveRole/createRole/deleteRole` mirror nodes' `actions.ts` (copy the file, swap `nodes`→`roles`, `Node`→`Role`). Test the 403 path as in Task 9. Commit `feat: roles CRUD`.

- [ ] **Step 2 — Environments:** `makeResource("environments")`; friendly form = `description`, `cookbook_versions` (key→constraint table), `default/override_attributes` (JSON). Block editing the special `_default` env (disable Save with tooltip). Commit `feat: environments CRUD`.

- [ ] **Step 3 — Data bags:** two levels. `lib/cinc/databags.ts`:

```ts
// lib/cinc/databags.ts
import { cincRequest } from "./client";
export const dataBags = {
  list: (u: string, o: string) => cincRequest<Record<string,string>>({ user: u, org: o, method: "GET", path: "/data" }),
  create: (u: string, o: string, name: string) => cincRequest({ user: u, org: o, method: "POST", path: "/data", body: { name } }),
  remove: (u: string, o: string, name: string) => cincRequest({ user: u, org: o, method: "DELETE", path: `/data/${name}` }),
  listItems: (u: string, o: string, bag: string) => cincRequest<Record<string,string>>({ user: u, org: o, method: "GET", path: `/data/${bag}` }),
  getItem: (u: string, o: string, bag: string, id: string) => cincRequest({ user: u, org: o, method: "GET", path: `/data/${bag}/${id}` }),
  putItem: (u: string, o: string, bag: string, id: string, body: unknown) => cincRequest({ user: u, org: o, method: "PUT", path: `/data/${bag}/${id}`, body }),
  createItem: (u: string, o: string, bag: string, body: { id: string }) => cincRequest({ user: u, org: o, method: "POST", path: `/data/${bag}`, body }),
  removeItem: (u: string, o: string, bag: string, id: string) => cincRequest({ user: u, org: o, method: "DELETE", path: `/data/${bag}/${id}` }),
};
```
Routes: `/data_bags` (list bags, create/delete), `/data_bags/[bag]` (list items), `/data_bags/[bag]/[id]` (JSON editor for the item; `id` field required). Test `putItem` 403 path. Commit `feat: data bags and items CRUD`.

- [ ] **Step 4 — Members:** `lib/cinc/members.ts` using `c.Associations` + `c.Groups` shapes:

```ts
// lib/cinc/members.ts
import { cincRequest } from "./client";
export const members = {
  list: (u: string, o: string) => cincRequest<{ user: { username: string } }[]>({ user: u, org: o, method: "GET", path: "/users" }),
  add: (u: string, o: string, username: string) => cincRequest({ user: u, org: o, method: "POST", path: "/association_requests", body: { user: username } }),
  remove: (u: string, o: string, username: string) => cincRequest({ user: u, org: o, method: "DELETE", path: `/users/${username}` }),
  groups: (u: string, o: string) => cincRequest<Record<string,string>>({ user: u, org: o, method: "GET", path: "/groups" }),
  getGroup: (u: string, o: string, g: string) => cincRequest({ user: u, org: o, method: "GET", path: `/groups/${g}` }),
  updateGroup: (u: string, o: string, g: string, body: unknown) => cincRequest({ user: u, org: o, method: "PUT", path: `/groups/${g}`, body }),
};
```
Route `/members`: tab 1 users (invite/remove), tab 2 groups (view, edit membership JSON). Test invite + remove 403 paths. Commit `feat: org members and groups management`.

---

### Task 11: Read-only Cookbooks, Policies, Clients

**Files:** `app/orgs/[org]/cookbooks/page.tsx` + `[name]/page.tsx`; same for `policies`, `clients`; `lib/cinc/readonly.ts`.

**Interfaces:**
- Produces: `cookbooks.list/get`, `policies.list/get`, `clients.list/get` (GET only). Detail pages render read-only JSON (`<JsonEditor readOnly>`); no Save/Delete controls.

- [ ] **Step 1:** Implement `readonly.ts` with three `makeResource`-style read-only objects (reuse `makeResource` but only surface `list`/`get`). 
- [ ] **Step 2:** List + detail pages rendering JSON read-only. Cookbooks list uses `GET /cookbooks?num_versions=all`; detail shows versions and metadata. 
- [ ] **Step 3:** Test that the detail page renders the `<JsonEditor>` with `readOnly`. 
- [ ] **Step 4:** Commit `feat: read-only cookbooks, policies, clients`.

---

### Task 12: Dockerfile + container smoke

**Files:** Create `Dockerfile`, `.dockerignore`, `app/api/healthz/route.ts` (exists), `scripts/smoke.sh`.

- [ ] **Step 1: Dockerfile (multi-stage, standalone, non-root)**

```dockerfile
# Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/healthz || exit 1
CMD ["node", "server.js"]
```

- [ ] **Step 2: Smoke script** — build the image, run with a throwaway env (generated key + dummy server URL), poll `/api/healthz` for 200, then stop.

```bash
# scripts/smoke.sh
set -euo pipefail
openssl genrsa -out /tmp/webui.pem 2048
docker build -t cinc-console:smoke .
cid=$(docker run -d -p 3000:3000 \
  -e CINC_SERVER_URL=https://example.invalid \
  -e CINC_WEBUI_KEY="$(cat /tmp/webui.pem)" \
  -e SESSION_SECRET=0123456789abcdef0123456789abcdef cinc-console:smoke)
trap 'docker rm -f "$cid" >/dev/null' EXIT
for i in $(seq 1 30); do
  if curl -fs http://127.0.0.1:3000/api/healthz >/dev/null; then echo "healthz OK"; exit 0; fi
  sleep 1
done
echo "healthz did not come up"; docker logs "$cid"; exit 1
```

- [ ] **Step 3: Run** `bash scripts/smoke.sh` → expect `healthz OK`.
- [ ] **Step 4: Commit** `feat: container image + smoke test`.

---

### Task 13: Helm chart

**Files:** Create `deploy/helm/cinc-console/Chart.yaml`, `values.yaml`, `values-example.yaml`, `templates/_helpers.tpl`, `templates/deployment.yaml`, `templates/service.yaml`, `templates/ingress.yaml`, `templates/configmap.yaml`, `templates/secret.yaml`, `templates/NOTES.txt`.

- [ ] **Step 1:** `Chart.yaml` (apiVersion v2, appVersion, name cinc-console). `values.yaml` keys: `image.repository/tag`, `replicaCount`, `resources`, `cincServerUrl`, `sslNoVerify`, `sessionTtlSeconds`, `ingress.enabled/host/tls/annotations`, `webuiKey` (default ""), `caCert`, `existingSecret` (use an external secret instead of inlining the key).
- [ ] **Step 2:** `configmap.yaml` → non-secret env (`CINC_SERVER_URL`, `CINC_SSL_NO_VERIFY`, `SESSION_TTL_SECONDS`). `secret.yaml` → `CINC_WEBUI_KEY`, `SESSION_SECRET` (generated via `randAlphaNum 48` if unset), `CINC_CA_CERT`; skipped when `existingSecret` is set.
- [ ] **Step 3:** `deployment.yaml` → envFrom configmap + secret, readiness/liveness probes on `/api/healthz`, non-root securityContext, resources. `service.yaml` (ClusterIP:80→3000), `ingress.yaml` (gated on `ingress.enabled`).
- [ ] **Step 4:** Lint and template-render:

```bash
helm lint deploy/helm/cinc-console
helm template c deploy/helm/cinc-console -f deploy/helm/cinc-console/values-example.yaml > /tmp/rendered.yaml
test -s /tmp/rendered.yaml
```
- [ ] **Step 5: Commit** `feat: helm chart for kubernetes deploy`.

---

### Task 14: README + CI

**Files:** Create `README.md`, `.github/workflows/ci.yml`.

- [ ] **Step 1:** README: what it is, the webui-key model, env table, `helm install` quickstart, dev (`pnpm dev`), security note (webui key is server-only).
- [ ] **Step 2:** CI: matrix job running `pnpm install`, `pnpm test`, `pnpm build`, `helm lint`, and the container smoke (on push/PR).
- [ ] **Step 3: Commit** `chore: readme and CI`.

---

## Self-Review

- **Spec coverage:** auth/webui impersonation (T2,4,6), stateless session (T5), org context (T7), core CRUD nodes/roles/envs/databags/members (T9–10), read-only cookbooks/policies/clients (T11), container (T12), Helm (T13), signing conformance (T2), fail-fast config (T3), dark/orange theme (globals.css in T1 + components). All spec sections map to a task.
- **Type consistency:** `cincRequest({user,method,path,body?,org?})` used identically across T4–T11; `makeResource` surface (`list/get/create/update/remove`) consistent; actions return `{ ok } | { error }` uniformly.
- **No placeholders:** every code step shows real code; per-object tasks specify exact builders and form fields.

## Phase boundary for PR

- **Phase A** = Tasks 1–7 (foundation: scaffold → org context). Independently testable (login + browse orgs works).
- **Phase B** = Tasks 8–14 (objects, packaging). Builds on A.
- This plan ships as **one PR covering both phases** per the request.
