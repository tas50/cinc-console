// @vitest-environment node
import { expect, test } from "vitest";
import { runAction, parseJsonObject } from "./action";
import { CincError } from "./errors";

test("runAction returns ok on success", async () => {
  expect(await runAction(async () => undefined)).toEqual({ ok: true });
});

test("runAction maps 403 to forbidden", async () => {
  const r = await runAction(async () => {
    throw new CincError(403, {});
  });
  expect(r).toEqual({ error: "forbidden" });
});

test("runAction maps 404 to not found", async () => {
  const r = await runAction(async () => {
    throw new CincError(404, {});
  });
  expect(r).toEqual({ error: "not found" });
});

test("runAction maps 409 to already exists", async () => {
  const r = await runAction(async () => {
    throw new CincError(409, {});
  });
  expect(r).toEqual({ error: "already exists" });
});

test("runAction reports other statuses generically", async () => {
  const r = await runAction(async () => {
    throw new CincError(500, {});
  });
  expect(r).toEqual({ error: "server error (500)" });
});

test("runAction rethrows non-CincError so it isn't swallowed", async () => {
  await expect(
    runAction(async () => {
      throw new TypeError("boom");
    }),
  ).rejects.toThrow("boom");
});

test("parseJsonObject accepts a JSON object", () => {
  expect(parseJsonObject('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
});

test("parseJsonObject rejects arrays, primitives, null, and invalid JSON", () => {
  expect(parseJsonObject("[1,2]")).toEqual({ ok: false });
  expect(parseJsonObject('"str"')).toEqual({ ok: false });
  expect(parseJsonObject("42")).toEqual({ ok: false });
  expect(parseJsonObject("null")).toEqual({ ok: false });
  expect(parseJsonObject("{not json}")).toEqual({ ok: false });
});
