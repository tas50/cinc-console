// @vitest-environment node
import { describe, it, expect } from "vitest";
import { relativeAgo } from "./time";

describe("relativeAgo", () => {
  it("reads under five seconds as 'just now'", () => {
    expect(relativeAgo(0)).toBe("just now");
    expect(relativeAgo(4_000)).toBe("just now");
  });

  it("clamps a negative delta (clock skew) to 'just now'", () => {
    expect(relativeAgo(-10_000)).toBe("just now");
  });

  it("reports seconds, minutes, hours, and days", () => {
    expect(relativeAgo(10_000)).toBe("10s ago");
    expect(relativeAgo(90_000)).toBe("1m ago");
    expect(relativeAgo(2 * 60 * 60 * 1000)).toBe("2h ago");
    expect(relativeAgo(3 * 24 * 60 * 60 * 1000)).toBe("3d ago");
  });
});
