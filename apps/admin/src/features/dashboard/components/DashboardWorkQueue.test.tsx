import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { DashboardWorkQueue } from "./DashboardWorkQueue";

describe("DashboardWorkQueue", () => {
  it("presents a capability-authorized item as an English LTR deep link", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
        <MemoryRouter>
          <DashboardWorkQueue
            items={[
              {
                id: "recovery:1",
                type: "recovery",
                priority: "urgent",
                status: "open",
                title: "Recovery request",
                description: "A plan recovery request needs a decision.",
                deepLink: "/admin/follow-up",
                dueAt: "2026-10-05",
                createdAt: "2026-10-04T10:00:00.000Z",
              },
            ]}
            loading={false}
            error={false}
            onRetry={vi.fn()}
          />
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Operational priorities" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Open work item/i })).toHaveAttribute(
      "href",
      "/admin/follow-up",
    );
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
