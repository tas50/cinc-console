// @vitest-environment node
import { expect, test, vi } from "vitest";
import { CincError } from "./errors";

const req = vi.fn();
vi.mock("./client", () => ({ cincRequest: (...a: unknown[]) => req(...a) }));

import { authenticateUser } from "./auth";

test("returns the user (with display_name) on success", async () => {
  req.mockResolvedValueOnce({ user: { username: "alice", display_name: "Alice A" } });
  await expect(authenticateUser("alice", "pw")).resolves.toEqual({
    username: "alice",
    display_name: "Alice A",
  });
  expect(req).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "POST",
      path: "/authenticate_user",
      body: { username: "alice", password: "pw" },
    }),
  );
});

test("falls back to the username when the response has no user", async () => {
  req.mockResolvedValueOnce({ status: "linked" });
  await expect(authenticateUser("alice", "pw")).resolves.toEqual({
    username: "alice",
  });
});

test("returns null on 401", async () => {
  req.mockRejectedValueOnce(new CincError(401, "bad"));
  await expect(authenticateUser("alice", "bad")).resolves.toBeNull();
});

test("rethrows non-401 errors", async () => {
  req.mockRejectedValueOnce(new CincError(500, "boom"));
  await expect(authenticateUser("alice", "pw")).rejects.toMatchObject({
    status: 500,
  });
});
