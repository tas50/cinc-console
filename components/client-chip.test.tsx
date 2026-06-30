import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientChip, ClientVersion } from "./client-chip";

describe("ClientChip", () => {
  it("flags an EOL client with a danger-colored border", () => {
    render(<ClientChip status="eol" />);
    const chip = screen.getByText(/EOL/);
    expect(chip).toHaveClass("border-danger");
  });

  it("flags a major-behind client with a warn-colored border (not a neutral one)", () => {
    render(<ClientChip status="major-behind" />);
    const chip = screen.getByText(/Major release behind/);
    expect(chip).toHaveClass("border-warn");
    expect(chip).not.toHaveClass("border-border");
  });

  it("capitalizes both labels", () => {
    const { rerender } = render(<ClientChip status="eol" />);
    expect(screen.getByText("EOL")).toBeInTheDocument();
    rerender(<ClientChip status="major-behind" />);
    expect(screen.getByText("Major release behind")).toBeInTheDocument();
  });

  it("gives both flags the same fixed height", () => {
    const { rerender } = render(<ClientChip status="eol" />);
    expect(screen.getByText("EOL")).toHaveClass("h-5");
    rerender(<ClientChip status="major-behind" />);
    expect(screen.getByText("Major release behind")).toHaveClass("h-5");
  });

  it("renders nothing for a current or unknown client", () => {
    const { container: current } = render(<ClientChip status="current" />);
    expect(current).toBeEmptyDOMElement();
    const { container: unknown } = render(<ClientChip status="unknown" />);
    expect(unknown).toBeEmptyDOMElement();
  });
});

describe("ClientVersion", () => {
  it("pads the version to a fixed width so chips line up across rows", () => {
    render(<ClientVersion version="19.3.15" status="eol" />);
    const version = screen.getByText("19.3.15");
    // A min-width + tabular figures keep the chip's start column identical
    // regardless of how wide the version string is.
    expect(version).toHaveClass("min-w-[4.5rem]");
    expect(version).toHaveClass("tabular-nums");
    expect(screen.getByText("EOL")).toBeInTheDocument();
  });

  it("shows a dash when the version is unknown", () => {
    render(<ClientVersion version={null} status="unknown" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
