import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

const noop = () => {};

test("renders nothing when closed", () => {
  const { container } = render(
    <ConfirmDialog open={false} title="t" onConfirm={noop} onCancel={noop} />,
  );
  expect(container).toBeEmptyDOMElement();
});

test("is a modal dialog and focuses the confirm button on open", () => {
  render(
    <ConfirmDialog
      open
      title="Delete web01?"
      confirmLabel="Delete"
      onConfirm={noop}
      onCancel={noop}
    />,
  );
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Delete" }),
  );
});

test("Escape cancels", async () => {
  const onCancel = vi.fn();
  render(<ConfirmDialog open title="t" onConfirm={noop} onCancel={onCancel} />);
  await userEvent.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledOnce();
});

test("the confirm button fires onConfirm", async () => {
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      title="t"
      confirmLabel="OK"
      onConfirm={onConfirm}
      onCancel={noop}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "OK" }));
  expect(onConfirm).toHaveBeenCalledOnce();
});
