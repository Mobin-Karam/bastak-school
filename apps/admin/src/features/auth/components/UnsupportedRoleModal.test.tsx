import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const logout = vi.fn().mockResolvedValue(undefined);

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ activeRole: "COUNSELOR", status: "authenticated", logout }),
}));

import { UnsupportedRoleModal } from "./UnsupportedRoleModal";

describe("UnsupportedRoleModal", () => {
  afterEach(() => {
    cleanup();
    logout.mockClear();
  });

  it("explains the delayed workspace and only offers logout", async () => {
    render(<UnsupportedRoleModal />);

    expect(screen.getByRole("dialog")).toHaveTextContent("نسخه نقش شما در راه است");
    expect(screen.getByRole("dialog")).toHaveTextContent("مشاور");
    expect(screen.queryByRole("button", { name: /بستن/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "خروج از حساب" }));
    expect(logout).toHaveBeenCalledOnce();
  });
});
