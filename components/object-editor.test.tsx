import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ObjectEditor } from "./object-editor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("ObjectEditor", () => {
  const json = JSON.stringify({ run_list: ["recipe[x]"] }, null, 2);

  it("shows the curated details view first and toggles to JSON", async () => {
    const user = userEvent.setup();
    render(
      <ObjectEditor
        name="node1"
        initialJson={json}
        details={<p>Curated view</p>}
        backHref="/back"
        onSave={vi.fn()}
      />,
    );

    // Details view is shown by default; no Save and no textarea yet.
    expect(screen.getByText("Curated view")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();

    // Switch to the JSON escape hatch: textarea and Save appear.
    await user.click(screen.getByRole("button", { name: "Edit JSON" }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.queryByText("Curated view")).not.toBeInTheDocument();
  });

  it("labels the toggle 'View JSON' for read-only objects and hides Save", async () => {
    const user = userEvent.setup();
    render(
      <ObjectEditor
        name="cb"
        initialJson={json}
        details={<p>Curated view</p>}
        backHref="/back"
        readOnly
      />,
    );

    await user.click(screen.getByRole("button", { name: "View JSON" }));
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("renders a title icon to the left of the name when provided", () => {
    render(
      <ObjectEditor
        name="web01"
        titleIcon={<span data-testid="title-icon">icon</span>}
        initialJson={json}
        details={<p>Curated view</p>}
        backHref="/back"
      />,
    );
    expect(screen.getByTestId("title-icon")).toBeInTheDocument();
  });

  it("falls back to JSON-only when no details view is provided", () => {
    render(
      <ObjectEditor name="x" initialJson={json} backHref="/back" onSave={vi.fn()} />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /JSON/ })).not.toBeInTheDocument();
  });
});
