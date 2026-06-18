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

import { saveNode, createNode, deleteNode } from "./actions";

beforeEach(() => {
  update.mockReset();
  create.mockReset();
  remove.mockReset();
});

test("saveNode translates 403 into a forbidden result", async () => {
  update.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(saveNode("acme", "web01", '{"name":"web01"}')).resolves.toEqual({
    error: "forbidden",
  });
});

test("saveNode rejects invalid JSON without calling the server", async () => {
  await expect(saveNode("acme", "web01", "{not json")).resolves.toEqual({
    error: "invalid JSON",
  });
  expect(update).not.toHaveBeenCalled();
});

test("saveNode saves valid JSON", async () => {
  update.mockResolvedValueOnce({});
  await expect(saveNode("acme", "web01", '{"name":"web01"}')).resolves.toEqual({
    ok: true,
  });
  expect(update).toHaveBeenCalledWith("alice", "acme", "web01", { name: "web01" });
});

test("createNode injects the name", async () => {
  create.mockResolvedValueOnce({});
  await createNode("acme", "web02", '{"run_list":[]}');
  expect(create).toHaveBeenCalledWith("alice", "acme", {
    run_list: [],
    name: "web02",
  });
});

test("deleteNode removes by name", async () => {
  remove.mockResolvedValueOnce({});
  await expect(deleteNode("acme", "web01")).resolves.toEqual({ ok: true });
  expect(remove).toHaveBeenCalledWith("alice", "acme", "web01");
});
