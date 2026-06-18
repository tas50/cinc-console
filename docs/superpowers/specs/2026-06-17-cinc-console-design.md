# cinc-console — Design Spec

**Date:** 2026-06-17
**Status:** Approved (design); pending implementation plan

## Summary

`cinc-console` is a web UI (management console) for a Cinc/Chef Infra Server.
It is a single Next.js (App Router, TypeScript) application that authenticates
against the server using the **webui key impersonation** model (the classic
Chef Manage approach): the console holds the server's `webui_priv.pem`, users
log in with username/password, and every server request is signed with the
webui key while carrying the logged-in user's identity so the server enforces
that user's real ACLs.

It ships as a single container image plus a Helm chart so it runs easily in
Kubernetes with a small set of configuration inputs.

## Goals

- Browse and search Cinc/Chef server objects across the organizations a user
  belongs to.
- View objects, and create/edit/delete them **when the user's server-side ACLs
  allow it** — authorization is decided by the server, never by the console.
- Run as a single, stateless, horizontally-scalable container in Kubernetes.
- Keep request signing faithful to the canonical Go implementation in
  `cinc-api`.

## Non-goals (v1)

- Cookbook / cookbook-artifact uploads (sandbox/checksum flow).
- Policy authoring/management writes.
- Client object writes.
- A light theme (tokens are structured to allow it later; only dark ships).
- Any external datastore (no Redis/DB).

## Decisions

| Area | Decision |
|---|---|
| Identity model | webui-key impersonation (Chef Manage model); username/password login; `X-Ops-Request-Source: web` |
| Backend | Pure Next.js; v1.3 signing reimplemented in TypeScript (faithful port of `cinc-api/internal/signing`) |
| v1 object scope | Core objects full CRUD; cookbooks/policies/clients read-only; no uploads |
| Sessions | Stateless encrypted cookie (no external store) |
| k8s packaging | Dockerfile + Helm chart |

## Architecture

A single Next.js container with three internal layers:

1. **UI** — React Server/Client Components, Tailwind + shadcn/ui, dark theme.
2. **Server-side BFF** — Next.js Route Handlers (`/api/*`) and Server Actions.
   This is the **only** place the webui key and request signing live. The
   browser never sees the key and never talks to the Cinc server directly.
3. **`lib/cinc/`** — a typed Cinc-server client: the v1.3 signing module plus
   per-object request builders.

### Request flow (example: editing a node)

```
Browser ──fetch /api/orgs/acme/nodes/web01 (PUT)──▶ Route Handler
   Route Handler: read session cookie → username
   lib/cinc: build PUT /organizations/acme/nodes/web01
     sign with WEBUI key, set
       X-Ops-UserId: <username>
       X-Ops-Request-Source: web
   ──signed HTTPS──▶ cinc-server
   cinc-server enforces THAT user's ACL → 200 / 403
   ◀── result bubbles back to browser
```

The console never decides privileges. The server's bifrost ACLs decide, exactly
as for `knife`. A `403` from the server drives the "you can't edit this"
experience in the UI.

## Authentication & session

### Login flow

1. User submits username + password to `POST /api/auth/login`.
2. Server signs `POST /authenticate_user` (top-level, non-org endpoint) with the
   webui key, body `{ username, password }`. The server validates credentials.
   - `200` → valid; `401` → bad credentials (surface "invalid username or
     password").
3. On success, issue a **stateless encrypted session cookie** (iron-session /
   JWE) containing only `{ username, loginAt }`: `HttpOnly`, `Secure`,
   `SameSite=Lax`, sliding expiry (~8h). No password or key is stored.
4. Logout clears the cookie.

### Why stateless

Every authenticated request re-derives identity from the cookie's `username`,
then signs with the shared webui key + `X-Ops-Request-Source: web`. Nothing
per-user is persisted, so any replica can serve any request — clean horizontal
scaling, no Redis.

### Authorization

None in the console itself; the server is the single source of truth. Each call
carries the real user and the server applies that user's ACLs. The UI reacts to
`200/403/404`. We may fetch an object's `/_acl` to **pre-disable** Edit/Delete
controls as a nicety, but the hard gate is always the server's response.

### Org context

After login, fetch the user's orgs (`GET /users/<name>/organizations`). The user
picks an active org, carried in the URL path (`/orgs/<org>/...`) and remembered
in a lightweight cookie. All object routes are org-scoped.

### Security notes

- Webui key only in server memory (mounted secret; never bundled, never sent to
  the client).
- CSRF protection on mutating routes (Server Action origin checks; a token for
  raw Route Handlers).
- Rate-limit the login route.
- Validate required configuration at boot; fail fast and loud if missing.

## App structure, objects & UI

### Route map (App Router)

```
/login
/orgs                         → org picker (user's orgs)
/orgs/[org]                   → org dashboard (counts, quick search)
/orgs/[org]/nodes             → list + search        ┐
/orgs/[org]/nodes/[name]      → detail / edit        │ full CRUD
/orgs/[org]/roles[...]        → list / detail / edit │ (ACL-gated
/orgs/[org]/environments[...] → list / detail / edit │  by server)
/orgs/[org]/data_bags[...]    → bags + items         ┘
/orgs/[org]/members           → org users + groups (membership mgmt)
/orgs/[org]/cookbooks[...]    → list / detail (READ-ONLY v1)
/orgs/[org]/policies[...]     → READ-ONLY v1
/orgs/[org]/clients[...]      → READ-ONLY v1
```

### Object UI pattern (consistent across types)

- **List view** — paginated/searchable table (uses server `search` where
  available, e.g. nodes; plain list otherwise), with primary actions in the
  accent color.
- **Detail view** — rendered fields plus a raw, validated **JSON editor**
  (Monaco) tab. Chef objects are JSON documents, so every editable type gets a
  JSON editor alongside a friendlier form for common fields (node run-list &
  environment; role run-list/attributes; environment cookbook constraints; data
  bag item key/values).
- **Mutations** via Server Actions → BFF → signed call. Show the server result
  (no optimistic UI by default). `403` → inline "you don't have permission"
  toast; `409/412` → conflict surfaced.
- **Create / Delete** controls present but disabled (with tooltip) when a cheap
  ACL check says no; always honor the server's actual response.

### Data layer

Route Handlers return typed JSON; client components use a small SWR-style fetcher
for lists/search; mutations go through Server Actions for progressive
enhancement and built-in CSRF origin checks.

### `lib/cinc/` modules

`signing.ts`, `client.ts` (transport: base URL, webui key, impersonation
headers, TLS/CA handling, retries), and one file per object family mirroring
`cinc-api`'s shape: `nodes.ts`, `roles.ts`, `environments.ts`, `databags.ts`,
`associations.ts`, `groups.ts`, `cookbooks.ts`, `search.ts`, `acl.ts`.

## Visual design

Direction: a dense, professional operator console (Grafana/dashboard feel, not a
marketing site). Information-dense tables, calm dark surfaces, with the orange
accent reserved for primary actions and active/selected state so it carries
weight rather than decorating everything.

### Dark palette

| Token | Value | Use |
|---|---|---|
| `--bg` | `#15171A` near-black | app background |
| `--surface` | `#1E2125` | cards, tables, sidebar |
| `--border` | `#2C3036` | dividers, table lines |
| `--primary` | `#F2811D` orange | primary buttons, active nav, focus ring, links |
| `--primary-hover` | `#FF9433` | hover state |
| `--muted` | `#7E8E8E` slate gray | secondary text, icons, meta |
| `--text` | `#E8EAED` off-white | body text |
| `--success / --warn / --danger` | green / amber / red | status, destructive actions |

- **Type:** Inter (UI) + a monospace (JetBrains Mono / `ui-monospace`) for JSON
  editors, run-lists, checksums, and keys.
- **shadcn/ui** themed to these tokens via CSS variables, so a light theme is a
  later flip of the same tokens. Dark is the default and the only theme in v1.
- Logo lockup top-left; org switcher beside it; user menu top-right.
- Use the `vercel:shadcn` and `frontend-design` skills during implementation for
  component quality and a non-templated feel.

## Container & Helm

### Image

Multi-stage Dockerfile → Next.js **standalone** output on a small Node base
(`node:22-alpine` or distroless), non-root user, `HEALTHCHECK` on
`/api/healthz`. Single process, no sidecar.

### Helm chart (`deploy/helm/cinc-console/`)

- **Deployment** — configurable replicas, resource limits, readiness/liveness on
  `/api/healthz`, env wired from ConfigMap + Secret.
- **ConfigMap** — `CINC_SERVER_URL`, `CINC_SSL_NO_VERIFY`, log level, session TTL.
- **Secret** — `CINC_WEBUI_KEY` (PEM), `SESSION_SECRET`, optional
  `CINC_CA_CERT`. The chart can generate `SESSION_SECRET` if not supplied; the
  webui key is operator-provided.
- **Service** + optional **Ingress** (host, TLS, annotations) toggled in
  `values.yaml`.
- **`values.yaml`** documents every knob; `values-example.yaml` shows a minimal
  working config.

### Config contract

The app validates required env at boot (zod schema) and fails fast with a clear
message if the webui key / server URL / session secret are missing, so a
misconfigured pod crashes loudly rather than half-working.

Inputs:

- `CINC_SERVER_URL` — base URL of the Cinc/Chef server.
- `CINC_WEBUI_KEY` — webui private key (PEM), mounted secret.
- `SESSION_SECRET` — encrypts the session cookie.
- `CINC_CA_CERT` (optional) — CA bundle for self-signed servers.
- `CINC_SSL_NO_VERIFY` (optional) — skip TLS verification (dev only).

## Testing

- **Unit (Vitest):** the signing module gets a **conformance test** — sign a
  fixed request and assert byte-for-byte parity with `cinc-api`'s known-good
  vectors (reuse `cinc-api/testdata` key + expected headers). This is the
  highest-risk code and is pinned hardest. Plus session encode/decode, env
  validation, and request builders.
- **Component (React Testing Library):** list/detail/edit flows against a mocked
  BFF, including the `403` "no permission" path.
- **Integration (optional, gated):** against a disposable Cinc server or
  `goiardi` (speaks the Chef API) in CI — login → list → edit → read-back.
- **Container smoke:** build the image, boot with a test config, assert
  `/api/healthz` returns 200.

## Risks & mitigations

- **Signing divergence from `cinc-api`.** Mitigated by the byte-for-byte
  conformance test against shared vectors.
- **Server endpoint/version differences** (`authenticate_user`, `/_acl`,
  `organizations`). Mitigated by integration tests against goiardi/a real
  server and graceful handling of missing endpoints.
- **Webui key exposure.** Mitigated by server-only handling, mounted secret, and
  never shipping it to the client.

## Phasing

- **v1 (this spec):** auth + sessions, org context, core objects full CRUD,
  read-only cookbooks/policies/clients, container + Helm, signing conformance.
- **Later:** cookbook/artifact uploads, policy writes, client writes, light
  theme, richer ACL editing UI, audit/event views.
