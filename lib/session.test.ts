import { expect, test, vi } from "vitest";

vi.mock("./config", () => ({
  getConfig: () => ({ sessionSecret: "x".repeat(32), sessionTtlSeconds: 100 }),
}));

import { buildSessionOptions } from "./session";

test("session cookie is httpOnly, lax, and ttl-bound", () => {
  const o = buildSessionOptions();
  expect(o.cookieName).toBe("cinc_console");
  expect(o.ttl).toBe(100);
  expect(o.cookieOptions?.httpOnly).toBe(true);
  expect(o.cookieOptions?.sameSite).toBe("lax");
});
