import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortableTh } from "./sortable";
import type { SortState } from "@/lib/sort";

function table(sort: SortState, onSort = vi.fn()) {
  return render(
    <table>
      <thead>
        <tr>
          <SortableTh label="Node" sortKey="node" sort={sort} onSort={onSort} />
          <SortableTh
            label="Last check-in"
            sortKey="lastSeen"
            sort={sort}
            onSort={onSort}
          />
        </tr>
      </thead>
    </table>,
  );
}

describe("SortableTh", () => {
  it("marks only the active column with aria-sort and shows its direction", () => {
    table({ key: "lastSeen", dir: "desc" });
    const headers = screen.getAllByRole("columnheader");
    const [node, lastSeen] = headers;
    expect(node).toHaveAttribute("aria-sort", "none");
    expect(lastSeen).toHaveAttribute("aria-sort", "descending");
  });

  it("toggles direction when the active column is clicked", async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    table({ key: "node", dir: "asc" }, onSort);
    await user.click(screen.getByRole("button", { name: /node/i }));
    expect(onSort).toHaveBeenCalledWith("node");
  });
});
