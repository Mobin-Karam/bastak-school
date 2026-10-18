import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const logout = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({ status: "authenticated", logout }),
}));

import UnderConstruction from "./UnderConstruction";

describe("UnderConstruction", () => {
  it("lets a signed-in user sign out and return to the login flow", () => {
    render(<UnderConstruction endTime={Date.now() + 60_000} />);

    fireEvent.click(screen.getByRole("button", { name: "خروج از حساب و بازگشت به ورود" }));

    expect(logout).toHaveBeenCalledOnce();
  });
});
