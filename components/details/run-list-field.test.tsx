import { expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RunListField } from "./run-list-field";

const onChange = vi.fn();
beforeEach(() => onChange.mockClear());

const items = ["recipe[a]", "recipe[b]"];

test("appends a typed entry via onChange", async () => {
  render(<RunListField items={items} onChange={onChange} />);
  await userEvent.click(screen.getByLabelText("New run list entry"));
  await userEvent.paste("role[web]"); // paste: type() treats "[" as special
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(onChange).toHaveBeenCalledWith(["recipe[a]", "recipe[b]", "role[web]"]);
});

test("removes an entry via onChange", async () => {
  render(<RunListField items={items} onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Remove recipe[a]" }));
  expect(onChange).toHaveBeenCalledWith(["recipe[b]"]);
});

test("reorders entries via onChange", async () => {
  render(<RunListField items={items} onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Move recipe[b] up" }));
  expect(onChange).toHaveBeenCalledWith(["recipe[b]", "recipe[a]"]);
});

test("shows an empty state with no items", () => {
  render(<RunListField items={[]} onChange={onChange} />);
  expect(screen.getByText(/empty run list/i)).toBeInTheDocument();
});
