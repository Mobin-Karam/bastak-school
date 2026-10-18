import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { AdminMobileBottomNav } from "./AdminMobileNavigation";

vi.mock("../../../../features/auth", () => ({
  useAuth: () => ({
    activeRole: "TEACHER",
    capabilities: ["classes.read", "attendance.read", "schedule.read"],
  }),
}));

describe("AdminMobileBottomNav", () => {
  afterEach(cleanup);

  it("keeps only role-relevant primary destinations in the dock", () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <AdminMobileBottomNav
            current={{ path: "", section: "خانه" } as never}
            selectedStudentId=""
            performance="enhanced"
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "میز استاد" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "برنامه من" })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
    expect(screen.getByRole("button", { name: "همه مسیرهای مدیریت" })).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("opens an accessible capability-filtered navigation sheet", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    render(
      <MemoryRouter>
        <LocaleProvider>
          <AdminMobileBottomNav
            current={{ path: "", section: "خانه" } as never}
            selectedStudentId=""
            performance="reduced"
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "همه مسیرهای مدیریت" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName("همه مسیرهای مدیریت");
    expect(screen.getByRole("link", { name: /برنامه هفتگی/ })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
    expect(screen.queryByRole("link", { name: "مدارس / سازمان‌ها" })).not.toBeInTheDocument();
  });
});
