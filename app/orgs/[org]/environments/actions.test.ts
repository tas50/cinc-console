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

import { saveEnvironment, createEnvironment, deleteEnvironment } from "./actions";

beforeEach(() => {
  update.mockReset();
  create.mockReset();
  remove.mockReset();
});

test("saveEnvironment translates 403 into a forbidden result", async () => {
  update.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(saveEnvironment("acme", "prod", '{"name":"prod"}')).resolves.toEqual({
    error: "forbidden",
  });
});

test("saveEnvironment rejects invalid JSON without calling the server", async () => {
  await expect(saveEnvironment("acme", "prod", "{not json")).resolves.toEqual({
    error: "invalid JSON",
  });
  expect(update).not.toHaveBeenCalled();
});

test("saveEnvironment saves valid JSON", async () => {
  update.mockResolvedValueOnce({});
  await expect(saveEnvironment("acme", "prod", '{"name":"prod"}')).resolves.toEqual({
    ok: true,
  });
  expect(update).toHaveBeenCalledWith("alice", "acme", "prod", { name: "prod" });
});

test("createEnvironment injects the name", async () => {
  create.mockResolvedValueOnce({});
  await createEnvironment("acme", "staging", '{"description":""}');
  expect(create).toHaveBeenCalledWith("alice", "acme", {
    description: "",
    name: "staging",
  });
});

test("deleteEnvironment removes by name", async () => {
  remove.mockResolvedValueOnce({});
  await expect(deleteEnvironment("acme", "prod")).resolves.toEqual({ ok: true });
  expect(remove).toHaveBeenCalledWith("alice", "acme", "prod");
});
