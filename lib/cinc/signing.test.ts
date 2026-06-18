// @vitest-environment node
import { readFileSync } from "node:fs";
import { createVerify, createHash } from "node:crypto";
import { expect, test } from "vitest";
import { canonicalRequest, contentHash, signHeaders } from "./signing";

const key = readFileSync(
  new URL("./__fixtures__/test_key.pem", import.meta.url),
  "utf8",
);

test("canonicalRequest matches the v1.3 layout", () => {
  const s = canonicalRequest({
    method: "GET",
    path: "/nodes",
    userId: "u",
    timestamp: "2024-01-01T00:00:00Z",
  });
  expect(s).toBe(
    "Method:GET\nPath:/nodes\nX-Ops-Content-Hash:" +
      contentHash("") +
      "\nX-Ops-Sign:version=1.3\nX-Ops-Timestamp:2024-01-01T00:00:00Z" +
      "\nX-Ops-UserId:u\nX-Ops-Server-API-Version:1",
  );
});

test("contentHash is base64(sha256(body))", () => {
  expect(contentHash("")).toBe(createHash("sha256").update("").digest("base64"));
});

test("signHeaders emits required headers and a verifiable signature", () => {
  const r = {
    method: "POST",
    path: "/nodes",
    body: '{"a":1}',
    userId: "u",
    timestamp: "2024-01-01T00:00:00Z",
  };
  const h = signHeaders(r, key);
  for (const k of [
    "X-Ops-Sign",
    "X-Ops-UserId",
    "X-Ops-Timestamp",
    "X-Ops-Content-Hash",
    "X-Ops-Server-API-Version",
    "X-Ops-Authorization-1",
  ]) {
    expect(h[k]).toBeTruthy();
  }
  expect(h["X-Ops-Sign"]).toBe("version=1.3");
  let sig = "";
  for (let i = 1; h[`X-Ops-Authorization-${i}`]; i++)
    sig += h[`X-Ops-Authorization-${i}`];
  const ok = createVerify("RSA-SHA256")
    .update(canonicalRequest(r))
    .verify(key, Buffer.from(sig, "base64"));
  expect(ok).toBe(true);
});

test("auth header chunks are 60 chars wide", () => {
  const h = signHeaders(
    { method: "GET", path: "/nodes", userId: "u", timestamp: "2024-01-01T00:00:00Z" },
    key,
  );
  expect(h["X-Ops-Authorization-1"].length).toBe(60);
});

test("canonicalPath collapses slashes and strips trailing slash", () => {
  const r = {
    method: "GET",
    path: "/organizations/acme//nodes/",
    userId: "u",
    timestamp: "2024-01-01T00:00:00Z",
  };
  expect(canonicalRequest(r)).toContain("\nPath:/organizations/acme/nodes\n");
});
