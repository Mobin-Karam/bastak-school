import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Student } from "../../../../shared/types/domain";
import { LocaleProvider } from "../../../../shared/ui/locale";
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
    expect(tabs.nextElementSibling).toHaveClass(
      "min-[1200px]:flex-1",
      "min-[1200px]:overflow-y-auto",
    );
    expect(screen.getByText("محتوای بلند پرونده")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "دانش‌آموز جدید" })).toBeInTheDocument();
  });

  it("does not advertise profile editing when the current role cannot edit students", () => {
    render(<StudentOverview student={student} onRetry={vi.fn()} onEdit={undefined} />);

    expect(screen.queryByRole("button", { name: "ویرایش پروفایل" })).not.toBeInTheDocument();
  });

  it("uses English labels without exposing legacy academic-goal fields in the profile overview", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
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
    expect(screen.getByText(student.name)).toBeVisible();
    expect(screen.getByText("Showing 26–50 of 1,250")).toBeVisible();
    expect(screen.getByText("Items per page")).toBeVisible();
    expect(screen.getByRole("button", { name: /Previous/ })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
