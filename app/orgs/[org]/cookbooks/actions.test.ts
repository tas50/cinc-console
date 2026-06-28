// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));

const { deleteCookbook, deleteCookbookVersion } = vi.hoisted(() => ({
  deleteCookbook: vi.fn(),
  deleteCookbookVersion: vi.fn(),
}));
vi.mock("@/lib/cinc/cookbooks", () => ({ deleteCookbook, deleteCookbookVersion }));

import {
  deleteCookbookAction,
  deleteCookbookVersionAction,
} from "./actions";

beforeEach(() => {
  deleteCookbook.mockReset();
  deleteCookbookVersion.mockReset();
  vi.mocked(revalidatePath).mockClear();
});

test("deletes a single version and revalidates", async () => {
  deleteCookbookVersion.mockResolvedValueOnce(undefined);
  await expect(deleteCookbookVersionAction("acme", "nginx", "1.2.0")).resolves.toEqual({
    ok: true,
  });
  expect(deleteCookbookVersion).toHaveBeenCalledWith("alice", "acme", "nginx", "1.2.0");
  expect(revalidatePath).toHaveBeenCalledWith("/orgs/acme/cookbooks", "layout");
});

test("deletes the whole cookbook", async () => {
  deleteCookbook.mockResolvedValueOnce(undefined);
  await expect(deleteCookbookAction("acme", "nginx")).resolves.toEqual({ ok: true });
  expect(deleteCookbook).toHaveBeenCalledWith("alice", "acme", "nginx");
});

test("maps 403 to forbidden and does not revalidate", async () => {
  deleteCookbook.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(deleteCookbookAction("acme", "nginx")).resolves.toEqual({
    error: "forbidden",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});
