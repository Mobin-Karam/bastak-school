import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";
import { AdminMainSidebar } from "./AdminMainSidebar";

const auth = {
  activeRole: "ADVISOR",
  capabilities: ["plans.read", "chat.read"],
};

vi.mock("../../features/auth", () => ({ useAuth: () => auth }));

describe("AdminMainSidebar locale flow", () => {
  afterEach(() => window.localStorage.clear());

  it("uses the active English locale for the role portal title", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
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
      </LocaleProvider>,
    );

    expect(screen.getAllByText("Advisor workspace").length).toBeGreaterThan(1);
    expect(screen.queryByText("پنل مشاور")).not.toBeInTheDocument();
  });
});
