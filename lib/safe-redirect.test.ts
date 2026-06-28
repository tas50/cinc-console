import { expect, test } from "vitest";
import { isInternalPath } from "./safe-redirect";

test("accepts internal absolute paths", () => {
  expect(isInternalPath("/orgs")).toBe(true);
  expect(isInternalPath("/orgs/acme/nodes/web01?tab=runlist")).toBe(true);
});

test("rejects protocol-relative and absolute URLs", () => {
  expect(isInternalPath("//evil.com")).toBe(false);
  expect(isInternalPath("https://evil.com")).toBe(false);
  expect(isInternalPath("http://evil.com")).toBe(false);
});

test("rejects a backslash after the leading slash (browsers treat it as //)", () => {
  expect(isInternalPath("/\\evil.com")).toBe(false);
  expect(isInternalPath("/\\/evil.com")).toBe(false);
});

test("rejects relative paths and empty/nullish input", () => {
  expect(isInternalPath("orgs")).toBe(false);
  expect(isInternalPath("")).toBe(false);
  expect(isInternalPath(null)).toBe(false);
  expect(isInternalPath(undefined)).toBe(false);
});
