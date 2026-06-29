import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Control the URL the useSort hook reads, and capture what it writes. Hoisted so
// the vi.mock factory can reference it without a TDZ error.
const nav = vi.hoisted(() => {
  let search = new URLSearchParams();
  return {
    replace: vi.fn(),
    setSearch: (v: string) => {
      search = new URLSearchParams(v);
    },
    getSearch: () => search,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/orgs/acme/nodes",
  useSearchParams: () => nav.getSearch(),
}));

import { ResourceTable } from "./resource-table";

// The row links carry a decorative aria-hidden "→"; the accessible name is just
// the object name, which is what we sort on.
const linkNames = () =>
  screen.getAllByRole("link").map((l) => l.textContent?.replace("→", "").trim());

describe("ResourceTable sorting", () => {
  beforeEach(() => {
    nav.replace.mockClear();
    nav.setSearch("");
  });

  it("defaults to ascending by name", () => {
    render(<ResourceTable title="Nodes" names={["gamma", "alpha", "beta"]} basePath="/b" />);
    expect(linkNames()).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it("honors a descending sort from the URL", () => {
    nav.setSearch("sort=name.desc");
    render(<ResourceTable title="Nodes" names={["gamma", "alpha", "beta"]} basePath="/b" />);
    expect(linkNames()).toEqual([
      "gamma",
      "beta",
      "alpha",
    ]);
  });

  it("writes the flipped direction to the URL when toggled from the default", async () => {
    const user = userEvent.setup();
    render(<ResourceTable title="Nodes" names={["a", "b"]} basePath="/b" />);
    await user.click(screen.getByRole("button", { name: /sort by name/i }));
    expect(nav.replace).toHaveBeenCalledWith(
      "/orgs/acme/nodes?sort=name.desc",
      { scroll: false },
    );
  });

  it("drops the param when toggled back to the default sort", async () => {
    nav.setSearch("sort=name.desc");
    const user = userEvent.setup();
    render(<ResourceTable title="Nodes" names={["a", "b"]} basePath="/b" />);
    await user.click(screen.getByRole("button", { name: /sort by name/i }));
    // name.asc is the default, so the URL should clean up to no query string.
    expect(nav.replace).toHaveBeenCalledWith("/orgs/acme/nodes", {
      scroll: false,
    });
  });
});
