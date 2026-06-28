import { expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "./copy-button";

test("writes the value to the clipboard and confirms", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });

  render(<CopyButton value="recipe[web]" label="Copy JSON" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));

  expect(writeText).toHaveBeenCalledWith("recipe[web]");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument(),
  );
});
