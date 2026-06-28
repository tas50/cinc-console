import { expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RunListEditor } from "./run-list-editor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const onSave = vi.fn(async () => ({ ok: true as const }));

beforeEach(() => onSave.mockClear());

const data = { name: "web01", run_list: ["recipe[a]", "recipe[b]"] };

test("adds an entry to the end and saves the new run list", async () => {
  render(<RunListEditor data={data} onSave={onSave} />);
  // paste, not type: userEvent.type treats "[" as special key syntax.
  await userEvent.click(screen.getByLabelText("New run list entry"));
  await userEvent.paste("role[web]");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  await userEvent.click(screen.getByRole("button", { name: "Save run list" }));

  expect(onSave).toHaveBeenCalledTimes(1);
  const saved = JSON.parse(onSave.mock.calls[0][0]);
  expect(saved.run_list).toEqual(["recipe[a]", "recipe[b]", "role[web]"]);
  expect(saved.name).toBe("web01"); // other fields preserved
});

test("removes an individual entry", async () => {
  render(<RunListEditor data={data} onSave={onSave} />);
  await userEvent.click(screen.getByRole("button", { name: "Remove recipe[a]" }));
  await userEvent.click(screen.getByRole("button", { name: "Save run list" }));
  expect(JSON.parse(onSave.mock.calls[0][0]).run_list).toEqual(["recipe[b]"]);
});

test("reorders entries with the move controls", async () => {
  render(<RunListEditor data={data} onSave={onSave} />);
  await userEvent.click(screen.getByRole("button", { name: "Move recipe[b] up" }));
  await userEvent.click(screen.getByRole("button", { name: "Save run list" }));
  expect(JSON.parse(onSave.mock.calls[0][0]).run_list).toEqual([
    "recipe[b]",
    "recipe[a]",
  ]);
});

test("Save is disabled until there are changes", () => {
  render(<RunListEditor data={data} onSave={onSave} />);
  expect(screen.getByRole("button", { name: "Save run list" })).toBeDisabled();
});
