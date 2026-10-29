import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../../shared/theme/theme";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ModalProvider } from "../../../../shared/ui/modal";
import { AdminMainSidebar } from "./AdminMainSidebar";

const auth = {
  activeRole: "ADVISOR",
  capabilities: ["plans.read", "chat.read"],
  can: () => false,
};

vi.mock("../../../../features/identity/auth", () => ({ useAuth: () => auth }));
const notifications = { unread: 0 };
vi.mock("../../../../features/communications/notifications", () => ({
  useAdminNotifications: () => notifications,
}));

describe("AdminMainSidebar locale flow", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    auth.activeRole = "ADVISOR";
    auth.can = () => false;
    notifications.unread = 0;
  });

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

  it("shows a Principal-only unread inbox cue above the page controls", () => {
    auth.activeRole = "PRINCIPAL";
    auth.can = (capability) => capability === "announcements.read";
    notifications.unread = 3;

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
                direction="rtl"
              />
            </MemoryRouter>
          </ModalProvider>
        </LocaleProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("link", { name: /اعلان خوانده‌نشده برای بررسی دارید/ }),
    ).toHaveAttribute("href", "/admin/communication/notifications");
    expect(screen.getByText("صندوق بررسی مدیر")).toBeInTheDocument();
  });

  it("does not show the inbox cue for another active role", () => {
    auth.activeRole = "ADVISOR";
    auth.can = () => true;
    notifications.unread = 3;

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
                direction="rtl"
              />
            </MemoryRouter>
          </ModalProvider>
        </LocaleProvider>
      </ThemeProvider>,
    );

    expect(screen.queryByText("صندوق بررسی مدیر")).not.toBeInTheDocument();
  });
});
