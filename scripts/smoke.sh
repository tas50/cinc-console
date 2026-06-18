#!/usr/bin/env bash
# Build the container image, boot it with a throwaway config, and confirm the
# health endpoint comes up. Does not require a real cinc server.
set -euo pipefail

cd "$(dirname "$0")/.."

key="$(mktemp)"
openssl genrsa -out "$key" 2048 2>/dev/null

echo "==> building image"
docker build -t cinc-console:smoke .

echo "==> starting container"
cid=$(docker run -d -p 3000:3000 \
  -e CINC_SERVER_URL=https://example.invalid \
  -e CINC_WEBUI_KEY="$(cat "$key")" \
  -e SESSION_SECRET=0123456789abcdef0123456789abcdef \
  cinc-console:smoke)
trap 'docker rm -f "$cid" >/dev/null 2>&1 || true; rm -f "$key"' EXIT

echo "==> waiting for /api/healthz"
for _ in $(seq 1 30); do
  if curl -fs http://127.0.0.1:3000/api/healthz >/dev/null; then
    echo "healthz OK"
    exit 0
  fi
  sleep 1
done

echo "healthz did not come up" >&2
docker logs "$cid" >&2
exit 1
