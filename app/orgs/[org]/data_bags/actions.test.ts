// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));

const { putItem, createItem, removeItem, createBag, removeBag } = vi.hoisted(
  () => ({
    putItem: vi.fn(),
    createItem: vi.fn(),
    removeItem: vi.fn(),
    createBag: vi.fn(),
    removeBag: vi.fn(),
  }),
);
vi.mock("@/lib/cinc/databags", () => ({
  dataBags: { putItem, createItem, removeItem, createBag, removeBag },
}));

import {
  saveItem,
  createItem as createItemAction,
  deleteBag,
  createBag as createBagAction,
} from "./actions";

beforeEach(() => {
  putItem.mockReset();
  createItem.mockReset();
  removeItem.mockReset();
  createBag.mockReset();
  removeBag.mockReset();
});

test("saveItem translates 403 into a forbidden result", async () => {
  putItem.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(
    saveItem("acme", "users", "alice", '{"id":"alice"}'),
  ).resolves.toEqual({ error: "forbidden" });
});

test("saveItem rejects invalid JSON without calling the server", async () => {
  await expect(
    saveItem("acme", "users", "alice", "{not json"),
  ).resolves.toEqual({ error: "invalid JSON" });
  expect(putItem).not.toHaveBeenCalled();
});

test("saveItem saves valid JSON", async () => {
  putItem.mockResolvedValueOnce({});
  await expect(
    saveItem("acme", "users", "alice", '{"id":"alice"}'),
  ).resolves.toEqual({ ok: true });
  expect(putItem).toHaveBeenCalledWith("alice", "acme", "users", "alice", {
    id: "alice",
  });
});

test("createItem injects the id", async () => {
  createItem.mockResolvedValueOnce({});
  await createItemAction("acme", "users", "bob", '{"role":"admin"}');
  expect(createItem).toHaveBeenCalledWith("alice", "acme", "users", {
    role: "admin",
    id: "bob",
  });
});

test("deleteBag calls removeBag", async () => {
  removeBag.mockResolvedValueOnce({});
  await expect(deleteBag("acme", "users")).resolves.toEqual({ ok: true });
  expect(removeBag).toHaveBeenCalledWith("alice", "acme", "users");
});

test("createBag creates the bag by name", async () => {
  createBag.mockResolvedValueOnce({});
  await expect(createBagAction("acme", "users")).resolves.toEqual({ ok: true });
  expect(createBag).toHaveBeenCalledWith("alice", "acme", "users");
});
