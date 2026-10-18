import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { LearningList } from "./LearningList";

describe("LearningList flow", () => {
  it("uses the shared list region as the only bounded vertical scroll owner", () => {
    const { container } = render(
      <LocaleProvider>
        <LearningList
          loading={false}
          items={[
            {
              id: "learning-1",
              studentId: "student-1",
              subject: "ریاضی",
              book: "",
              chapter: "",
              lesson: "",
              topic: "",
              title: "مرور تابع",
              note: "",
              hint: "",
              dueDate: "2030-01-01",
              intervalDays: 1,
              reviewCount: 0,
              mastery: 1,
              status: "pending",
            },
          ]}
          search=""
          filter="all"
          formatDate={(value) => String(value)}
          onSearchChange={vi.fn()}
          onFilterChange={vi.fn()}
          onHistory={vi.fn()}
        />
      </LocaleProvider>,
    );

    const region = screen.getByRole("region", { name: "منابع یادگیری" });
    expect(region).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(region.querySelector(".overflow-y-auto")).toBeNull();
    expect(screen.getByRole("button", { name: "تاریخچه مرور" })).toBeVisible();
    expect(container.querySelector("section")).toHaveClass("max-h-[calc(100dvh-22rem)]");
  });
});
