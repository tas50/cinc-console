import { expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupMembersEditor } from "./group-members-editor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const onSave = vi.fn(async () => ({ ok: true as const }));
beforeEach(() => onSave.mockClear());

const data = {
  groupname: "admins",
  users: ["alice"],
  clients: [],
  groups: [],
  actors: ["alice"],
};

const enterEdit = () =>
  userEvent.click(screen.getByRole("button", { name: /edit members/i }));

test("only valid options can be added when options are provided", async () => {
  render(
    <GroupMembersEditor
      data={data}
      onSave={onSave}
      options={{ users: ["alice", "carol"] }}
    />,
  );
  await enterEdit();
  const field = screen.getByLabelText("Add to Users");
  const addUsers = () => screen.getAllByRole("button", { name: "Add" })[0];

  // An unknown user can't be added — Add stays disabled and a hint shows.
  await userEvent.type(field, "mallory");
  expect(addUsers()).toBeDisabled();
  expect(screen.getByText(/pick one from the list/i)).toBeInTheDocument();

  // A valid user can be added and saved.
  await userEvent.clear(field);
  await userEvent.type(field, "carol");
  expect(addUsers()).toBeEnabled();
  await userEvent.click(addUsers());
  await userEvent.click(screen.getByRole("button", { name: "Save members" }));
  expect(JSON.parse(onSave.mock.calls[0][0]).users).toEqual(["alice", "carol"]);
});

test("is view-only until Edit is chosen", () => {
  render(<GroupMembersEditor data={data} onSave={onSave} />);
  expect(screen.queryByLabelText("Add to Users")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /edit members/i })).toBeInTheDocument();
});

test("adds a user and saves, preserving other fields", async () => {
  render(<GroupMembersEditor data={data} onSave={onSave} />);
  await enterEdit();
  await userEvent.type(screen.getByLabelText("Add to Users"), "bob");
  await userEvent.click(
    screen.getAllByRole("button", { name: "Add" })[0], // Users is first
  );
  await userEvent.click(screen.getByRole("button", { name: "Save members" }));

  const saved = JSON.parse(onSave.mock.calls[0][0]);
  expect(saved.users).toEqual(["alice", "bob"]);
  expect(saved.groupname).toBe("admins"); // untouched
});

test("removes a member", async () => {
  render(<GroupMembersEditor data={data} onSave={onSave} />);
  await enterEdit();
  await userEvent.click(
    screen.getByRole("button", { name: "Remove alice from Users" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Save members" }));
  expect(JSON.parse(onSave.mock.calls[0][0]).users).toEqual([]);
});

test("Cancel reverts without saving", async () => {
  render(<GroupMembersEditor data={data} onSave={onSave} />);
  await enterEdit();
  await userEvent.click(
    screen.getByRole("button", { name: "Remove alice from Users" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("button", { name: /edit members/i })).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});
