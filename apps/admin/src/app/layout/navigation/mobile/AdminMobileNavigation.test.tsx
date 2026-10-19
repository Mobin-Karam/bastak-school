import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ThemeProvider } from "../../../../shared/theme/theme";
import { AdminMobileBottomNav } from "./AdminMobileNavigation";

const authState = vi.hoisted(() => ({
  activeRole: "TEACHER",
  capabilities: ["classes.read", "attendance.read", "schedule.read"],
}));

vi.mock("../../../../features/identity/auth", () => ({
  useAuth: () => authState,
}));
vi.mock("../../../../features/student-life/attendance/public", () => ({
  getAttendanceEncouragement: async () => ({ points: 12 }),
}));

describe("AdminMobileBottomNav", () => {
  afterEach(() => {
    cleanup();
    authState.activeRole = "TEACHER";
    authState.capabilities = ["classes.read", "attendance.read", "schedule.read"];
  });

  it("keeps only role-relevant primary destinations in the dock", () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AdminMobileBottomNav
              current={{ path: "", section: "خانه" } as never}
              selectedStudentId=""
              performance="enhanced"
            />
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "میز استاد" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "برنامه من" })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
    expect(screen.getByRole("button", { name: "همه مسیرهای مدیریت" })).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(container.querySelector("nav")).toHaveClass("backdrop-blur-md");
    expect(container.querySelector("nav")).not.toHaveClass("student-mobile-navigation");
  });

  it("opens an accessible capability-filtered navigation sheet", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AdminMobileBottomNav
              current={{ path: "", section: "خانه" } as never}
              selectedStudentId=""
              performance="reduced"
            />
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "همه مسیرهای مدیریت" }));
    expect(container.querySelector("nav")).not.toHaveClass("backdrop-blur-md");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("همه مسیرهای مدیریت");
    expect(screen.getByRole("link", { name: /برنامه هفتگی/ })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
    expect(screen.queryByRole("link", { name: "مدارس / سازمان‌ها" })).not.toBeInTheDocument();
  });

  it("puts student points and capability-filtered quick actions before full navigation", async () => {
    authState.activeRole = "STUDENT";
    authState.capabilities = ["attendance.self.read", "schedule.read"];
    const user = (await import("@testing-library/user-event")).default.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <ThemeProvider>
            <LocaleProvider>
              <AdminMobileBottomNav
                current={{ path: "", section: "خانه" } as never}
                selectedStudentId=""
                performance="reduced"
              />
            </LocaleProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "خانه من" })).toBeVisible();
    expect(screen.getByRole("button", { name: "همه مسیرهای مدیریت" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "همه مسیرهای مدیریت" }));
    expect(await screen.findByRole("link", { name: "امتیازهای من" })).toHaveTextContent("۱۲");
    expect(screen.getByRole("heading", { name: "دسترسی سریع" })).toBeVisible();
    expect(screen.getByRole("link", { name: "حضور من" })).toHaveAttribute(
      "href",
      "/admin/my-attendance",
    );
    expect(screen.getByRole("link", { name: "برنامه هفتگی" })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
  });
});
