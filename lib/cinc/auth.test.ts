// @vitest-environment node
import { expect, test, vi } from "vitest";
import { CincError } from "./errors";

const req = vi.fn();
vi.mock("./client", () => ({ cincRequest: (...a: unknown[]) => req(...a) }));

import { authenticateUser } from "./auth";

test("returns true on success and signs as the user", async () => {
  req.mockResolvedValueOnce({ name: "alice" });
  await expect(authenticateUser("alice", "pw")).resolves.toBe(true);
  expect(req).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "POST",
      path: "/authenticate_user",
      body: { username: "alice", password: "pw" },
    }),
  );
});

test("returns false on 401", async () => {
  req.mockRejectedValueOnce(new CincError(401, "bad"));
  await expect(authenticateUser("alice", "bad")).resolves.toBe(false);
});

test("rethrows non-401 errors", async () => {
  req.mockRejectedValueOnce(new CincError(500, "boom"));
  await expect(authenticateUser("alice", "pw")).rejects.toMatchObject({
    status: 500,
  });
});
