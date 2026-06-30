import { expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CookbookConstraintsField,
  constraintsToVersions,
} from "./cookbook-constraints-field";

const onChange = vi.fn();
const onValidityChange = vi.fn();
beforeEach(() => {
  onChange.mockClear();
  onValidityChange.mockClear();
});

const data = { cookbook_versions: { nginx: ">= 1.0.0" } };

test("constraintsToVersions normalizes the stored map", () => {
  expect(constraintsToVersions(data)).toEqual({ nginx: ">= 1.0.0" });
  expect(constraintsToVersions({})).toEqual({});
});

test("seeds rows from the existing constraints", () => {
  render(
    <CookbookConstraintsField data={data} onChange={onChange} />,
  );
  expect(screen.getByLabelText("Cookbook")).toHaveValue("nginx");
  expect(screen.getByLabelText("Operator")).toHaveValue(">=");
  expect(screen.getByLabelText("Version")).toHaveValue("1.0.0");
});

test("reports an invalid version through onValidityChange and an alert", async () => {
  render(
    <CookbookConstraintsField
      data={data}
      onChange={onChange}
      onValidityChange={onValidityChange}
    />,
  );
  const version = screen.getByLabelText("Version");
  await userEvent.clear(version);
  await userEvent.type(version, "nope");
  expect(version).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent(/version like/i);
  expect(onValidityChange).toHaveBeenLastCalledWith(false);
});

test("emits the serialized map when a valid constraint is added", async () => {
  render(
    <CookbookConstraintsField
      data={data}
      onChange={onChange}
      onValidityChange={onValidityChange}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "+ Add constraint" }));
  await userEvent.type(screen.getAllByLabelText("Cookbook")[1], "apache2");
  await userEvent.selectOptions(screen.getAllByLabelText("Operator")[1], "~>");
  await userEvent.type(screen.getAllByLabelText("Version")[1], "2.1");

  expect(onChange).toHaveBeenLastCalledWith({
    nginx: ">= 1.0.0",
    apache2: "~> 2.1",
  });
  expect(onValidityChange).toHaveBeenLastCalledWith(true);
});
