import { join } from "node:path";
import { expect, test } from "vitest";
import { loadConfig } from "./config";

const KEY_FILE = join(process.cwd(), "lib/cinc/__fixtures__/test_key.pem");

const base = {
  CINC_SERVER_URL: "https://s",
  CINC_WEBUI_KEY: "PEM",
  SESSION_SECRET: "x".repeat(32),
};

test("error names every missing required value", () => {
  let msg = "";
  try {
    loadConfig({});
  } catch (e) {
    msg = (e as Error).message;
  }
  expect(msg).toContain("CINC_SERVER_URL");
  expect(msg).toContain("CINC_WEBUI_KEY");
  expect(msg).toContain("SESSION_SECRET");
});

test("parses a valid env with defaults", () => {
  const c = loadConfig(base);
  expect(c.serverUrl).toBe("https://s");
  expect(c.webuiKey).toBe("PEM");
  expect(c.sslNoVerify).toBe(false);
  expect(c.sessionTtlSeconds).toBe(28800);
  expect(c.chefVersion).toBe("16.0.0");
});

test("strips a trailing slash from the server url", () => {
  expect(loadConfig({ ...base, CINC_SERVER_URL: "https://s/" }).serverUrl).toBe(
    "https://s",
  );
});

test("rejects a too-short session secret", () => {
  expect(() => loadConfig({ ...base, SESSION_SECRET: "short" })).toThrow(
    /SESSION_SECRET/,
  );
});

test("reads the webui key from CINC_WEBUI_KEY_FILE", () => {
  const c = loadConfig({
    CINC_SERVER_URL: "https://s",
    CINC_WEBUI_KEY_FILE: KEY_FILE,
    SESSION_SECRET: "x".repeat(32),
  });
  expect(c.webuiKey).toContain("BEGIN RSA PRIVATE KEY");
});

test("requires either CINC_WEBUI_KEY or CINC_WEBUI_KEY_FILE", () => {
  expect(() =>
    loadConfig({ CINC_SERVER_URL: "https://s", SESSION_SECRET: "x".repeat(32) }),
  ).toThrow(/CINC_WEBUI_KEY/);
});

test("errors clearly when the key file is unreadable", () => {
  expect(() =>
    loadConfig({ ...base, CINC_WEBUI_KEY: undefined, CINC_WEBUI_KEY_FILE: "/no/such.pem" }),
  ).toThrow(/CINC_WEBUI_KEY_FILE could not read/);
});
