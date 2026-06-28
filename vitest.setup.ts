import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// revalidatePath/revalidateTag need a Next request/static-generation scope that
// doesn't exist under vitest; stub them so server actions can be unit-tested.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
