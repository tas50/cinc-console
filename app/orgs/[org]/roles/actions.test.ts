// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));

const { update, create, remove } = vi.hoisted(() => ({
  update: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/lib/cinc/resource", () => ({
  makeResource: () => ({ update, create, remove }),
}));

import { saveRole, createRole, deleteRole } from "./actions";

beforeEach(() => {
  update.mockReset();
  create.mockReset();
  remove.mockReset();
});

test("saveRole translates 403 into a forbidden result", async () => {
  update.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(saveRole("acme", "web01", '{"name":"web01"}')).resolves.toEqual({
    error: "forbidden",
  });
});

test("saveRole rejects invalid JSON without calling the server", async () => {
  await expect(saveRole("acme", "web01", "{not json")).resolves.toEqual({
    error: "invalid JSON",
  });
  expect(update).not.toHaveBeenCalled();
});

test("saveRole saves valid JSON", async () => {
  update.mockResolvedValueOnce({});
  await expect(saveRole("acme", "web01", '{"name":"web01"}')).resolves.toEqual({
    ok: true,
  });
  expect(update).toHaveBeenCalledWith("alice", "acme", "web01", { name: "web01" });
});

test("createRole injects the name", async () => {
  create.mockResolvedValueOnce({});
  await createRole("acme", "web02", '{"run_list":[]}');
  expect(create).toHaveBeenCalledWith("alice", "acme", {
    run_list: [],
    name: "web02",
  });
});

test("deleteRole removes by name", async () => {
  remove.mockResolvedValueOnce({});
  await expect(deleteRole("acme", "web01")).resolves.toEqual({ ok: true });
  expect(remove).toHaveBeenCalledWith("alice", "acme", "web01");
});
