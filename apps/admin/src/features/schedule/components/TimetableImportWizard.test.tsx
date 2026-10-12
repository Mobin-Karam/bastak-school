import { LocaleProvider } from "../../../shared/ui/locale";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { TimetableWorkspace } from "@moshaver/api-contract";
import { TimetableImportWizard } from "./TimetableImportWizard";
const mocks = vi.hoisted(() => ({ preview: vi.fn(), commit: vi.fn() }));
vi.mock("../../auth", () => ({ useAuth: () => ({ can: () => false, canAny: () => false }) }));
vi.mock("../../../shared/ui/responsive-modal", () => ({
  ResponsiveModal: ({ children }: { children: React.ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));
vi.mock("../api/timetable.api", () => ({
  previewTimetableImport: mocks.preview,
  commitTimetableImport: mocks.commit,
}));
vi.mock("../../../shared/lib/spreadsheet-transfer", () => ({
  readSpreadsheetLayout: async () => [
    {
      name: "اصلی",
      rows: 4,
      columns: 4,
      cells: [
        [2, 2, "کلاس"],
        [2, 3, "زنگ اول"],
        [2, 4, "مدرس"],
        [3, 2, "ساعت"],
        [3, 3, "8:00-8:50"],
        [4, 1, "شنبه"],
        [4, 2, "اول"],
        [4, 3, "نحو"],
        [4, 4, "احمد کریمی"],
      ].map(([row, column, value]) => ({
        row,
        column,
        value,
        address: `${row}:${column}`,
        master: `${row}:${column}`,
        merged: false,
      })),
    },
  ],
}));
vi.mock("../../../shared/ui/notifications", () => ({ notify: vi.fn() }));
const workspace: TimetableWorkspace = {
  organizationId: "org",
  years: [],
  sections: [],
  locations: [],
  bells: [],
  lessons: [],
  overrides: [],
  holidays: [],
  availability: [],
  allocations: [],
  changes: [],
  conflicts: [],
  occurrences: [],
  versions: [
    {
      id: "version",
      termId: "term",
      revision: 0,
      effectiveOn: "2026-10-10",
      state: "DRAFT",
      name: "پیش‌نویس",
      publishedAt: null,
      reason: "ورود اکسل",
      createdAt: "2026-10-10T00:00:00Z",
    },
  ],
  terms: [
    { id: "term", name: "نیمسال", yearId: "year", startsOn: "2026-10-10", endsOn: "2026-12-31" },
  ],
  classes: [
    {
      id: "class",
      name: "اول",
      schoolYear: "1405-1406",
      gradeId: null,
      sectionId: null,
      books: [{ id: "course", name: "نحو", teacherId: "teacher", teacherName: "احمد کریمی" }],
    },
  ],
  teachers: [{ id: "teacher", name: "احمد کریمی" }],
  sessions: [],
  periods: [
    {
      id: "period",
      sessionId: "session",
      ordinal: 1,
      name: "زنگ اول",
      startTime: "08:00",
      endTime: "08:50",
    },
  ],
};
afterEach(cleanup);
beforeEach(() => {
  mocks.preview
    .mockReset()
    .mockResolvedValue({ valid: true, revision: 0, rows: [], conflicts: [] });
  mocks.commit.mockReset().mockResolvedValue({ imported: 1, revision: 1 });
});
describe("timetable import confirmation", () => {
  it("previews real relationship IDs before committing and retains mapping for another batch", async () => {
    const saved = vi.fn(),
      closed = vi.fn();
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LocaleProvider>
          <TimetableImportWizard
            workspace={workspace}
            versionId="version"
            open
            onClose={closed}
            onSaved={saved}
          />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    await userEvent.upload(
      screen.getByLabelText("فایل اکسل"),
      new File(["fixture"], "fixture.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    await userEvent.selectOptions(await screen.findByLabelText("کاربرگ"), "اصلی");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /تأیید ساختار و نگاشت/ }));
    await userEvent.click(
      screen.getByRole("button", { name: "پیشنهاد اتصال بر اساس نام دقیق و یکتا" }),
    );
    expect(mocks.commit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "بررسی نگاشت و تداخل" }));
    await screen.findByText("نگاشت معتبر؛ آماده ورود به پیش‌نویس");
    const expected = {
      source: "اصلی!4:3",
      lesson: {
        classroomId: "class",
        classBookId: "course",
        teacherId: "teacher",
        periodId: "period",
        weekday: 6,
        startTime: "08:00",
        endTime: "08:50",
        startsOn: "2026-10-10",
        endsOn: "2026-12-31",
        notes: "منبع: اصلی!4:3",
      },
    };
    expect(mocks.preview).toHaveBeenCalledWith("version", 0, "fixture.xlsx", "اصلی", [expected]);
    await userEvent.click(screen.getByRole("button", { name: "ورود تأییدشده به پیش‌نویس" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(mocks.commit).toHaveBeenCalledWith("version", 0, "fixture.xlsx", "اصلی", [expected]);
    expect(closed).not.toHaveBeenCalled();
    expect(screen.getByLabelText("کلاس منبع: اول")).toHaveValue("class");
    expect(screen.getByText(/^[۰0] درس انتخاب‌شده/)).toBeInTheDocument();
    expect(screen.queryByText("ورود تأییدشده به پیش‌نویس")).not.toBeInTheDocument();
  });
});
