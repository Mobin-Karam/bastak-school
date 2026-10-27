import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Student } from "../../../../shared/types/domain";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { StudentDetail } from "./StudentDetail";
import { StudentEditor } from "./StudentEditor";
import { StudentList } from "./StudentList";
import { StudentOverview } from "./StudentOverview";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { emptyStudentForm } from "../model/student-form";

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
        filteredTotal={1}
        page={1}
        pageSize={25}
        search=""
        status="all"
        profileFilter="all"
        sort="name"
        sortDirection="asc"
        onSearchChange={vi.fn()}
        onSortChange={vi.fn()}
        onStatusChange={onStatusChange}
        onProfileFilterChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onClearFilters={vi.fn()}
        onSelect={onSelect}
      />,
    );

    const directory = screen.getByRole("region", { name: "فهرست دانش‌آموزان" });
    expect(directory).toHaveAttribute("data-scroll-rows", "true");
    expect(container.querySelector(".data-table-workspace__rows")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    const studentRow = screen.getByRole("row", { name: /دانش‌آموز نمونه/ });
    expect(studentRow).toBeInTheDocument();
    fireEvent.click(studentRow);
    expect(onSelect).toHaveBeenCalledWith(student);
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("shows the complete student form in one drawer flow without step navigation", () => {
    render(
      withQueryClient(
        <LocaleProvider>
          <StudentEditor
            mode="create"
            form={emptyStudentForm()}
            setField={vi.fn()}
            onSave={vi.fn()}
            onReset={vi.fn()}
            busy={false}
            dirty={false}
            saveDirty={false}
          />
        </LocaleProvider>,
      ),
    );

    expect(screen.getByText("مشخصات ثبت‌نام")).toBeVisible();
    expect(screen.getByText("حساب سرپرست‌ها")).toBeVisible();
    expect(screen.getByText("وضعیت تحصیلی")).toBeVisible();
    expect(screen.queryByLabelText("مراحل پرونده دانش‌آموز")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ساخت دانش‌آموز" })).toBeDisabled();
    expect(screen.getByText(/بررسی اولیه هم‌زمان با ورود اطلاعات/)).toBeVisible();
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
      container.querySelector('img[src="/images/coin/Ornate%20Gold%20Kaaba%20Medallion.png"]'),
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
          filteredTotal={1250}
          page={2}
          pageSize={25}
          search=""
          status="all"
          profileFilter="all"
          sort="name"
          sortDirection="asc"
          onSearchChange={vi.fn()}
          onSortChange={vi.fn()}
          onStatusChange={vi.fn()}
          onProfileFilterChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onClearFilters={vi.fn()}
          onSelect={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByPlaceholderText("Search records…")).toBeVisible();
    expect(screen.getByRole("region", { name: "Student directory" })).toBeVisible();
    expect(screen.getAllByText(student.name)).not.toHaveLength(0);
    expect(screen.getByText("1,250 records")).toBeVisible();
    expect(screen.getByText("Rows per page")).toBeVisible();
    expect(screen.getByRole("button", { name: /Previous/ })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
