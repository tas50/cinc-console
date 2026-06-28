// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));

const { deletePolicy, deletePolicyRevision } = vi.hoisted(() => ({
  deletePolicy: vi.fn(),
  deletePolicyRevision: vi.fn(),
}));
vi.mock("@/lib/cinc/policies", () => ({ deletePolicy, deletePolicyRevision }));

import { deletePolicyAction, deletePolicyRevisionAction } from "./actions";

beforeEach(() => {
  deletePolicy.mockReset();
  deletePolicyRevision.mockReset();
  vi.mocked(revalidatePath).mockClear();
});

test("deletes a single revision and revalidates", async () => {
  deletePolicyRevision.mockResolvedValueOnce(undefined);
  await expect(
    deletePolicyRevisionAction("acme", "web-app", "1.0.0"),
  ).resolves.toEqual({ ok: true });
  expect(deletePolicyRevision).toHaveBeenCalledWith("alice", "acme", "web-app", "1.0.0");
  expect(revalidatePath).toHaveBeenCalledWith("/orgs/acme/policies", "layout");
});

test("deletes the whole policy", async () => {
  deletePolicy.mockResolvedValueOnce(undefined);
  await expect(deletePolicyAction("acme", "web-app")).resolves.toEqual({ ok: true });
  expect(deletePolicy).toHaveBeenCalledWith("alice", "acme", "web-app");
});

test("maps 403 to forbidden and does not revalidate", async () => {
  deletePolicy.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(deletePolicyAction("acme", "web-app")).resolves.toEqual({
    error: "forbidden",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});
