import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { Student } from "../../../../shared/types/domain";
import {
  DataTable,
  type DataTableColumn,
  type DataTableQuery,
} from "../../../../shared/ui/data-table";
import { Button } from "../../../../shared/ui/ui";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import {
  formatStudentLastSeen,
  getStudentProfileCompleteness,
  getStudentStatus,
  getStudentUsername,
  studentStatusCopy,
  type StudentClassOption,
  type StudentProfileFilter,
  type StudentSort,
  type StudentSortDirection,
  type StudentStatusFilter,
} from "./student-ui";
import { studentCopy } from "../model/student-locale";

export { getStudentStatus } from "./student-ui";
export type {
  StudentProfileFilter,
  StudentSort,
  StudentSortDirection,
  StudentStatusFilter,
} from "./student-ui";

const sortableFields: readonly StudentSort[] = [
  "name",
  "username",
  "grade",
  "lastSeen",
  "completeness",
];
const statusFields: readonly StudentStatusFilter[] = ["all", "active", "inactive", "archived"];

function StudentStatus({ student, language }: { student: Student; language: "fa" | "en" }) {
  const status = studentStatusCopy[getStudentStatus(student)];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}
    >
      {studentCopy[language][getStudentStatus(student)]}
    </span>
  );
}

function Completeness({ student, language }: { student: Student; language: "fa" | "en" }) {
  const value = getStudentProfileCompleteness(student);
  const copy = studentCopy[language];
  return (
    <div className="min-w-28">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{copy.profileCompletionShort}</span>
        <strong className="text-slate-700 dark:text-slate-200">
          {value.toLocaleString(language === "en" ? "en-US" : "fa-IR")}%
        </strong>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-label={copy.profileCompletionShort}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span
          className="block h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/** Controlled data-table surface for the Student directory; mutations remain feature-owned. */
export function StudentList({
  students,
  filteredTotal,
  page,
  pageSize,
  search,
  status,
  classId = "",
  classOptions = [],
  profileFilter,
  sort,
  sortDirection,
  onSearchChange,
  onStatusChange,
  onClassChange = () => undefined,
  onProfileFilterChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
  onSelect,
  directoryActions,
  loading = false,
  error = false,
  onRetry,
}: {
  students: Student[];
  filteredTotal: number;
  page: number;
  pageSize: number;
  search: string;
  status: StudentStatusFilter;
  classId?: string;
  classOptions?: StudentClassOption[];
  profileFilter: StudentProfileFilter;
  sort: StudentSort;
  sortDirection: StudentSortDirection;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StudentStatusFilter) => void;
  onClassChange?: (value: string) => void;
  onProfileFilterChange: (value: StudentProfileFilter) => void;
  onSortChange: (value: StudentSort, direction: StudentSortDirection) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onClearFilters: () => void;
  onSelect: (student: Student) => void;
  directoryActions?: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";
  const query: DataTableQuery = {
    search,
    filters: [
      ...(status === "all" ? [] : [{ id: "status", value: status }]),
      ...(classId ? [{ id: "classId", value: classId }] : []),
      ...(profileFilter === "incomplete" ? [{ id: "completeness", value: "incomplete" }] : []),
    ],
    sorting: [{ id: sort, desc: sortDirection === "desc" }],
    pagination: { pageIndex: Math.max(0, page - 1), pageSize },
  };
  const columns: DataTableColumn<Student>[] = [
    {
      id: "name",
      label: copy.students,
      value: (student) => student.name,
      primary: true,
      filter: { type: "text" },
      cell: (student) => (
        <div className="min-w-0">
          <strong className="block truncate text-ink">{student.name}</strong>
          <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
            {student.grade || copy.educationNotSet}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      label: language === "fa" ? "وضعیت حساب" : "Account status",
      value: (student) => getStudentStatus(student),
      sortable: false,
      cell: (student) => <StudentStatus student={student} language={language} />,
      filter: {
        type: "select",
        options: (["active", "inactive", "archived"] as const).map((value) => ({
          value,
          label: copy[value],
        })),
      },
    },
    {
      id: "username",
      label: copy.username,
      value: (student) => getStudentUsername(student),
      cell: (student) => (
        <span
          className="block max-w-44 truncate text-xs text-slate-600 dark:text-slate-300"
          dir="ltr"
        >
          {getStudentUsername(student) || copy.usernameNotSet}
        </span>
      ),
    },
    {
      id: "grade",
      label: copy.gradeAndMajor,
      value: (student) => [student.grade, student.major].filter(Boolean).join(" / "),
      cell: (student) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {[student.grade, student.major].filter(Boolean).join(" / ") || copy.educationNotSet}
        </span>
      ),
    },
    {
      id: "classId",
      label: copy.classFilter,
      value: (student) => student.classId || "",
      sortable: false,
      filter: {
        type: "select",
        options: classOptions.map((item) => ({ value: item.id, label: item.name })),
      },
      cell: (student) => student.className || "—",
    },
    {
      id: "guardians",
      label: language === "fa" ? "سرپرست‌ها" : "Guardians",
      value: (student) => student.guardians?.length || 0,
      sortable: false,
      cell: (student) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck size={14} className="text-brand" aria-hidden="true" />
          {(student.guardians?.length || 0).toLocaleString(locale)}
        </span>
      ),
    },
    {
      id: "completeness",
      label: copy.profileCompletionShort,
      value: (student) => getStudentProfileCompleteness(student),
      cell: (student) => <Completeness student={student} language={language} />,
      filter: { type: "select", options: [{ value: "incomplete", label: copy.profileIncomplete }] },
    },
    {
      id: "lastSeen",
      label: copy.lastActivity,
      value: (student) => student.last_seen_at || "",
      cell: (student) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {formatStudentLastSeen(student.last_seen_at, language)}
        </span>
      ),
    },
  ];
  function onQueryChange(next: DataTableQuery) {
    const filter = (id: string) => String(next.filters.find((item) => item.id === id)?.value ?? "");
    if (next.search !== search) onSearchChange(next.search);
    const nextStatus = filter("status") as StudentStatusFilter;
    if (nextStatus !== status)
      onStatusChange(statusFields.includes(nextStatus) ? nextStatus : "all");
    const nextClassId = filter("classId");
    if (nextClassId !== classId) onClassChange(nextClassId);
    const nextProfile = filter("completeness") === "incomplete" ? "incomplete" : "all";
    if (nextProfile !== profileFilter) onProfileFilterChange(nextProfile);
    const nextSort = next.sorting[0];
    if (nextSort && sortableFields.includes(nextSort.id as StudentSort)) {
      const direction = nextSort.desc ? "desc" : "asc";
      if (nextSort.id !== sort || direction !== sortDirection)
        onSortChange(nextSort.id as StudentSort, direction);
    }
    if (next.pagination.pageIndex !== page - 1) onPageChange(next.pagination.pageIndex + 1);
    if (next.pagination.pageSize !== pageSize) onPageSizeChange(next.pagination.pageSize);
  }
  return (
    <DataTable
      data={students}
      columns={columns}
      getRowId={(student) => student.id}
      label={copy.studentDirectory}
      language={language}
      loading={loading}
      error={error}
      errorMessage={copy.directoryLoadFailed}
      onRefresh={onRetry}
      onRowClick={onSelect}
      query={query}
      onQueryChange={onQueryChange}
      server={{ rowCount: filteredTotal }}
      preferenceKey="students-directory"
      toolbar={directoryActions}
      scrollRows
      className="min-[1200px]:h-full min-[1200px]:min-h-0"
      emptyAction={
        search || status !== "all" || profileFilter !== "all" || classId ? (
          <Button variant="soft" onClick={onClearFilters}>
            {copy.showAllStudents}
          </Button>
        ) : undefined
      }
    />
  );
}
