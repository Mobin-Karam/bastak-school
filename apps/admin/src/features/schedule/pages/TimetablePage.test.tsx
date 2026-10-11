import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../../../shared/theme/theme";
import { LocaleProvider } from "../../../shared/ui/locale";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  write: vi.fn(),
}));
vi.mock("../../auth", () => ({
  useAuth: () => ({
    activeRole: fixtures.full ? "PRINCIPAL" : "STUDENT",
    context: { activeOrganization: { id: "org", name: "مدرسه" }, availableOrganizations: [] },
    can: (cap: string) => fixtures.capabilities.includes(cap),
    canAny: (caps: string[]) => caps.some((x) => fixtures.capabilities.includes(x)),
    setActiveOrganization: vi.fn(),
  }),
}));
vi.mock("../api/timetable.api", () => ({
  getTimetable: fixtures.get,
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
});
describe("responsive timetable workflows", () => {
  it("shows read-only published lessons and staff view filters", async () => {
    mount();
    expect(await screen.findByRole("heading", { name: "برنامه درسی" })).toBeVisible();
    expect(screen.getByRole("button", { name: "همه کلاس‌ها" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "افزودن درس" })).not.toBeInTheDocument();
    expect(screen.getAllByText("نحو").length).toBeGreaterThan(0);
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
  it("loads the provided workbook and requires explicit block selection before mapping", async () => {
    fixtures.capabilities.push("schedule.import");
    fixtures.get.mockResolvedValue(data("DRAFT"));
    const buffer = readFileSync(resolve("public/مبین.xlsx"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(buffer));
    try {
      mount();
      await screen.findByRole("heading", { name: "برنامه درسی" });
      await userEvent.click(screen.getByRole("button", { name: "ورود اکسل" }));
      await userEvent.click(screen.getByRole("button", { name: "استفاده از فایل مبین.xlsx" }));
      const sheets = await screen.findByLabelText("کاربرگ");
      expect(within(sheets).getAllByRole("option")).toHaveLength(6);
      await userEvent.selectOptions(sheets, "اصلی ");
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
      expect(
        dialog
          .getAllByRole("combobox")
          .some((x) => within(x).queryByRole("option", { name: /انتخاب صریح کلاس/ })),
      ).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
  });
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
