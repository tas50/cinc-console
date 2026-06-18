# CLAUDE.md

Guidance for Claude Code when working in cinc-console.

cinc-console is a Next.js web console for a **Cinc** Infra Server. Users log in
with a server username/password; the app signs every server request with the
**webui key** while impersonating the user (`X-Ops-Request-Source: web`), so the
**server enforces each user's ACLs** — the console never decides permissions.

> In user-facing copy say **Cinc**, never "Chef Server". Keep Chef API schema
> tokens (`chef_environment`, `Chef::Role`, `json_class`) as-is — those are the
> wire format.

## Commands

- `make help` — list targets. `pnpm` is the package manager.
- `make dev` / `pnpm dev` — dev server at http://localhost:3000.
- `make test` / `pnpm test` — Vitest (run once). `pnpm test <name>` filters.
- `make build` / `pnpm build` — production build (also the type check).
- `make lint` — eslint. `make check` — test + lint + build (CI parity).
- `make smoke` — build the image and verify `/api/healthz` (needs Docker).
- `make helm-lint` / `make helm-template` — validate the chart.

Run `make check` before committing.

## This is Next.js 16 — not the one in your training data

Read `node_modules/next/dist/docs/` before using an unfamiliar API. Key changes
this project relies on:

- **`proxy.ts`, not `middleware.ts`.** The root `proxy.ts` exports `proxy()` and
  gates unauthenticated users to `/login`.
- **Async request APIs.** `cookies()`, `headers()`, and route/page `params` are
  Promises — always `await` them (`const { org } = await params`).
- Turbopack is the default bundler; `output: "standalone"` for the container.

## Architecture

Single app, three layers; the webui key and signing are **server-only**.

```
app/                 UI (RSC + client components) + route handlers + server actions
  api/healthz        liveness/readiness (Dockerfile + Helm probes depend on it)
  api/auth/*         login (authenticate_user) / logout
  login/             username+password form
  orgs/[org]/<kind>/ list / [name] detail / new — one dir per object type
lib/cinc/            server-only Cinc client (NEVER import into a client component)
  signing.ts         v1.3 SHA-256 signing — faithful port of cinc-api; conformance-tested
  client.ts          signed transport; webui impersonation headers; TLS/CA; CincError
  resource.ts        makeResource(kind) -> list/get/create/update/remove
  action.ts          runAction() maps CincError -> { ok } | { error } (403 -> "forbidden")
  safe-get.ts        safeGet() for reads; explainRead() for messages
  auth.ts orgs.ts databags.ts members.ts readonly.ts acl.ts
lib/config.ts        fail-fast zod env validation (getConfig)
lib/session.ts       stateless encrypted iron-session cookie (username only)
lib/guard.ts         currentUser() — redirects to /login in a Server Component
components/          AppShell, ResourceTable, ObjectEditor, JsonEditor, NewObjectForm, ui/*
deploy/helm/         chart; Dockerfile + scripts/smoke.sh at root
```

Request path: client → route handler / server action → `lib/cinc` (sign with
webui key, set `X-Ops-UserId: <session user>` + `X-Ops-Request-Source: web`) →
Cinc server → ACL decision. The UI reacts to 200/403/404; a 403 means "no
permission" (it never substitutes its own check).

## Conventions

- **`lib/cinc/*` and `lib/session.ts` import `"server-only"`.** Never import them
  into a client component; go through a route handler or server action.
- **Object types follow the `nodes` reference** (`app/orgs/[org]/nodes/`): a
  per-kind `actions.ts` (`"use server"`) delegating to `makeResource` +
  `runAction`/`parseJsonObject`, list/detail/new pages, server actions bound with
  `.bind(null, org, name)` and passed to `ObjectEditor`/`NewObjectForm`.
- **Mutations return `{ ok: true } | { error: string }`** via `runAction`.
- v1 scope: nodes/roles/environments/data bags/members = CRUD;
  cookbooks/policies/clients = read-only. `_default` environment is read-only.

## Testing

- Vitest. Server-side tests (signing, client, actions, lib) need the **node
  environment** — add `// @vitest-environment node` at the top of the file.
- The signing **conformance test** pins byte-for-byte parity with `cinc-api`
  using `lib/cinc/__fixtures__/test_key.pem` (copied from `cinc-api/testdata`).
  Don't weaken it.
- Mock modules a `"use server"` file imports at load time with **`vi.hoisted`**
  (a bare `const` in a `vi.mock` factory hits a TDZ error).
- `server-only` is aliased to a stub in `vitest.config.ts` so server modules
  import under test.

## Configuration

Required env (validated at boot, fail-fast): `CINC_SERVER_URL`,
`CINC_WEBUI_KEY` (PEM), `SESSION_SECRET` (32+ chars). Optional: `CINC_CA_CERT`,
`CINC_SSL_NO_VERIFY`, `SESSION_TTL_SECONDS`. See `.env.example`.

## Local testing against cinc-zero

`cinc-zero` (../cinc-zero) speaks the Cinc API and supports webui impersonation
as of **v0.7.0** — earlier versions verify each request against the
`X-Ops-UserId` user's own key and return 401 for the console's signed-as-webui
requests.

```bash
cinc-zero --addr 127.0.0.1:8890 --key-out /tmp/webui.pem   # admin key doubles as the webui key
```

Point the console at it: `CINC_SERVER_URL=http://127.0.0.1:8890`,
`CINC_WEBUI_KEY=$(cat /tmp/webui.pem)`. Login requires a user **with a password**
— create one as the admin (`POST /users {"name":"…","password":"…"}` signed via
the webui key) since cinc-zero stores passwords out-of-band for `authenticate_user`.

Design spec and implementation plan live in `docs/superpowers/`.
