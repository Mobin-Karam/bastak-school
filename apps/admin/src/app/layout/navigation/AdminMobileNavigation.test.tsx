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

  it("gives teachers five direct personal destinations without an expanded menu", () => {
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
    expect(screen.getByRole("link", { name: "گفت‌وگو" })).toHaveAttribute(
      "href",
      "/admin/teacher-chat",
    );
    expect(screen.getByRole("link", { name: "پروفایل" })).toHaveAttribute(
      "href",
      "/admin/teacher-profile",
    );
    expect(screen.queryByRole("link", { name: "همه صفحه‌ها" })).not.toBeInTheDocument();
  });

  it("keeps all teacher destinations directly reachable in reduced-performance mode", () => {
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
    expect(screen.getByRole("link", { name: "تنظیمات" })).toHaveAttribute(
      "href",
      "/admin/settings",
    );
  });
});
