import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";
import { LocaleProvider } from "../../../../shared/ui/locale";
import {
  latestTeacherSessionDate,
  TeacherClassAttendanceSheet,
} from "./TeacherClassAttendanceSheet";

const {
  getAttendanceParticipantsMock,
  listMyAttendanceAbsenceReviewsMock,
  bulkMarkAttendanceMock,
  createLegacyOccurrenceMock,
  getMock,
} = vi.hoisted(() => ({
  getAttendanceParticipantsMock: vi.fn(),
  listMyAttendanceAbsenceReviewsMock: vi.fn(),
  bulkMarkAttendanceMock: vi.fn(),
  createLegacyOccurrenceMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("../../../student-life/attendance/api/attendance.api.ts", () => ({
  getAttendanceParticipants: getAttendanceParticipantsMock,
  listMyAttendanceAbsenceReviews: listMyAttendanceAbsenceReviewsMock,
  bulkMarkAttendance: bulkMarkAttendanceMock,
}));

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    user: { id: "staff" },
    activeRole: "TEACHER",
    context: { activeOrganization: { id: "org-1" } },
  }),
}));

vi.mock("../../../../shared/api/api", () => ({
  api: {
    openEvents: () => ({ close: vi.fn() }),
    post: createLegacyOccurrenceMock,
    get: getMock,
  },
}));

vi.mock("../../../../shared/ui/notifications", () => ({ notify: vi.fn() }));

const entry: ScheduleEntry = {
  id: "schedule-1",
  title: "ریاضی دهم",
  weekday: 6,
  startTime: "08:00",
  endTime: "09:30",
  room: "۱۰۱",
  status: "ACTIVE",
  organization: { id: "org-1", name: "مدرسه" },
  classroom: { id: "class-1", name: "دهم الف" },
};

function renderSheet(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <TeacherClassAttendanceSheet entry={entry} open onOpenChange={onOpenChange} canManage />
      </QueryClientProvider>
    </LocaleProvider>,
  );
}

afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  createLegacyOccurrenceMock.mockResolvedValue({ id: "session-1", revision: 0, duplicate: false });
  getMock.mockResolvedValue(null);
});

describe("TeacherClassAttendanceSheet", () => {
  it("starts a lesson on its latest scheduled weekday instead of an arbitrary current day", () => {
    // Legacy weekdays are Saturday=0 through Friday=6.
    expect(latestTeacherSessionDate("2026-10-29", 6)).toBe("2026-10-23");
    expect(latestTeacherSessionDate("2026-10-30", 6)).toBe("2026-10-30");
  });

  it("uses the shared responsive drawer while retaining the roster query", async () => {
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی رضایی" }]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);

    renderSheet();

    await waitFor(() => {
      const scheduledDate = latestTeacherSessionDate(
        new Date().toISOString().slice(0, 10),
        entry.weekday,
      );
      expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class", "class-1", {
        scheduleEntryId: "schedule-1",
        date: scheduledDate,
      });
      expect(getMock).toHaveBeenCalledWith(
        expect.stringContaining(`date=${encodeURIComponent(scheduledDate)}`),
      );
    });

    const dialog = screen.getByRole("dialog", { name: "ریاضی دهم" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("08:00 تا 09:30 · ۱۰۱")).toBeInTheDocument();
    expect(await screen.findByText("علی رضایی")).toBeInTheDocument();
    expect(dialog).toHaveClass("max-w-xl");
    const present = within(screen.getByRole("group", { name: "وضعیت حضور علی رضایی" })).getByRole(
      "button",
      { name: "حاضر" },
    );
    expect(present).toHaveAttribute("aria-pressed", "true");
    expect(present).toHaveClass("bg-emerald-600");
  });
  it("hydrates saved marks from the saved roster before enabling revision", async () => {
    let resolveSavedAttendance!: (value: {
      roster: Array<{
        id: string;
        name: string;
        nationalCode: string | null;
        userId: string | null;
      }>;
      rosterComplete: boolean;
      records: Array<{ studentId: string; legacyStatus: "present" | "absent"; note: string }>;
    }) => void;
    getMock.mockImplementation((path: string) => {
      if (path.startsWith("/attendance/legacy-schedule-session?"))
        return Promise.resolve({ id: "session-1", revision: 3 });
      if (path === "/attendance/sessions/session-1")
        return new Promise((resolve) => {
          resolveSavedAttendance = resolve;
        });
      return Promise.resolve([]);
    });
    getAttendanceParticipantsMock.mockResolvedValue([
      { id: "new-student", name: "دانش‌آموز جدید" },
    ]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);

    renderSheet();

    expect(await screen.findByText("در حال بازیابی وضعیت ثبت‌شدهٔ جلسه…")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "بررسی و ثبت حضور و غیاب" }),
    ).not.toBeInTheDocument();

    resolveSavedAttendance({
      roster: [
        {
          id: "former-student",
          name: "دانش‌آموز سابق",
          nationalCode: null,
          userId: null,
        },
      ],
      rosterComplete: true,
      records: [{ studentId: "former-student", legacyStatus: "absent", note: "غیبت ثبت‌شده" }],
    });

    expect(screen.queryByText("دانش‌آموز جدید")).not.toBeInTheDocument();
    expect(screen.getByText("بازبینی ثبت‌شده")).toBeInTheDocument();
    expect(
      screen.getByText("این جلسه قبلاً ثبت شده است؛ پیش از ویرایش، بازبینی آن را تأیید کنید."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "وضعیت حضور دانش‌آموز سابق" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "فهرست دانش‌آموزان کلاس" })).getByText("غایب"),
    ).toBeInTheDocument();
    const revisionDrawer = await screen.findByRole("dialog", { name: "بازبینی حضور و غیاب" });
    expect(revisionDrawer).toBeInTheDocument();
    expect(within(revisionDrawer).getByText("خلاصهٔ ثبت قبلی")).toBeInTheDocument();
    expect(
      within(revisionDrawer).getByText(
        "اگر «فعلاً فقط مشاهده می‌کنم» را انتخاب کنید، هیچ تغییری در حضور و غیاب ثبت نمی‌شود.",
      ),
    ).toBeInTheDocument();
    expect(
      within(revisionDrawer).getByRole("list", { name: "خلاصه وضعیت ثبت قبلی" }),
    ).toHaveTextContent("۱غایب");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "فعلاً فقط مشاهده می‌کنم" }));
    expect(
      screen.queryByRole("group", { name: "وضعیت حضور دانش‌آموز سابق" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "سکه دانش‌آموز سابق" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ویرایش بازبینی" }));
    await user.click(screen.getByRole("button", { name: "ادامه و ویرایش" }));

    const group = await screen.findByRole("group", { name: "وضعیت حضور دانش‌آموز سابق" });
    expect(within(group).getByRole("button", { name: "غایب" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "بررسی و ثبت بازبینی" })).toBeEnabled();
  });
  it("keeps a cancelled occurrence readable but not editable", async () => {
    getMock.mockImplementation((path: string) => {
      if (path.startsWith("/attendance/legacy-schedule-session?"))
        return Promise.resolve({ id: "session-cancelled", revision: 1 });
      if (path === "/attendance/sessions/session-cancelled")
        return Promise.resolve({
          status: "cancelled",
          roster: [
            {
              id: "student-1",
              name: "علی رضایی",
              nationalCode: null,
              userId: null,
            },
          ],
          rosterComplete: true,
          records: [{ studentId: "student-1", legacyStatus: "present", note: "" }],
        });
      return Promise.resolve([]);
    });
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی رضایی" }]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);

    renderSheet();

    expect(await screen.findByText("علی رضایی")).toBeInTheDocument();
    expect(await screen.findByText("این جلسه لغو شده و فقط قابل مشاهده است.")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "وضعیت حضور علی رضایی" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "بررسی و ثبت حضور و غیاب" }),
    ).not.toBeInTheDocument();
  });
  it("preserves the selected mark and exact request when retrying a failed save", async () => {
    bulkMarkAttendanceMock.mockClear();
    bulkMarkAttendanceMock
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue({ sessionId: "session-1", count: 1 });
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی رضایی" }]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);
    const user = userEvent.setup();
    const group = await screen.findByRole("group", { name: "وضعیت حضور علی رضایی" });
    await user.click(within(group).getByRole("button", { name: "حاضر" }));
    await user.click(screen.getByRole("button", { name: "بررسی و ثبت حضور و غیاب" }));
    expect(bulkMarkAttendanceMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "تأیید و ثبت" })).toBeEnabled());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(within(group).getByRole("button", { name: "حاضر", hidden: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(bulkMarkAttendanceMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("مرحله ۲: بررسی و ثبت")).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(bulkMarkAttendanceMock.mock.calls[1][0]).toEqual(
      bulkMarkAttendanceMock.mock.calls[0][0],
    );
  });

  it("keeps the roster open when returning, then closes it after confirmed clearing", async () => {
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی رضایی" }]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);
    const user = userEvent.setup();

    await screen.findByRole("group", { name: "وضعیت حضور علی رضایی" });
    await user.click(screen.getByRole("button", { name: "بررسی و ثبت حضور و غیاب" }));
    await user.click(screen.getByRole("button", { name: "بازگشت" }));

    expect(screen.getByRole("dialog", { name: "ریاضی دهم" })).toBeInTheDocument();

    const group = screen.getByRole("group", { name: "وضعیت حضور علی رضایی" });
    await user.click(within(group).getByRole("button", { name: "غایب" }));
    await user.click(screen.getByRole("button", { name: "پاک کردن" }));

    expect(screen.getByRole("dialog", { name: "ریاضی دهم" })).toBeInTheDocument();
    expect(screen.getByText("تغییرات حضور و غیاب پاک می‌شوند")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "بازگشت و حفظ تغییرات" }));
    expect(screen.getByRole("dialog", { name: "ریاضی دهم" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "غایب" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "پاک کردن" }));
    await user.click(screen.getByRole("button", { name: "ادامه و پاک‌کردن" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a seven-day absence marker only for the affected student", async () => {
    getAttendanceParticipantsMock.mockResolvedValue([
      { id: "student-1", name: "علی رضایی" },
      { id: "student-2", name: "حسن رضایی" },
    ]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([
      {
        id: "absence-1",
        studentId: "student-1",
        studentName: "علی رضایی",
        status: "absent",
        sessionDate: new Date().toISOString(),
        reviewStatus: "pending",
        contextType: "class",
        contextId: "class-1",
      },
    ]);
    renderSheet();

    expect(await screen.findByText("۱ غیبت در ۷ روز")).toBeInTheDocument();
    expect(screen.getByText("حسن رضایی").closest("li")?.className).not.toContain("border-amber");
  });
});
