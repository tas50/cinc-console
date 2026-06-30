import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DescriptionField } from "./description-field";

test("renders a labeled textarea seeded with the value", () => {
  render(<DescriptionField value="hello" onChange={vi.fn()} />);
  expect(screen.getByLabelText("Description")).toHaveValue("hello");
});

test("reports edits via onChange", async () => {
  const onChange = vi.fn();
  render(<DescriptionField value="" onChange={onChange} />);
  await userEvent.type(screen.getByLabelText("Description"), "x");
  expect(onChange).toHaveBeenCalledWith("x");
});
