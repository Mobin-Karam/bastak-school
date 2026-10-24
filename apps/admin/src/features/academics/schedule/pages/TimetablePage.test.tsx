import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../../../../shared/theme/theme";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { saveTimetableConfig } from "../api/timetable.api";
import { TimetablePage } from "./TimetablePage";
import { timetableToday, timetableWeekStart } from "../lib/timetable-time";
afterEach(cleanup);
const fixtures = vi.hoisted(() => ({
  full: true,
  capabilities: [
    "schedule.read",
    "schedule.read.all",
    "schedule.create",
    "schedule.update",
    "schedule.delete",
  ],
  get: vi.fn(),
  report: vi.fn(),
  write: vi.fn(),
}));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    activeRole: fixtures.full ? "PRINCIPAL" : "STUDENT",
    context: { activeOrganization: { id: "org", name: "مدرسه" }, availableOrganizations: [] },
    can: (cap: string) => fixtures.capabilities.includes(cap),
    canAny: (caps: string[]) => caps.some((x) => fixtures.capabilities.includes(x)),
    setActiveOrganization: vi.fn(),
  }),
}));
vi.mock("../components/TimetableDateInput", () => ({
  TimetableDateInput: ({
    label,
    value,
    onChange,
    ...props
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      {...props}
      aria-label={label}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
vi.mock("../api/timetable.api.ts", () => ({
  getTimetable: fixtures.get,
  getTimetableAttendanceReport: fixtures.report,
  writeTimetableLesson: fixtures.write,
  previewTimetableLesson: async () => ({ conflicts: [] }),
  createTimetableVersion: vi.fn(),
  removeTimetableLesson: vi.fn(),
  publishTimetable: vi.fn(),
  overrideTimetable: vi.fn(),
  openTimetableAttendance: vi.fn(),
  saveTimetableConfig: vi.fn(),
  previewTimetableImport: vi.fn(),
  commitTimetableImport: vi.fn(),
}));
const today = timetableToday();
const week = timetableWeekStart(today);
const day = new Date(`${today}T12:00:00Z`).getUTCDay();
function data(state = "PUBLISHED") {
  const lesson = {
    id: "lesson",
    versionId: "version",
    classroomId: "class",
    classBookId: "book",
    teacherId: "teacher",
    periodId: "period",
    locationId: "room",
    weekday: day,
    startTime: "08:00",
    endTime: "08:50",
    startsOn: week,
    endsOn: "2026-12-31",
    title: "نحو",
    classroomName: "اول",
    teacherName: "استاد احمد",
    locationName: "اتاق یک",
    sectionId: null,
    gradeId: 1,
    periodName: "زنگ اول",
    sessionKind: "MORNING",
  };
  return {
    organizationId: "org",
    years: [
      {
        id: "year",
        name: "۱۴۰۵",
        organizationId: "org",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        active: true,
        timeZone: "Asia/Tehran",
      },
    ],
    terms: [
      {
        id: "term",
        yearId: "year",
        name: "نیم‌سال اول",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
      },
    ],
    sections: [],
    locations: [{ id: "room", name: "اتاق یک" }],
    bells: [],
    sessions: [{ id: "session", name: "صبح", kind: "MORNING" }],
    periods: [
      {
        id: "period",
        sessionId: "session",
        name: "زنگ اول",
        ordinal: 1,
        startTime: "08:00",
        endTime: "08:50",
      },
    ],
    versions: [
      {
        id: "version",
        name: "نسخه اول",
        termId: "term",
        state,
        revision: 1,
        effectiveOn: week,
        publishedAt: state === "DRAFT" ? null : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        reason: "",
      },
    ],
    lessons: [lesson],
    overrides: [],
    holidays: [],
    availability: [],
    allocations: [],
    changes: [],
    classes: [
      {
        id: "class",
        name: "اول",
        gradeId: 1,
        schoolYear: "1405",
        sectionId: null,
        books: [{ id: "book", name: "نحو", teacherId: "teacher", teacherName: "استاد احمد" }],
      },
    ],
    teachers: [{ id: "teacher", name: "استاد احمد" }],
    conflicts: [],
    occurrences: [
      {
        ...lesson,
        date: today,
        cancelled: false,
        changeReason: "",
        attendanceSessionId: null,
        startsAt: `${today}T04:30:00Z`,
        endsAt: `${today}T05:20:00Z`,
      },
    ],
  };
}
function mount() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <ThemeProvider>
          <LocaleProvider>
            <TimetablePage />
          </LocaleProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  fixtures.full = true;
  fixtures.capabilities = [
    "schedule.read",
    "schedule.read.all",
    "schedule.create",
    "schedule.update",
    "schedule.delete",
  ];
  fixtures.get.mockReset().mockResolvedValue(data());
  fixtures.report.mockReset().mockResolvedValue({
    startsOn: week,
    endsOn: week,
    planned: 1,
    cancelled: 0,
    attendanceOpened: 1,
    attendanceRecorded: 1,
    awaitingAttendance: 0,
    classes: [
      {
        classroomId: "class",
        classroomName: "اول",
        planned: 1,
        cancelled: 0,
        attendanceOpened: 1,
        attendanceRecorded: 1,
        awaitingAttendance: 0,
      },
    ],
    subjects: [
      {
        subjectId: "book",
        subjectName: "نحو",
        planned: 1,
        cancelled: 0,
        attendanceOpened: 1,
        attendanceRecorded: 1,
        awaitingAttendance: 0,
      },
    ],
  });
});
describe("responsive timetable workflows", () => {
  it("shows the management-only planned versus attendance report", async () => {
    mount();
    expect(await screen.findByText("پایش اجرای برنامه و حضور")).toBeVisible();
    expect(await screen.findByText("دارای ثبت حضور")).toBeVisible();
    expect(await screen.findByText("نحو: 1/1")).toBeVisible();
    expect(fixtures.report).toHaveBeenCalledWith("org", week, expect.any(String));
  });
  it("shows read-only published lessons and staff view filters", async () => {
    mount();
    expect(await screen.findByRole("heading", { name: "برنامه درسی" })).toBeVisible();
    expect(screen.getByRole("button", { name: "همه کلاس‌ها" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "افزودن درس" })).not.toBeInTheDocument();
    expect(screen.getAllByText("نحو").length).toBeGreaterThan(0);
  });
  it("opens import setup when no draft exists instead of disabling the button", async () => {
    fixtures.capabilities.push("schedule.import");
    const empty = { ...data(), versions: [], lessons: [], occurrences: [], terms: [] };
    fixtures.get.mockResolvedValue(empty);
    mount();
    await screen.findByRole("heading", { name: "برنامه درسی" });
    const button = screen.getByRole("button", { name: "ورود اکسل" });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(/هنوز پیش‌نویسی وجود ندارد/)).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "تنظیم سال، نیم‌سال و زنگ‌ها" }));
    expect(await screen.findByRole("heading", { name: "تنظیمات برنامه درسی" })).toBeVisible();
  });
  it("opens file selection after choosing an existing draft from import setup", async () => {
    fixtures.capabilities.push("schedule.import");
    const current = data();
    current.versions.push({
      ...current.versions[0],
      id: "draft-import",
      state: "DRAFT",
      name: "پیش‌نویس ورود",
    });
    fixtures.get.mockResolvedValue(current);
    mount();
    await screen.findByRole("heading", { name: "برنامه درسی" });
    await userEvent.click(screen.getByRole("button", { name: "ورود اکسل" }));
    await userEvent.click(await screen.findByRole("button", { name: "ورود به پیش‌نویس ورود" }));
    expect(await screen.findByLabelText("فایل اکسل")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "استفاده از فایل نمونه (داده ساختگی)" }),
    ).toBeEnabled();
  });
  it("guides an empty school directly to its first year form", async () => {
    fixtures.get.mockResolvedValue({
      ...data(),
      years: [],
      terms: [],
      versions: [],
      bells: [],
      sessions: [],
      periods: [],
      lessons: [],
      occurrences: [],
    });
    mount();
    expect(
      await screen.findByRole("heading", { name: "راه‌اندازی برنامه درسی، قدم‌به‌قدم" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("0 از 6 مرحله آماده است");
    expect(screen.queryByRole("button", { name: "همه کلاس‌ها" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "شروع مرحله: سال تحصیلی" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(/مرحله راه‌اندازی: سال تحصیلی/)).toBeVisible();
    expect(dialog.queryByLabelText("بخش تنظیمات")).not.toBeInTheDocument();
    expect(dialog.getByLabelText("از تاریخ")).toBeVisible();
  });
  it("advances the setup after a year is saved and server data is refreshed", async () => {
    const empty = {
      ...data(),
      years: [],
      terms: [],
      versions: [],
      bells: [],
      sessions: [],
      periods: [],
      lessons: [],
      occurrences: [],
    };
    fixtures.get.mockResolvedValue(empty);
    vi.mocked(saveTimetableConfig).mockResolvedValueOnce({});
    mount();
    await userEvent.click(await screen.findByRole("button", { name: "شروع مرحله: سال تحصیلی" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.type(dialog.getByLabelText("نام"), "۱۴۰۵");
    fireEvent.change(dialog.getByLabelText("از تاریخ"), { target: { value: "2026-01-01" } });
    fireEvent.change(dialog.getByLabelText("تا تاریخ"), { target: { value: "2026-12-31" } });
    fixtures.get.mockResolvedValue({ ...empty, years: data().years });
    await userEvent.click(dialog.getByRole("button", { name: "ذخیره و ادامه" }));
    expect(await screen.findByText(/مرحله راه‌اندازی: نیم‌سال/)).toBeVisible();
    expect(
      within(screen.getByRole("dialog")).getByRole("combobox", { name: "سال تحصیلی" }),
    ).toHaveTextContent("۱۴۰۵");
  });
  it("opens the responsive lesson form with the selected class and period context", async () => {
    fixtures.get.mockResolvedValue(data("DRAFT"));
    mount();
    await screen.findByRole("heading", { name: "برنامه درسی" });
    await userEvent.click(screen.getByRole("button", { name: "افزودن درس" }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(within(screen.getByRole("dialog")).getByLabelText("کلاس")).toBeVisible();
    expect(within(screen.getByRole("dialog")).getByLabelText("زنگ / نوبت")).toBeVisible();
  });
  it("loads the synthetic sample workbook and requires explicit block selection before mapping", async () => {
    fixtures.capabilities.push("schedule.import");
    fixtures.get.mockResolvedValue(data("DRAFT"));
    const buffer = readFileSync(resolve("public/timetable-example.xlsx"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(buffer));
    try {
      mount();
      await screen.findByRole("heading", { name: "برنامه درسی" });
      await userEvent.click(screen.getByRole("button", { name: "ورود اکسل" }));
      await userEvent.click(
        screen.getByRole("button", { name: "استفاده از فایل نمونه (داده ساختگی)" }),
      );
      const sheets = await screen.findByLabelText("کاربرگ", {}, { timeout: 15000 });
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("timetable-example.xlsx"));
      await userEvent.click(sheets);
      expect(screen.getAllByRole("option")).toHaveLength(6);
      await userEvent.click(screen.getByRole("option", { name: /اصلی/ }));
      const dialog = within(screen.getByRole("dialog"));
      const blocks = dialog.getAllByRole("checkbox");
      expect(blocks.length).toBeGreaterThanOrEqual(2);
      expect(blocks.every((x) => !(x as HTMLInputElement).checked)).toBe(true);
      const next = dialog.getByRole("button", { name: /تأیید ساختار و نگاشت/ });
      expect(next).toBeDisabled();
      await userEvent.click(blocks[0]);
      expect(next).toBeEnabled();
      await userEvent.click(next);
      expect(dialog.getByText("نگاشت کلاس‌ها، کتاب‌ها و استادان")).toBeVisible();
      expect(dialog.getAllByRole("combobox", { name: /کلاس/ }).length).toBeGreaterThan(0);
    } finally {
      fetchSpy.mockRestore();
    }
  }, 15000);
  it("gives students daily cards without draft controls or school-wide filters", async () => {
    fixtures.full = false;
    fixtures.capabilities = ["schedule.read"];
    mount();
    expect(await screen.findByText("درس جاری")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "روزهای هفته" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "تنظیمات" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "همه کلاس‌ها" })).not.toBeInTheDocument();
    expect(screen.getAllByText("استاد احمد · اتاق یک").length).toBeGreaterThan(0);
  });
  it("provides retry on a failed school-scoped request", async () => {
    fixtures.get.mockRejectedValueOnce(new Error("ارتباط قطع شد"));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("ارتباط قطع شد");
    await userEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
    await waitFor(() => expect(fixtures.get).toHaveBeenCalledTimes(2));
  });
});
