import { expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewObjectForm } from "./new-object-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const onCreate = vi.fn(async () => ({ ok: true as const }));
beforeEach(() => onCreate.mockClear());

const setup = () =>
  render(
    <NewObjectForm
      title="New role"
      backHref="/orgs/acme/roles"
      onCreate={onCreate}
      initialJson="{}"
      nameKind="role"
    />,
  );

const createButton = () => screen.getByRole("button", { name: /create/i });

test("blocks an invalid name with an inline error and a disabled Create", async () => {
  setup();
  await userEvent.type(screen.getByLabelText("Name"), "web.server"); // dot is invalid for roles
  expect(screen.getByRole("alert")).toHaveTextContent(/no dots/i);
  expect(createButton()).toBeDisabled();
  expect(onCreate).not.toHaveBeenCalled();
});

test("accepts a valid name and enables Create", async () => {
  setup();
  await userEvent.type(screen.getByLabelText("Name"), "web-server");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(createButton()).toBeEnabled();
});
