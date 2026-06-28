// @vitest-environment node
import { expect, test } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function req(path: string, opts: { session?: boolean } = {}) {
  const r = new NextRequest(new URL(`https://console.test${path}`));
  if (opts.session) r.cookies.set("cinc_console", "x");
  return r;
}

const location = (res: Response) => res.headers.get("location");

test("unauthenticated request redirects to /login with a from param", () => {
  const res = proxy(req("/orgs/acme/nodes/web01"));
  const url = new URL(location(res)!);
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("from")).toBe("/orgs/acme/nodes/web01");
});

test("does not add a from param for the root", () => {
  const url = new URL(location(proxy(req("/")))!);
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.has("from")).toBe(false);
});

test("authenticated user on /login is sent to a safe from target", () => {
  const res = proxy(req("/login?from=/orgs/acme/roles", { session: true }));
  expect(new URL(location(res)!).pathname).toBe("/orgs/acme/roles");
});

test("an off-site from is ignored (no open redirect)", () => {
  const res = proxy(req("/login?from=//evil.com", { session: true }));
  expect(new URL(location(res)!).pathname).toBe("/orgs");
});

test("an authenticated request passes through", () => {
  const res = proxy(req("/orgs/acme/nodes", { session: true }));
  expect(location(res)).toBeNull();
});
