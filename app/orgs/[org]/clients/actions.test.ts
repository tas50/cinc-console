// @vitest-environment node
import { expect, test, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { CincError } from "@/lib/cinc/errors";

vi.mock("@/lib/session", () => ({ requireUser: async () => "alice" }));

const { createClient, deleteClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  deleteClient: vi.fn(),
}));
vi.mock("@/lib/cinc/clients", () => ({ createClient, deleteClient }));

import { createClientAction, deleteClientAction } from "./actions";

beforeEach(() => {
  createClient.mockReset();
  deleteClient.mockReset();
  vi.mocked(revalidatePath).mockClear();
});

test("returns the one-time private key and revalidates the list", async () => {
  createClient.mockResolvedValueOnce({ name: "ci", privateKey: "PEMKEY" });
  await expect(createClientAction("acme", "ci")).resolves.toEqual({
    ok: true,
    privateKey: "PEMKEY",
  });
  expect(createClient).toHaveBeenCalledWith("alice", "acme", "ci");
  expect(revalidatePath).toHaveBeenCalledWith("/orgs/acme/clients", "layout");
});

test("maps a name conflict to a friendly error and does not revalidate", async () => {
  createClient.mockRejectedValueOnce(new CincError(409, "exists"));
  await expect(createClientAction("acme", "ci")).resolves.toEqual({
    error: "already exists",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});

test("maps 403 to forbidden", async () => {
  createClient.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(createClientAction("acme", "ci")).resolves.toEqual({
    error: "forbidden",
  });
});

test("deleteClientAction removes the client and revalidates", async () => {
  deleteClient.mockResolvedValueOnce(undefined);
  await expect(deleteClientAction("acme", "ci")).resolves.toEqual({ ok: true });
  expect(deleteClient).toHaveBeenCalledWith("alice", "acme", "ci");
  expect(revalidatePath).toHaveBeenCalledWith("/orgs/acme/clients", "layout");
});

test("deleteClientAction maps 403 to forbidden", async () => {
  deleteClient.mockRejectedValueOnce(new CincError(403, "denied"));
  await expect(deleteClientAction("acme", "ci")).resolves.toEqual({
    error: "forbidden",
  });
});
