import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { DashboardSchedule, dashboardScheduleItems } from "./DashboardSchedule";

describe("DashboardSchedule", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("uses authorized upcoming data, active locale, and only renders a supplied handoff", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    const data = {
      context: "ADVISOR",
      generatedAt: "2026-01-01T00:00:00.000Z",
      assignedStudents: 2,
      unreadConversations: 0,
      upcomingExams: [
        {
          id: "exam-1",
          title: "Mathematics assessment",
          subject: "Mathematics",
          startTime: "2026-01-03T10:00:00.000Z",
        },
      ],
    };

    render(
      <MemoryRouter>
        <LocaleProvider>
          <DashboardSchedule data={data} />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(dashboardScheduleItems(data)).toEqual([
      expect.objectContaining({ id: "exam-1", title: "Mathematics assessment" }),
    ]);
    expect(screen.getByRole("heading", { name: "Upcoming schedule" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Open schedule" })).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
