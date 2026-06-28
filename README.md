# cinc-console

A web console for a [Cinc](https://cinc.sh/) / Chef Infra Server. Browse and
edit the objects in your organizations — nodes, roles, environments, data bags,
members — from the browser, with the server enforcing each user's real
permissions.

## How it works

cinc-console uses the classic **webui-key impersonation** model. The console
holds the server's `webui_priv.pem`. Users log in with their server username and
password; every request the console then makes to the cinc server is signed with
the webui key while carrying the logged-in user's identity
(`X-Ops-Userid` + `X-Ops-Request-Source: web`). The server applies that user's
ACLs, so the console never decides permissions — a `403` from the server is what
gates editing in the UI, exactly as it would for `knife`.

- **Single Next.js app.** The webui key and all request signing run server-side
  only; the browser never sees the key or talks to the cinc server directly.
- **Stateless sessions.** The session is an encrypted cookie holding only the
  username, so the console scales to N replicas with no Redis or database.
- **v1.3 signing.** The signing module is a faithful port of the Go
  [`cinc-api`](https://github.com/tas50/cinc-api) implementation, pinned by a
  byte-for-byte conformance test.

## Object scope

| Objects | Capability |
| --- | --- |
| Nodes, Roles, Environments, Data bags (+ items), Members & groups | View + create / edit / delete (ACL-gated) |
| Clients | View + create + delete (ACL-gated) |
| Cookbooks, Policies | View + delete a single version/revision or the whole object (ACL-gated) |

Editing cookbook or policy content, and uploading cookbooks, remain out of scope
for this version. Clients can be created and deleted but not edited (a client's
private key is shown once at creation and is never retrievable again).

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `CINC_SERVER_URL` | yes | Base URL of the Cinc/Chef server, e.g. `https://chef.example.com` |
| `CINC_WEBUI_KEY` | yes | Contents of `webui_priv.pem` (PEM) |
| `SESSION_SECRET` | yes | 32+ char secret used to encrypt the session cookie |
| `CINC_CA_CERT` | no | CA bundle (PEM) to trust a self-signed server |
| `CINC_SSL_NO_VERIFY` | no | `true` to skip TLS verification (dev only) |
| `SESSION_TTL_SECONDS` | no | Session lifetime, default `28800` (8h) |

The app validates these at boot and exits with a clear message if a required
value is missing.

## Deploy to Kubernetes

```bash
helm install cinc-console ./deploy/helm/cinc-console \
  --set cincServerUrl=https://chef.example.com \
  --set-file webuiKey=/etc/opscode/webui_priv.pem
```

`SESSION_SECRET` is generated automatically and preserved across upgrades. See
`deploy/helm/cinc-console/values.yaml` for all options (ingress, resources,
`existingSecret`, etc.) and `values-example.yaml` for a minimal config.

## Development

```bash
pnpm install
cp .env.example .env.local   # fill in the variables above
pnpm dev                     # http://localhost:3000
pnpm test                    # unit tests (vitest)
pnpm build                   # production build
```

## Security

- The webui key is a powerful credential — it can act as any user. Keep it in a
  Kubernetes Secret (or `existingSecret`), never in the image or client bundle.
- Serve the console over TLS; the session cookie is `HttpOnly` + `Secure` in
  production.
- Authorization is always the cinc server's. The console pre-disables some
  controls as a convenience but never substitutes its own permission decisions.
