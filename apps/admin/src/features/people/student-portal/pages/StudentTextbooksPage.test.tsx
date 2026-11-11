import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { StudentTextbooksPage } from "./StudentTextbooksPage";

const { getStudentTextbooks } = vi.hoisted(() => ({
  getStudentTextbooks: vi.fn(),
}));
const gradeAccess = vi.hoisted(() => ({ allowed: false }));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: (capability: string) => capability === "class_grades.self.read" && gradeAccess.allowed,
  }),
}));

vi.mock("../api/student-textbooks.api.ts", () => ({ getStudentTextbooks }));

describe("StudentTextbooksPage", () => {
  it("shows only the authenticated student's server-selected textbooks", async () => {
    gradeAccess.allowed = false;
    getStudentTextbooks.mockResolvedValue({
      schoolYear: "1405-1406",
      education: {
        gradeId: 12,
        gradeLabel: "پایه دوازدهم",
        educationTypeId: "theoretical",
        trackId: "experimental_sciences",
        trackLabel: "علوم تجربی",
      },
      books: [
        {
          id: "biology",
          titleFa: "زیست‌شناسی",
          titleEn: "Biology",
          category: "علوم تجربی",
          textbookCode: "C112",
        },
      ],
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <LocaleProvider>
            <StudentTextbooksPage />
          </LocaleProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "زیست‌شناسی" })).toBeVisible();
    expect(screen.getByText("پایه دوازدهم · علوم تجربی")).toBeVisible();
    expect(getStudentTextbooks).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: /نمره‌های من|My grades/ })).not.toBeInTheDocument();
  });
});
