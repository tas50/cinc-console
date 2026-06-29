// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseCookbookList, parseCookbookVersions } from "./cookbooks";

describe("parseCookbookVersions", () => {
  it("pulls version strings out of a single-cookbook payload", () => {
    const data = {
      apache2: {
        versions: [
          { url: "u", version: "5.1.0" },
          { url: "u", version: "4.0.0" },
        ],
      },
    };
    expect(parseCookbookVersions(data)).toEqual(["5.1.0", "4.0.0"]);
  });

  it("returns [] for a non-record payload", () => {
    expect(parseCookbookVersions(null)).toEqual([]);
    expect(parseCookbookVersions("nope")).toEqual([]);
  });
});

describe("parseCookbookList", () => {
  it("summarizes each cookbook with its name, latest version, and count", () => {
    const data = {
      apache2: {
        url: "u",
        versions: [
          { url: "u", version: "5.1.0" },
          { url: "u", version: "4.0.0" },
        ],
      },
      nginx: { url: "u", versions: [{ url: "u", version: "1.2.0" }] },
    };
    expect(parseCookbookList(data)).toEqual([
      { name: "apache2", latest: "5.1.0", count: 2 },
      { name: "nginx", latest: "1.2.0", count: 1 },
    ]);
  });

  it("computes the latest by version order, not array position", () => {
    const data = {
      apache2: {
        versions: [
          { url: "u", version: "4.0.0" },
          { url: "u", version: "10.2.0" },
          { url: "u", version: "9.9.9" },
        ],
      },
    };
    expect(parseCookbookList(data)).toEqual([
      { name: "apache2", latest: "10.2.0", count: 3 },
    ]);
  });

  it("reports a null latest and zero count when a cookbook has no versions", () => {
    const data = { ghost: { url: "u", versions: [] } };
    expect(parseCookbookList(data)).toEqual([
      { name: "ghost", latest: null, count: 0 },
    ]);
  });

  it("returns [] for a non-record payload", () => {
    expect(parseCookbookList(null)).toEqual([]);
    expect(parseCookbookList([])).toEqual([]);
  });
});
