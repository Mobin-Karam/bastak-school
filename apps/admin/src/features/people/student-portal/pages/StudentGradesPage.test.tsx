import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { getMyClassBookGrades } from "../../../academics/education/api/classes.api";
import { StudentGradesPage } from "./StudentGradesPage";

vi.mock("../../../academics/education/api/classes.api", () => ({ getMyClassBookGrades: vi.fn() }));

describe("student grades", () => {
  it("shows only the returned personal grades and no editing controls", async () => {
    vi.mocked(getMyClassBookGrades).mockResolvedValue([
      {
        id: "grade",
        studentId: "me",
        score: 17,
        note: "Good work",
        principalEdited: true,
        principalEditedAt: "2026-11-11",
        updatedAt: "2026-11-11",
        className: "Class A",
        schoolYear: "1405-1406",
        bookTitle: "Book A",
        sessionTitle: "Quiz",
        heldOn: "2026-11-11",
        teacherName: "Teacher A",
      },
    ]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LocaleProvider>
          <StudentGradesPage />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Book A")).toBeVisible();
    expect(screen.getByText("Good work")).toBeVisible();
    expect(screen.getByText(/Edited by principal|ویرایش‌شده توسط مدیر/)).toBeVisible();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save grade|ذخیره نمره/ })).not.toBeInTheDocument();
  });
});
