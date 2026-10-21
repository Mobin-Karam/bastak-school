import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../shared/theme/theme";
import { LocaleProvider } from "../../../shared/ui/locale";
import { AdminAccountMenu } from "./AdminAccountMenu";

const { user } = vi.hoisted(() => ({
  user: { firstName: "علی", lastName: "رضایی", username: "09120000000", displayName: "" },
}));
vi.mock("../../../features/identity/auth", () => ({
  useAuth: () => ({
    user,
    activeRole: "PRINCIPAL",
    context: { roles: ["PRINCIPAL"], availableOrganizations: [] },
    logout: vi.fn(),
  }),
}));
vi.mock("../../../shared/ui/modal", () => ({ useModal: () => ({ confirm: vi.fn() }) }));
vi.mock("../../dev/DevBackendSwitcher", () => ({ DevBackendSwitcher: () => null }));

function renderAccount() {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <AdminAccountMenu />
      </LocaleProvider>
    </ThemeProvider>,
  );
}
afterEach(() => {
  cleanup();
  localStorage.clear();
});
beforeEach(() => {
  user.displayName = "";
});

describe("AdminAccountMenu identity", () => {
  it("shows the signed-in name beside the phone username and inside the account panel", () => {
    renderAccount();
    const trigger = screen.getByRole("button", { expanded: false });
    expect(within(trigger).getByText("علی رضایی")).toBeInTheDocument();
    expect(within(trigger).getByText("مدیر / مدیر مدرسه")).toBeInTheDocument();
    expect(within(trigger).getByText("09120000000")).toHaveAttribute("dir", "ltr");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("علی رضایی")).toHaveLength(2);
    expect(screen.getAllByText("09120000000")).toHaveLength(2);
  });
  it("prefers the account's display name without losing the username", () => {
    user.displayName = "نام نمایشی";
    renderAccount();
    expect(screen.getByText("نام نمایشی")).toBeInTheDocument();
    expect(screen.getByText("09120000000")).toBeInTheDocument();
  });
});
