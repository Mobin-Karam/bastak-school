import { UsersRound } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "../../shared/ui/locale";
import { localizedAdminCurrentNavigation } from "./admin-navigation";
import { AdminContextSidebar } from "./AdminContextSidebar";

describe("AdminContextSidebar LTR flow", () => {
  afterEach(() => window.localStorage.clear());

  it("keeps the localized Management context rail addressable from its canonical section", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
        <MemoryRouter>
          <AdminContextSidebar
            collapsed={false}
            mainCollapsed={true}
            current={localizedAdminCurrentNavigation("/admin/students", "en")}
            sourceSection="مدیریت"
            items={[{ path: "students", title: "My students", icon: UsersRound }]}
            unreadNotifications={0}
            selectedStudentId=""
            onToggle={() => undefined}
            direction="ltr"
          />
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByLabelText("Management section navigation")).toBeVisible();
    expect(screen.getByText("Management")).toBeVisible();
    expect(screen.getByRole("link", { name: "My students" })).toHaveAttribute(
      "href",
      "/admin/students",
    );
  });
});
