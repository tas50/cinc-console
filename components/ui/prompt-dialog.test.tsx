import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptDialog } from "./prompt-dialog";

describe("PromptDialog", () => {
  function setup(props: Partial<Parameters<typeof PromptDialog>[0]> = {}) {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(
      <PromptDialog
        open
        title="Duplicate role"
        label="New name"
        confirmLabel="Duplicate"
        nameKind="role"
        onSubmit={onSubmit}
        onCancel={onCancel}
        {...props}
      />,
    );
    return { onSubmit, onCancel };
  }

  it("renders nothing when closed", () => {
    render(
      <PromptDialog
        open={false}
        title="Duplicate role"
        label="New name"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses the input on open", () => {
    setup();
    expect(screen.getByLabelText("New name")).toHaveFocus();
  });

  it("disables confirm until a name is entered", async () => {
    const user = userEvent.setup();
    setup();
    const confirm = screen.getByRole("button", { name: "Duplicate" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText("New name"), "copy-of-web");
    expect(confirm).toBeEnabled();
  });

  it("blocks invalid names with a validation message", async () => {
    const user = userEvent.setup();
    setup();
    // Roles reject dots; surface the rule and keep confirm disabled.
    await user.type(screen.getByLabelText("New name"), "bad.name");
    expect(screen.getByRole("alert")).toHaveTextContent(/no dots/i);
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
  });

  it("submits the entered name", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByLabelText("New name"), "copy-of-web");
    await user.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(onSubmit).toHaveBeenCalledWith("copy-of-web");
  });

  it("cancels on Escape", async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows a server error via an alert", () => {
    setup({ error: "name already exists" });
    expect(screen.getByRole("alert")).toHaveTextContent("name already exists");
  });
});
