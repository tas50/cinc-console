import { expect, test } from "vitest";
import { loadConfig } from "./config";

test("throws listing all missing required vars", () => {
  expect(() => loadConfig({})).toThrow(
    /CINC_SERVER_URL.*CINC_WEBUI_KEY.*SESSION_SECRET/s,
  );
});

test("parses a valid env with defaults", () => {
  const c = loadConfig({
    CINC_SERVER_URL: "https://s",
    CINC_WEBUI_KEY: "PEM",
    SESSION_SECRET: "x".repeat(32),
  });
  expect(c.serverUrl).toBe("https://s");
  expect(c.sslNoVerify).toBe(false);
  expect(c.sessionTtlSeconds).toBe(28800);
  expect(c.chefVersion).toBe("16.0.0");
});

test("strips a trailing slash from the server url", () => {
  const c = loadConfig({
    CINC_SERVER_URL: "https://s/",
    CINC_WEBUI_KEY: "PEM",
    SESSION_SECRET: "x".repeat(32),
  });
  expect(c.serverUrl).toBe("https://s");
});

test("rejects a too-short session secret", () => {
  expect(() =>
    loadConfig({
      CINC_SERVER_URL: "https://s",
      CINC_WEBUI_KEY: "PEM",
      SESSION_SECRET: "short",
    }),
  ).toThrow(/SESSION_SECRET/);
});
