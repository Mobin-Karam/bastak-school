import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

  it("opens the related capability-filtered pages on tap and closes on a second tap", () => {
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

    const education = screen.getByRole("link", { name: "کلاس‌ها و حضور" });
    fireEvent.click(education);

    const relatedPages = screen.getByRole("complementary", { name: "آموزش" });
    expect(relatedPages).toBeVisible();
    expect(within(relatedPages).getByRole("link", { name: /^کلاس‌های من/ })).toHaveAttribute(
      "href",
      "/admin/classes",
    );
    expect(within(relatedPages).getByRole("link", { name: /^حضور و غیاب/ })).toHaveAttribute(
      "href",
      "/admin/attendance",
    );

    fireEvent.click(education);
    expect(screen.queryByRole("complementary", { name: "آموزش" })).not.toBeInTheDocument();
  });

  it("closes the related-page panel when the user taps outside it", () => {
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

    fireEvent.click(screen.getByRole("link", { name: "کلاس‌ها و حضور" }));
    fireEvent.click(screen.getByRole("button", { name: "بستن منوی مرتبط" }));
    expect(screen.queryByRole("complementary", { name: "آموزش" })).not.toBeInTheDocument();
  });
});
