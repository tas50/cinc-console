// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseLifecycle } from "./client-lifecycle";

// Trimmed real response from endoflife.date/api/chef-infra-client.json.
const SAMPLE = [
  { cycle: "19", releaseDate: "2026-02-05", eol: false, latest: "19.3.15" },
  { cycle: "18", releaseDate: "2022-09-28", eol: false, latest: "18.10.17" },
  { cycle: "17", releaseDate: "2021-04-27", eol: "2026-02-05", latest: "17.10.163" },
  { cycle: "16", releaseDate: "2020-04-27", eol: "2022-11-30", latest: "16.18.30" },
];

describe("parseLifecycle", () => {
  // A "now" after 17's EOL date (2026-02-05) but realistic.
  const NOW = Date.parse("2026-06-28T00:00:00Z");

  it("picks the latest major and its version", () => {
    const lc = parseLifecycle(SAMPLE, NOW);
    expect(lc.latestMajor).toBe(19);
    expect(lc.latestVersion).toBe("19.3.15");
  });

  it("treats eol:false as supported and past eol dates as EOL", () => {
    const lc = parseLifecycle(SAMPLE, NOW);
    expect(lc.eolMajors.sort((a, b) => a - b)).toEqual([16, 17]);
  });

  it("does not mark 17 EOL the day before its eol date", () => {
    const before = Date.parse("2026-02-04T00:00:00Z");
    const lc = parseLifecycle(SAMPLE, before);
    expect(lc.eolMajors).toEqual([16]);
  });

  it("handles a boolean true eol", () => {
    const lc = parseLifecycle(
      [{ cycle: "10", eol: true, latest: "10.0.0" }],
      NOW,
    );
    expect(lc.eolMajors).toEqual([10]);
  });
});
