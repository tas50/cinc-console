// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { getClientLifecycle, parseLifecycle } from "./client-lifecycle";

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

describe("getClientLifecycle", () => {
  const NOW = Date.parse("2026-06-28T00:00:00Z");

  afterEach(() => vi.unstubAllGlobals());

  it("bounds the request with an abort signal so a stalled endpoint can't hang", async () => {
    // The whole dashboard snapshot awaits this call; without a timeout a fetch
    // that connects but never responds would freeze the dashboard forever.
    let signalled = false;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
        // The fix wires a timeout signal in; reject as `AbortSignal.timeout`
        // would when the endpoint stalls (no need to wait the real timeout).
        signalled = init?.signal instanceof AbortSignal;
        return Promise.reject(new DOMException("timed out", "TimeoutError"));
      }),
    );

    const lc = await getClientLifecycle(NOW);
    expect(signalled).toBe(true);
    // A timed-out fetch degrades to "unavailable" rather than throwing, so the
    // snapshot still resolves and the fleet renders without the EOL split.
    expect(lc).toEqual({ latestMajor: null, latestVersion: null, eolMajors: [] });
  });

  it("parses a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(SAMPLE), { status: 200 })),
    );
    const lc = await getClientLifecycle(NOW);
    expect(lc.latestMajor).toBe(19);
    expect(lc.eolMajors.sort((a, b) => a - b)).toEqual([16, 17]);
  });

  it("degrades to unavailable on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );
    expect(await getClientLifecycle(NOW)).toEqual({
      latestMajor: null,
      latestVersion: null,
      eolMajors: [],
    });
  });
});
