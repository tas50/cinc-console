// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterEach, expect, test, vi } from "vitest";

const key = readFileSync(
  new URL("./__fixtures__/test_key.pem", import.meta.url),
  "utf8",
);

vi.mock("../config", () => ({
  getConfig: () => ({
    serverUrl: "https://s",
    webuiKey: key,
    sslNoVerify: false,
    chefVersion: "16.0.0",
  }),
}));

import { cincRequest } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("signs as webui key impersonating the user with web source", async () => {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ ok: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const out = await cincRequest<{ ok: number }>({
    user: "alice",
    method: "GET",
    path: "/nodes",
    org: "acme",
  });
  expect(out.ok).toBe(1);
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://s/organizations/acme/nodes");
  const headers = init.headers as Record<string, string>;
  expect(headers["X-Ops-UserId"]).toBe("alice");
  expect(headers["X-Ops-Request-Source"]).toBe("web");
  expect(headers["X-Ops-Authorization-1"]).toBeTruthy();
});

test("throws CincError with status on non-2xx", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("denied", { status: 403 })),
  );
  await expect(
    cincRequest({ user: "u", method: "GET", path: "/nodes", org: "acme" }),
  ).rejects.toMatchObject({ status: 403, forbidden: true });
});

test("omits the org prefix for top-level paths", async () => {
  const fetchMock = vi.fn(
    async () => new Response(JSON.stringify({}), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  await cincRequest({ user: "u", method: "POST", path: "/authenticate_user", body: { username: "u" } });
  const [url] = fetchMock.mock.calls[0] as [string];
  expect(url).toBe("https://s/authenticate_user");
});
