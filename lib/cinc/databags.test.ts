// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";

const req = vi.fn();
vi.mock("./client", () => ({ cincRequest: (...a: unknown[]) => req(...a) }));

import { dataBags } from "./databags";

beforeEach(() => req.mockReset());

test("list hits GET /data", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.list("alice", "acme");
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "GET",
    path: "/data",
  });
});

test("createBag POSTs the name to /data", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.createBag("alice", "acme", "secrets");
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "POST",
    path: "/data",
    body: { name: "secrets" },
  });
});

test("removeBag DELETEs /data/<bag>", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.removeBag("alice", "acme", "secrets");
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "DELETE",
    path: "/data/secrets",
  });
});

test("getItem hits GET /data/<bag>/<id>", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.getItem("alice", "acme", "secrets", "db");
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "GET",
    path: "/data/secrets/db",
  });
});

test("putItem PUTs the body to /data/<bag>/<id>", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.putItem("alice", "acme", "secrets", "db", { id: "db", pw: "x" });
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "PUT",
    path: "/data/secrets/db",
    body: { id: "db", pw: "x" },
  });
});

test("createItem POSTs the body to /data/<bag>", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.createItem("alice", "acme", "secrets", { id: "db" });
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "POST",
    path: "/data/secrets",
    body: { id: "db" },
  });
});

test("removeItem DELETEs /data/<bag>/<id>", async () => {
  req.mockResolvedValueOnce({});
  await dataBags.removeItem("alice", "acme", "secrets", "db");
  expect(req).toHaveBeenCalledWith({
    user: "alice",
    org: "acme",
    method: "DELETE",
    path: "/data/secrets/db",
  });
});
