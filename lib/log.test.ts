// @vitest-environment node
import { expect, test, vi, afterEach } from "vitest";
import { log } from "./log";

afterEach(() => vi.restoreAllMocks());

test("info/warn emit a JSON line to stdout with event and fields", () => {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  log.info("login.success", { user: "alice" });
  expect(spy).toHaveBeenCalledOnce();
  const parsed = JSON.parse(spy.mock.calls[0][0] as string);
  expect(parsed).toMatchObject({
    level: "info",
    event: "login.success",
    user: "alice",
  });
  expect(typeof parsed.ts).toBe("string");
});

test("error goes to stderr", () => {
  const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const outSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  log.error("cinc.request_failed", { status: 500 });
  expect(errSpy).toHaveBeenCalledOnce();
  expect(outSpy).not.toHaveBeenCalled();
});
