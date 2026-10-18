import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { AdminMobileBottomNav } from "./AdminMobileNavigation";

vi.mock("../../../features/auth", () => ({
  useAuth: () => ({
    activeRole: "TEACHER",
    capabilities: ["classes.read", "attendance.read", "schedule.read"],
  }),
}));

describe("AdminMobileBottomNav", () => {
  afterEach(cleanup);

  it("keeps a five-icon dock and reserves its last icon for more pages", () => {
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
    expect(screen.getByRole("link", { name: "همه مسیرهای مدیریت" })).toBeVisible();
    expect(screen.getAllByRole("link")[2]).toHaveAccessibleName("میز استاد");
  });

  it("keeps exactly four destination links plus the more-pages button in reduced mode", () => {
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

    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "همه مسیرهای مدیریت" })).toHaveAttribute(
      "href",
      "/admin/more",
    );
  });
});
