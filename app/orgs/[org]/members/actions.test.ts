// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));

const { invite, removeUser: removeUserFn, updateGroup, deleteGroupFn } =
  vi.hoisted(() => ({
    invite: vi.fn(),
    removeUser: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroupFn: vi.fn(),
  }));
vi.mock("@/lib/cinc/members", () => ({
  members: {
    invite,
    removeUser: removeUserFn,
    updateGroup,
    deleteGroup: deleteGroupFn,
  },
}));

import { inviteUser, removeUser, saveGroup, deleteGroup } from "./actions";

beforeEach(() => {
  invite.mockReset();
  removeUserFn.mockReset();
  updateGroup.mockReset();
  deleteGroupFn.mockReset();
});

test("inviteUser invites by username", async () => {
  invite.mockResolvedValueOnce({});
  await expect(inviteUser("acme", "bob")).resolves.toEqual({ ok: true });
  expect(invite).toHaveBeenCalledWith("alice", "acme", "bob");
});

test("removeUser translates 403 into a forbidden result", async () => {
  removeUserFn.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(removeUser("acme", "bob")).resolves.toEqual({
    error: "forbidden",
  });
});

test("saveGroup rejects invalid JSON without calling the server", async () => {
  await expect(saveGroup("acme", "admins", "{not json")).resolves.toEqual({
    error: "invalid JSON",
  });
  expect(updateGroup).not.toHaveBeenCalled();
});

test("saveGroup saves the parsed object", async () => {
  updateGroup.mockResolvedValueOnce({});
  await expect(
    saveGroup("acme", "admins", '{"users":["bob"]}'),
  ).resolves.toEqual({ ok: true });
  expect(updateGroup).toHaveBeenCalledWith("alice", "acme", "admins", {
    users: ["bob"],
  });
});

test("deleteGroup removes the group by name", async () => {
  deleteGroupFn.mockResolvedValueOnce({});
  await expect(deleteGroup("acme", "admins")).resolves.toEqual({ ok: true });
  expect(deleteGroupFn).toHaveBeenCalledWith("alice", "acme", "admins");
});

test("deleteGroup translates 403 into a forbidden result", async () => {
  deleteGroupFn.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(deleteGroup("acme", "admins")).resolves.toEqual({
    error: "forbidden",
  });
});
