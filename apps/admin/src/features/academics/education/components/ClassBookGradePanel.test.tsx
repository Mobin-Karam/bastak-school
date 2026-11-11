import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ClassBookGradePanel } from "./ClassBookGradePanel";
import {
  createClassBookGradeSession,
  getClassBookGrades,
  saveClassBookGrade,
} from "../api/classes.api";

const authority = vi.hoisted(() => ({ manage: true }));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: (capability: string) => capability === "class_grades.manage" && authority.manage,
  }),
}));
vi.mock("../api/classes.api", () => ({
  getClassBookGrades: vi.fn(),
  saveClassBookGrade: vi.fn(),
  deleteClassBookGrade: vi.fn(),
  createClassBookGradeSession: vi.fn(),
  updateClassBookGradeSession: vi.fn(),
  deleteClassBookGradeSession: vi.fn(),
  getClassBookAttendance: vi.fn(),
}));

const response = (principalEdited = false) => ({
  classBookId: "book-one",
  className: "Class A",
  bookTitle: "Book A",
  teacher: { id: "teacher-one", name: "Teacher A", username: "teacher" },
  students: [{ id: "student-one", name: "Student A" }],
  sessions: [
    {
      id: "session-one",
      title: "Quiz",
      heldOn: "2026-11-11",
      description: "",
      grades: [
        {
          id: "grade-one",
          studentId: "student-one",
          score: 15,
          note: "",
          principalEdited,
          principalEditedAt: principalEdited ? "2026-11-11" : null,
          updatedAt: "2026-11-11",
        },
      ],
    },
  ],
});
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <ClassBookGradePanel classBookId="book-one" />
      </LocaleProvider>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  authority.manage = true;
  vi.mocked(getClassBookGrades).mockReset().mockResolvedValue(response());
  vi.mocked(saveClassBookGrade).mockReset();
  vi.mocked(createClassBookGradeSession).mockReset();
});
afterEach(cleanup);

describe("Class book grade panel", () => {
  it("requires a named session before score entry and keeps creation errors visible", async () => {
    vi.mocked(getClassBookGrades).mockResolvedValue({ ...response(), sessions: [] });
    vi.mocked(createClassBookGradeSession).mockRejectedValue(new Error("failed"));
    const user = userEvent.setup();
    mount();
    await screen.findByText(/Create a dated session|ابتدا یک جلسه/);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /Session topic|موضوع جلسه/ }), "Quiz");
    await user.click(screen.getByRole("button", { name: /Create grade session|ساخت جلسه/ }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(createClassBookGradeSession).toHaveBeenCalledWith(
      "book-one",
      expect.objectContaining({ title: "Quiz" }),
    );
  });
  it("keeps the editor and error visible after a failed save, then refreshes on success", async () => {
    vi.mocked(saveClassBookGrade)
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce(response().sessions[0].grades[0]);
    const user = userEvent.setup();
    mount();
    await screen.findByText("Student A");
    const score = screen.getByRole("spinbutton", { name: /Score out of 20|نمره از ۲۰/ });
    await user.clear(score);
    await user.type(score, "17");
    await user.click(screen.getByRole("button", { name: /Save grade|ذخیره نمره/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: /Score out of 20|نمره از ۲۰/ })).toHaveValue(17);
    await user.click(screen.getByRole("button", { name: /Save grade|ذخیره نمره/ }));
    expect(saveClassBookGrade).toHaveBeenCalledWith("book-one", "session-one", {
      studentId: "student-one",
      score: 17,
      note: "",
    });
  });

  it("shows principal edits to a read-only REM without edit controls", async () => {
    authority.manage = false;
    vi.mocked(getClassBookGrades).mockResolvedValue(response(true));
    mount();
    expect(await screen.findByText(/Edited by principal|ویرایش‌شده توسط مدیر/)).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("has no automated accessibility violations in the grade editor", async () => {
    const view = mount();
    await screen.findByText("Student A");
    const result = await axe.run(view.container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });
});
