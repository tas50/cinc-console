import { expect, test } from "vitest";
import { isInternalPath } from "./safe-redirect";

test("accepts clean in-app paths", () => {
  expect(isInternalPath("/orgs/acme/nodes")).toBe(true);
  expect(isInternalPath("/login?from=/x")).toBe(true);
});

test("rejects open-redirect vectors and junk", () => {
  for (const p of [
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "http:/evil",
    "evil.com",
    "",
    null,
    undefined,
  ]) {
    expect(isInternalPath(p)).toBe(false);
  }
});
