import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Student } from "../../../../shared/types/domain";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { StudentDetail } from "./StudentDetail";
import { StudentList } from "./StudentList";
import { StudentOverview } from "./StudentOverview";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    user: { id: "viewer" },
    activeRole: "PRINCIPAL",
    context: { activeOrganization: { id: "org" } },
    can: (capability: string) => authCapabilities.values.has(capability),
    canAny: (capabilities: string[]) =>
      capabilities.some((capability) => authCapabilities.values.has(capability)),
  }),
}));

const authCapabilities = vi.hoisted(() => ({
  values: new Set(["students.read", "attendance.review"]),
}));
const attendanceProfileMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../../../student-life/attendance/api/attendance-operations.api", () => ({
  getAttendanceProfile: attendanceProfileMock.get,
}));

const student: Student = {
  id: "student-1",
  name: "دانش‌آموز نمونه",
  username: "student1",
  grade: "دوازدهم",
  major: "تجربی",
  accountStatus: "active",
};

function withQueryClient(children: React.ReactNode) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

describe("student collection scroll flow", () => {
  beforeEach(() => {
    authCapabilities.values = new Set(["students.read", "attendance.review"]);
    attendanceProfileMock.get.mockResolvedValue({
      studentId: student.id,
      name: student.name,
      schoolName: "مدرسه نمونه",
      classNames: ["دوازدهم تجربی"],
      points: 42,
      attendanceRate: 95,
      attendanceCoverage: 100,
      totalSessions: 20,
      scopedToTeacherClasses: false,
      counts: { present: 18, absent: 1, late: 1, excused: 0 },
      records: [],
    });
  });
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("keeps the directory controls and pagination outside the scrolling rows", () => {
    const onStatusChange = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <StudentList
        students={[student]}
        total={1}
        filteredTotal={1}
        page={1}
        pageCount={1}
        pageSize={25}
        setPage={vi.fn()}
        setPageSize={vi.fn()}
        selectedId=""
        search=""
        setSearch={vi.fn()}
        status="all"
        counts={{ all: 1, active: 1, inactive: 0, archived: 0 }}
        incomplete={0}
        profileFilter="all"
        sort="name"
        sortDirection="asc"
        onSort={vi.fn()}
        onStatusChange={onStatusChange}
        onIncompleteToggle={vi.fn()}
        onClearFilters={vi.fn()}
        onSelect={onSelect}
      />,
    );

    expect(container.querySelector(".collection-toolbar")?.parentElement).toHaveClass("shrink-0");
    const directory = screen.getByRole("region", {
      name: "فهرست دانش‌آموزان، جدول قابل پیمایش افقی",
    });
    expect(directory).toHaveClass(
      "overflow-y-auto",
      "overscroll-y-contain",
      "[scrollbar-width:none]",
      "[&::-webkit-scrollbar]:hidden",
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("تعداد در صفحه")).toBeInTheDocument();
    expect(screen.getByLabelText("فیلتر سریع دانش‌آموزان")).toHaveTextContent("فعال");
    const studentRow = screen.getByRole("row", { name: /دانش‌آموز نمونه/ });
    expect(studentRow).toBeInTheDocument();
    fireEvent.click(studentRow);
    expect(onSelect).toHaveBeenCalledWith(student);
    fireEvent.click(screen.getByRole("button", { name: "فعال ۱" }));
    expect(onStatusChange).toHaveBeenCalledWith("active");
  });

  it("keeps the selected student's identity, navigation, and workflow actions visible above tab content", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onEdit = vi.fn();
    render(
      <StudentDetail
        student={student}
        tab="overview"
        onTabChange={vi.fn()}
        onBack={vi.fn()}
        onPrevious={onPrevious}
        onNext={onNext}
        onEdit={onEdit}
      >
        <div>محتوای بلند پرونده</div>
      </StudentDetail>,
    );

    const tabs = screen.getByRole("navigation", { name: "بخش‌های پرونده دانش‌آموز" });
    expect(tabs).toHaveClass("shrink-0");
    expect(tabs.nextElementSibling).toHaveClass(
      "min-[1200px]:flex-1",
      "min-[1200px]:overflow-y-auto",
    );
    expect(screen.getByText("محتوای بلند پرونده")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "دانش‌آموز قبلی" }));
    fireEvent.click(screen.getByRole("button", { name: "دانش‌آموز بعدی" }));
    fireEvent.click(screen.getByRole("button", { name: "ویرایش پروفایل" }));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("does not advertise profile editing when the current role cannot edit students", () => {
    render(
      withQueryClient(<StudentOverview student={student} onRetry={vi.fn()} onEdit={undefined} />),
    );

    expect(screen.queryByRole("button", { name: "ویرایش پروفایل" })).not.toBeInTheDocument();
  });

  it("shows linked guardian contact details in the student overview", () => {
    render(
      withQueryClient(
        <StudentOverview
          student={{
            ...student,
            guardians: [{ id: "guardian-1", name: "مادر نمونه", phoneNumber: "09120000000" }],
          }}
        />,
      ),
    );

    expect(screen.getByText("سرپرست‌های پیوندخورده")).toBeInTheDocument();
    expect(screen.getByText("مادر نمونه")).toBeInTheDocument();
    expect(screen.getByText("09120000000")).toBeInTheDocument();
  });

  it("shows the server-projected student identity and attendance summary", async () => {
    const { container } = render(
      withQueryClient(
        <StudentOverview
          student={student}
          profile={{
            ...student,
            identity: {
              firstName: "علی",
              lastName: "رضایی",
              fullName: "علی رضایی",
              nationalCode: "1234567890",
              phoneNumber: "09120000000",
              email: "ali@example.test",
              profilePhoto: "",
            },
            contact: { phoneNumber: "09120000000", email: "ali@example.test" },
            education: {
              learnerProfile: "school",
              independentType: null,
              learningLevel: "متوسطه",
              gradeId: 12,
              educationTypeId: "general",
              trackId: "science",
              grade: "دوازدهم",
              major: "تجربی",
              targetUniversity: "",
              targetField: "",
              targetRank: "",
              dailyCapacity: "",
            },
            attendanceSummary: { totalSessions: 20, present: 18, absent: 1, late: 1, excused: 0 },
            recentAttendance: [
              {
                id: "record-1",
                sessionId: "session-123456789",
                status: "present",
                sessionDate: "2026-10-20T08:00:00.000Z",
                contextType: "class",
                contextId: "class-1",
                organizationId: "org-1",
                recordedAt: "2026-10-20T08:10:00.000Z",
              },
            ],
          }}
        />,
      ),
    );

    expect(screen.getByRole("heading", { name: "علی رضایی" })).toBeVisible();
    expect(screen.getByRole("link", { name: /09120000000/ })).toHaveAttribute(
      "href",
      "tel:09120000000",
    );
    expect(screen.getByRole("link", { name: /ali@example.test/ })).toHaveAttribute(
      "href",
      "mailto:ali@example.test",
    );
    expect(screen.getByLabelText("خلاصه حضور دانش‌آموز")).toHaveTextContent("۹۵٪");
    expect(screen.getByLabelText("رفتار حضور و غیاب")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "آخرین وضعیت‌های ثبت‌شده حضور دانش‌آموز" }),
    ).toHaveTextContent("حاضر");
    expect(await screen.findByText("۴۲")).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/images/mascots/zanin-coin.svg"]'),
    ).toBeInTheDocument();
  });

  it("does not render attendance insights when the viewer lacks attendance capabilities", () => {
    authCapabilities.values = new Set(["students.read"]);
    render(withQueryClient(<StudentOverview student={student} />));
    expect(screen.queryByLabelText("رفتار حضور و غیاب")).not.toBeInTheDocument();
  });

  it("uses English labels without exposing legacy academic-goal fields in the profile overview", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      withQueryClient(
        <LocaleProvider>
          <StudentOverview
            student={{
              ...student,
              targetUniversity: "Legacy university",
              targetField: "Legacy field",
              targetRank: "1500",
              dailyCapacity: "6 hours",
            }}
            onRetry={vi.fn()}
          />
        </LocaleProvider>,
      ),
    );

    expect(screen.getByRole("heading", { name: "Student overview" })).toBeInTheDocument();
    expect(screen.getByText("Record status")).toBeInTheDocument();
    expect(screen.getByLabelText("Profile completion")).toBeInTheDocument();
    expect(screen.queryByText("Target university")).not.toBeInTheDocument();
    expect(screen.queryByText("Target field")).not.toBeInTheDocument();
    expect(screen.queryByText("Target rank")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily capacity")).not.toBeInTheDocument();
    expect(screen.queryByText("Legacy university")).not.toBeInTheDocument();
    expect(screen.queryByText("Legacy field")).not.toBeInTheDocument();
    expect(screen.queryByText("1500")).not.toBeInTheDocument();
    expect(screen.queryByText("6 hours")).not.toBeInTheDocument();
  });

  it("localizes the student directory controls, rows, and pagination for English", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <StudentList
          students={[student]}
          total={1250}
          filteredTotal={1250}
          page={2}
          pageCount={50}
          pageSize={25}
          setPage={vi.fn()}
          setPageSize={vi.fn()}
          selectedId=""
          search=""
          setSearch={vi.fn()}
          status="all"
          counts={{ all: 1250, active: 1200, inactive: 30, archived: 20 }}
          incomplete={3}
          profileFilter="all"
          sort="name"
          sortDirection="asc"
          onSort={vi.fn()}
          onStatusChange={vi.fn()}
          onIncompleteToggle={vi.fn()}
          onClearFilters={vi.fn()}
          onSelect={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByPlaceholderText("Name, ID, username, grade, or track…")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Student directory, horizontally scrollable table" }),
    ).toBeVisible();
    expect(screen.getAllByText(student.name)).not.toHaveLength(0);
    expect(screen.getByText("Showing 26–50 of 1,250")).toBeVisible();
    expect(screen.getByText("Items per page")).toBeVisible();
    expect(screen.getByRole("button", { name: /Previous/ })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
