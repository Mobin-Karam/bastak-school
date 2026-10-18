import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { StudentWorkflowActions } from "./StudentWorkflowActions";

describe("StudentWorkflowActions", () => {
  beforeEach(() => {
    window.localStorage.setItem("moshaver-admin-location", "iran");
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("explains the next student-specific workspace and preserves student context in each link", () => {
    render(
      <MemoryRouter>
        <StudentWorkflowActions
          studentId="student-1"
          capabilities={["plans.read", "learning.read", "reports.read"]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "ادامه کار با این دانش‌آموز" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /برنامه‌ریزی/ })).toHaveAttribute(
      "href",
      "/admin/planner?studentId=student-1",
    );
    expect(screen.getByRole("link", { name: /گزارش پیشرفت/ })).toHaveAttribute(
      "href",
      "/admin/reports?studentId=student-1",
    );
    expect(screen.queryByRole("link", { name: /آزمون‌ها/ })).not.toBeInTheDocument();
  });

  it("uses the active English locale for action labels and accessible descriptions", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <MemoryRouter>
          <StudentWorkflowActions studentId="student-1" capabilities={["plans.read"]} />
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Continue with this student" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Planning: Review this student/ })).toHaveAttribute(
      "href",
      "/admin/planner?studentId=student-1",
    );
  });
});
