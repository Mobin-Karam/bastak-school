import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../../shared/theme/theme";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ModalProvider } from "../../../../shared/ui/modal";
import { AdminMainSidebar } from "./AdminMainSidebar";

const auth = {
  activeRole: "ADVISOR",
  capabilities: ["plans.read", "chat.read"],
};

vi.mock("../../../../features/identity/auth", () => ({ useAuth: () => auth }));

describe("AdminMainSidebar locale flow", () => {
  afterEach(() => window.localStorage.clear());

  it("uses the active English locale for the role portal title", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <ThemeProvider>
        <LocaleProvider>
          <ModalProvider>
            <MemoryRouter>
              <AdminMainSidebar
                collapsed={false}
                currentSection="خانه"
                currentPath=""
                selectedStudentId=""
                onToggle={() => undefined}
                onOpenSearch={() => undefined}
                direction="ltr"
              />
            </MemoryRouter>
          </ModalProvider>
        </LocaleProvider>
      </ThemeProvider>,
    );

    expect(screen.getAllByText("Advisor workspace").length).toBeGreaterThan(0);
    expect(screen.queryByText("پنل مشاور")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/admin");
  });
});
