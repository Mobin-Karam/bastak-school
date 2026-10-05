import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Student } from "../../../shared/types/domain";
import { LocaleProvider } from "../../../shared/ui/locale";
import { StudentDetail } from "./StudentDetail";
import { StudentList } from "./StudentList";
import { StudentOverview } from "./StudentOverview";

const student: Student = {
  id: "student-1",
  name: "دانش‌آموز نمونه",
  username: "student1",
  grade: "دوازدهم",
  major: "تجربی",
  accountStatus: "active",
};

describe("student collection scroll flow", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("keeps the directory controls and pagination outside the scrolling rows", () => {
    const onStatusChange = vi.fn();
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
        onSelect={vi.fn()}
      />,
    );

    expect(container.querySelector(".collection-toolbar")?.parentElement).toHaveClass("shrink-0");
    expect(
      screen.getByRole("region", { name: /فهرست دانش‌آموزان، جدول قابل پیمایش افقی/ }),
    ).toHaveClass("xl:overflow-y-auto", "xl:overscroll-contain");
    expect(screen.getByText("تعداد در صفحه")).toBeInTheDocument();
    expect(screen.getByLabelText("فیلتر سریع دانش‌آموزان")).toHaveTextContent("فعال");
    expect(screen.queryByLabelText("انتخاب ردیف student-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "فعال ۱" }));
    expect(onStatusChange).toHaveBeenCalledWith("active");
  });

  it("keeps the selected student's identity, navigation, and workflow actions visible above tab content", () => {
    render(
      <StudentDetail
        student={student}
        tab="overview"
        onTabChange={vi.fn()}
        onBack={vi.fn()}
        onCreate={vi.fn()}
      >
        <div>محتوای بلند پرونده</div>
      </StudentDetail>,
    );

    const tabs = screen.getByRole("navigation", { name: "بخش‌های پرونده دانش‌آموز" });
    expect(tabs).toHaveClass("shrink-0");
    expect(tabs.nextElementSibling).toHaveClass("xl:flex-1", "xl:overflow-y-auto");
    expect(screen.getByText("محتوای بلند پرونده")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "دانش‌آموز جدید" })).toBeInTheDocument();
  });

  it("lets an operator choose a card directory and restores that choice", () => {
    const props = {
      students: [student],
      total: 1,
      filteredTotal: 1,
      page: 1,
      pageCount: 1,
      pageSize: 25,
      setPage: vi.fn(),
      setPageSize: vi.fn(),
      selectedId: "",
      search: "",
      setSearch: vi.fn(),
      status: "all" as const,
      counts: { all: 1, active: 1, inactive: 0, archived: 0 },
      incomplete: 0,
      profileFilter: "all" as const,
      sort: "name" as const,
      sortDirection: "asc" as const,
      onSort: vi.fn(),
      onStatusChange: vi.fn(),
      onIncompleteToggle: vi.fn(),
      onClearFilters: vi.fn(),
      onSelect: vi.fn(),
    };
    const { unmount } = render(<StudentList {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "کارت‌ها" }));
    expect(screen.getByLabelText("فهرست دانش‌آموزان، نمای کارت")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /فهرست دانش‌آموزان، جدول قابل پیمایش افقی/ }),
    ).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem("moshaver-admin:collection-view:student-directory"),
    ).toContain('"layout":"cards"');

    unmount();
    render(<StudentList {...props} />);
    expect(screen.getByLabelText("فهرست دانش‌آموزان، نمای کارت")).toBeInTheDocument();
  });

  it("does not advertise profile editing when the current role cannot edit students", () => {
    render(<StudentOverview student={student} onRetry={vi.fn()} onEdit={undefined} />);

    expect(screen.queryByRole("button", { name: "ویرایش پروفایل" })).not.toBeInTheDocument();
  });

  it("uses English labels and numeric formatting for the profile overview", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <StudentOverview student={{ ...student, targetRank: "1500" }} onRetry={vi.fn()} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Student overview" })).toBeInTheDocument();
    expect(screen.getByText("Record status")).toBeInTheDocument();
    expect(screen.getByLabelText("Profile completion")).toBeInTheDocument();
  });

  it("localizes the student directory controls, table, and pagination for English", () => {
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

    expect(screen.getByPlaceholderText("Name, ID, username, grade, track, or goal…")).toBeVisible();
    expect(screen.getByLabelText("Student directory")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Student" })).toBeVisible();
    expect(screen.getByText("Showing 26–50 of 1,250")).toBeVisible();
    expect(screen.getByText("Items per page")).toBeVisible();
    expect(screen.getByRole("button", { name: /Previous/ })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
