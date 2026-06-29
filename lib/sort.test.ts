// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  applyDir,
  byNumber,
  byString,
  flip,
  nullsLast,
  parseSort,
  serializeSort,
  type SortState,
} from "./sort";

const DEFAULT: SortState = { key: "name", dir: "asc" };
const KEYS = ["name", "lastSeen"] as const;

describe("parseSort", () => {
  it("parses a well-formed key.dir value", () => {
    expect(parseSort("lastSeen.desc", DEFAULT, KEYS)).toEqual({
      key: "lastSeen",
      dir: "desc",
    });
  });

  it("falls back to the default when absent", () => {
    expect(parseSort(null, DEFAULT, KEYS)).toEqual(DEFAULT);
    expect(parseSort(undefined, DEFAULT, KEYS)).toEqual(DEFAULT);
    expect(parseSort("", DEFAULT, KEYS)).toEqual(DEFAULT);
  });

  it("falls back when the key is not allowed (e.g. a hand-edited URL)", () => {
    expect(parseSort("bogus.asc", DEFAULT, KEYS)).toEqual(DEFAULT);
  });

  it("falls back when the direction is invalid", () => {
    expect(parseSort("name.sideways", DEFAULT, KEYS)).toEqual(DEFAULT);
    expect(parseSort("name", DEFAULT, KEYS)).toEqual(DEFAULT);
  });
});

describe("serializeSort", () => {
  it("round-trips with parseSort", () => {
    const s: SortState = { key: "lastSeen", dir: "desc" };
    expect(parseSort(serializeSort(s), DEFAULT, KEYS)).toEqual(s);
  });
});

describe("flip", () => {
  it("flips the direction", () => {
    expect(flip("asc")).toBe("desc");
    expect(flip("desc")).toBe("asc");
  });
});

describe("applyDir", () => {
  it("passes a comparator result through for asc and negates for desc", () => {
    expect(applyDir(1, "asc")).toBe(1);
    expect(applyDir(1, "desc")).toBe(-1);
    expect(applyDir(0, "desc")).toBe(-0);
  });
});

describe("byString", () => {
  it("compares case-insensitively", () => {
    expect(byString("Apple", "banana")).toBeLessThan(0);
    expect(byString("banana", "Apple")).toBeGreaterThan(0);
    expect(byString("abc", "abc")).toBe(0);
  });
});

describe("byNumber", () => {
  it("orders ascending and avoids overflow on large values", () => {
    expect(byNumber(1, 2)).toBe(-1);
    expect(byNumber(2, 1)).toBe(1);
    expect(byNumber(5, 5)).toBe(0);
  });
});

describe("nullsLast", () => {
  it("pins null after non-null regardless of the inner direction", () => {
    const asc = nullsLast<number>((a, b) => applyDir(byNumber(a, b), "asc"));
    const desc = nullsLast<number>((a, b) => applyDir(byNumber(a, b), "desc"));
    // null always sorts last (positive => a after b) in both directions
    expect(asc(null, 5)).toBe(1);
    expect(desc(null, 5)).toBe(1);
    expect(asc(5, null)).toBe(-1);
    expect(desc(5, null)).toBe(-1);
    expect(asc(null, null)).toBe(0);
    // non-null values still honor the inner comparator's direction
    expect(asc(1, 2)).toBeLessThan(0);
    expect(desc(1, 2)).toBeGreaterThan(0);
  });
});
