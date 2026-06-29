// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  buildSnapshot,
  clientStatus,
  compareVersions,
  isMissing,
  isUnconfigured,
  majorOf,
  newestVersion,
  MISSING_AFTER_MS,
  type ClientLifecycle,
  type FleetNode,
} from "./fleet";

const NOW = 1_700_000_000_000; // fixed "now" in ms

// Mirrors the endoflife.date state we care about: 19 latest, 18 supported,
// 17 and below EOL.
const LIFECYCLE: ClientLifecycle = {
  latestMajor: 19,
  latestVersion: "19.3.15",
  eolMajors: [17, 16, 15],
};

function node(over: Partial<FleetNode> = {}): FleetNode {
  return {
    name: "n",
    ohaiTime: NOW / 1000, // checked in "now" by default
    runList: ["recipe[base]"],
    policyName: null,
    policyGroup: null,
    chefVersion: "19.3.15",
    ...over,
  };
}

describe("isMissing", () => {
  it("is false for a recent check-in", () => {
    expect(isMissing(node({ ohaiTime: NOW / 1000 }), NOW)).toBe(false);
  });

  it("is true past the threshold", () => {
    const old = (NOW - MISSING_AFTER_MS - 1000) / 1000;
    expect(isMissing(node({ ohaiTime: old }), NOW)).toBe(true);
  });

  it("treats a node that never checked in as missing", () => {
    expect(isMissing(node({ ohaiTime: null }), NOW)).toBe(true);
  });
});

describe("isUnconfigured", () => {
  it("is true for empty run-list and no policy", () => {
    expect(isUnconfigured(node({ runList: [], policyName: null }))).toBe(true);
  });

  it("is false when a run-list is present", () => {
    expect(isUnconfigured(node({ runList: ["recipe[x]"] }))).toBe(false);
  });

  it("is false for a policyfile node (empty run-list but a policy)", () => {
    expect(isUnconfigured(node({ runList: [], policyName: "web" }))).toBe(false);
  });
});

describe("compareVersions / newestVersion / majorOf", () => {
  it("orders dotted numeric versions", () => {
    expect(compareVersions("18.4.12", "18.4.2")).toBe(1);
    expect(compareVersions("18.4", "18.4.1")).toBe(-1);
    expect(compareVersions("18.4.0", "18.4")).toBe(0);
  });

  it("extracts the major", () => {
    expect(majorOf("18.10.17")).toBe(18);
    expect(majorOf("not-a-version")).toBe(null);
  });

  it("finds the newest version, ignoring unknowns", () => {
    const nodes = [
      node({ chefVersion: "17.10.0" }),
      node({ chefVersion: null }),
      node({ chefVersion: "18.4.12" }),
    ];
    expect(newestVersion(nodes)).toBe("18.4.12");
  });
});

describe("clientStatus", () => {
  it("is current on the latest major", () => {
    expect(clientStatus(node({ chefVersion: "19.3.15" }), LIFECYCLE, null)).toBe(
      "current",
    );
  });

  it("flags one major behind", () => {
    expect(clientStatus(node({ chefVersion: "18.10.17" }), LIFECYCLE, null)).toBe(
      "major-behind",
    );
  });

  it("flags EOL majors, and EOL wins over major-behind", () => {
    expect(clientStatus(node({ chefVersion: "17.10.163" }), LIFECYCLE, null)).toBe(
      "eol",
    );
  });

  it("is unknown when no version is reported", () => {
    expect(clientStatus(node({ chefVersion: null }), LIFECYCLE, null)).toBe(
      "unknown",
    );
  });

  it("falls back to the fleet's newest major when lifecycle is unavailable", () => {
    const unavailable: ClientLifecycle = {
      latestMajor: null,
      latestVersion: null,
      eolMajors: [],
    };
    // fleet newest major is 19; an 18.x node still reads as major-behind, and
    // nothing is EOL because there's no lifecycle data.
    expect(clientStatus(node({ chefVersion: "18.1.0" }), unavailable, 19)).toBe(
      "major-behind",
    );
    expect(clientStatus(node({ chefVersion: "17.1.0" }), unavailable, 19)).toBe(
      "major-behind",
    );
  });
});

describe("buildSnapshot", () => {
  it("counts diagnostics independently, splits eol vs major-behind, sorts by check-in", () => {
    const nodes: FleetNode[] = [
      node({ name: "web1", ohaiTime: NOW / 1000, chefVersion: "19.3.15" }),
      node({ name: "db1", ohaiTime: (NOW - 1000) / 1000, chefVersion: "18.10.17" }),
      node({
        name: "web2",
        ohaiTime: (NOW - MISSING_AFTER_MS - 1) / 1000, // missing
        chefVersion: "17.10.163", // eol
      }),
      node({
        name: "fresh",
        ohaiTime: null, // missing (never seen)
        runList: [], // unconfigured
        policyName: null,
        chefVersion: null, // unknown client
      }),
    ];

    const snap = buildSnapshot(nodes, NOW, LIFECYCLE);

    expect(snap.stats.total).toBe(4);
    expect(snap.stats.missing).toBe(2); // web2 + fresh
    expect(snap.stats.unconfigured).toBe(1); // fresh
    expect(snap.stats.eol).toBe(1); // web2
    expect(snap.stats.majorBehind).toBe(1); // db1
    expect(snap.stats.outdated).toBe(2); // eol + majorBehind
    expect(snap.stats.latestMajor).toBe(19);
    expect(snap.stats.latestVersion).toBe("19.3.15");
    expect(snap.generatedAt).toBe(NOW);

    // most-recently-seen first; null check-in sorts last
    expect(snap.nodes.map((n) => n.name)).toEqual([
      "web1",
      "db1",
      "web2",
      "fresh",
    ]);

    const fresh = snap.nodes.find((n) => n.name === "fresh")!;
    expect(fresh.status).toBe("missing"); // missing wins over unconfigured
    expect(fresh.clientStatus).toBe("unknown");
  });

  it("carries independent diagnostic flags so a tile filter matches its count", () => {
    // A never-converged node is BOTH missing and unconfigured. The badge is
    // single-valued (missing wins), but the per-node flags must mirror the stat
    // tiles exactly, or the unconfigured filter selects nothing the tile counted.
    const fresh = node({
      name: "fresh",
      ohaiTime: null, // missing (never seen)
      runList: [], // unconfigured
      policyName: null,
    });

    const snap = buildSnapshot([fresh], NOW, LIFECYCLE);
    const row = snap.nodes[0];

    expect(snap.stats.missing).toBe(1);
    expect(snap.stats.unconfigured).toBe(1);
    // The row badge collapses to one status, but both flags are set, so a
    // filter on either flag selects exactly the node its tile counted.
    expect(row.status).toBe("missing");
    expect(row.missing).toBe(true);
    expect(row.unconfigured).toBe(true);
    expect(snap.nodes.filter((n) => n.unconfigured)).toHaveLength(
      snap.stats.unconfigured,
    );
    expect(snap.nodes.filter((n) => n.missing)).toHaveLength(
      snap.stats.missing,
    );
  });
});
