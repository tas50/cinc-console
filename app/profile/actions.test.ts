// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "anna" }));

const { getUser, putUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
  putUser: vi.fn(),
}));
vi.mock("@/lib/cinc/users", () => ({ getUser, putUser }));

import { saveProfile, changePassword } from "./actions";

beforeEach(() => {
  getUser.mockReset();
  putUser.mockReset();
  getUser.mockResolvedValue({ username: "anna", email: "old@x", public_key: "K" });
});

test("saveProfile merges edits onto the current record", async () => {
  putUser.mockResolvedValueOnce({});
  await expect(saveProfile({ email: "new@x" })).resolves.toEqual({ ok: true });
  expect(putUser).toHaveBeenCalledWith("anna", {
    username: "anna",
    email: "new@x",
    public_key: "K",
  });
});

test("changePassword merges a password onto the current record", async () => {
  putUser.mockResolvedValueOnce({});
  await expect(changePassword("s3cret!")).resolves.toEqual({ ok: true });
  expect(putUser).toHaveBeenCalledWith("anna", {
    username: "anna",
    email: "old@x",
    public_key: "K",
    password: "s3cret!",
  });
});

test("changePassword rejects a short password without calling the server", async () => {
  await expect(changePassword("123")).resolves.toEqual({
    error: "password must be at least 6 characters",
  });
  expect(putUser).not.toHaveBeenCalled();
});

test("saveProfile maps a 403 to forbidden", async () => {
  putUser.mockRejectedValueOnce(new CincError(403, "no"));
  await expect(saveProfile({ email: "x@y" })).resolves.toEqual({
    error: "forbidden",
  });
});
