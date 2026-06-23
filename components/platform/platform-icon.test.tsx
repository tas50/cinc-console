import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PlatformIcon, glyphFor } from "./platform-icon";

describe("glyphFor", () => {
  it.each([
    ["Ubuntu", "ubuntu"],
    ["ubuntu", "ubuntu"],
    ["debian", "debian"],
    ["raspbian", "debian"],
    ["Red Hat Enterprise Linux", "redhat"],
    ["rhel", "redhat"],
    ["centos", "redhat"],
    ["rocky", "redhat"],
    ["almalinux", "redhat"],
    ["amazon", "redhat"],
    ["fedora", "redhat"],
    ["windows", "windows"],
    ["mac_os_x", "apple"],
    ["darwin", "apple"],
    ["alpine", "alpine"],
    ["arch", "arch"],
    ["plan9", "generic"],
    ["suse", "generic"],
  ])("maps %s to the %s glyph", (platform, expected) => {
    expect(glyphFor(platform)).toBe(expected);
  });
});

describe("PlatformIcon", () => {
  function glyphOf(node: HTMLElement) {
    return node.querySelector("svg")?.getAttribute("data-platform-glyph");
  }

  it("renders the matching glyph and labels it with the platform", () => {
    const { container } = render(<PlatformIcon platform="Ubuntu" />);
    expect(glyphOf(container)).toBe("ubuntu");
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", "Ubuntu");
  });

  it("falls back to the generic glyph for empty or non-string input", () => {
    const { container: a } = render(<PlatformIcon platform="" />);
    expect(glyphOf(a)).toBe("generic");
    expect(a.querySelector("svg")).toHaveAttribute("aria-label", "unknown platform");

    const { container: b } = render(<PlatformIcon platform={undefined} />);
    expect(glyphOf(b)).toBe("generic");
  });
});
