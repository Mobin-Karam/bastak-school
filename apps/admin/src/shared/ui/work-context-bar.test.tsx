import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "./locale";
import { WorkContextBar } from "./work-context-bar";

describe("WorkContextBar", () => {
  beforeEach(() => {
    window.localStorage.setItem("moshaver-admin-location", "iran");
  });

  afterEach(() => {
    window.localStorage.removeItem("moshaver-admin-location");
  });

  it("exposes the active role and organization from the Admin header", () => {
    render(
      <LocaleProvider>
        <WorkContextBar role="مشاور" organization="آکادمی راه روشن" multipleRoles />
      </LocaleProvider>,
    );

    const context = screen.getByLabelText("زمینه کاری فعال");
    expect(context).toHaveTextContent("مشاور");
    expect(context).toHaveTextContent("آکادمی راه روشن");
    expect(context).toHaveTextContent("برای تغییر نقش از منوی حساب استفاده کنید.");
  });

  it("links the active student context back to the student workspace", () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <WorkContextBar role="مشاور" studentId="student 1" showStudent />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "بازگشت به پرونده دانش‌آموز فعال" })).toHaveAttribute(
      "href",
      "/admin/students?studentId=student%201",
    );
  });

  it("uses English shell copy and logical dividers in the international workspace", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <MemoryRouter>
        <LocaleProvider>
          <WorkContextBar
            role="Advisor"
            organization="Northstar Academy"
            studentId="student-1"
            showStudent
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const context = screen.getByLabelText("Active work context");
    expect(context).toHaveAttribute("title", "Advisor — Northstar Academy");
    expect(screen.getByRole("link", { name: "Return to active student record" })).toHaveTextContent(
      "Active student",
    );
    expect(context.querySelector(".border-s")).toBeTruthy();
    expect(context.querySelector(".border-r")).toBeNull();
  });
});
