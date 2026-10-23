import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

import type { Student } from "../../../../shared/types/domain";
import { AdminDataTable } from "../../../../shared/ui/admin-data-table";
import { Button, Select } from "../../../../shared/ui/ui";
import { CollectionToolbar } from "../../../../shared/ui/collection-toolbar";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import {
  formatStudentLastSeen,
  getStudentProfileCompleteness,
  getStudentStatus,
  getStudentUsername,
  studentStatusCopy,
  type StudentProfileFilter,
  type StudentSort,
  type StudentSortDirection,
  type StudentStatusFilter,
} from "./student-ui";
import { StudentOverviewStats } from "./StudentOverviewStats";
import { studentCopy } from "../model/student-locale";

export { getStudentStatus } from "./student-ui";
export type {
  StudentProfileFilter,
  StudentSort,
  StudentSortDirection,
  StudentStatusFilter,
} from "./student-ui";

function StudentStatus({ student, language }: { student: Student; language: "fa" | "en" }) {
  const status = studentStatusCopy[getStudentStatus(student)];
  const copy = studentCopy[language];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}
    >
      {copy[getStudentStatus(student)]}
    </span>
  );
}

function Completeness({ student, language }: { student: Student; language: "fa" | "en" }) {
  const value = getStudentProfileCompleteness(student);
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{copy.profileCompletionShort}</span>
        <strong className="text-slate-700 dark:text-slate-200">
          {value.toLocaleString(locale)}%
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

export function StudentList({
  students,
  total,
  filteredTotal,
  page,
  pageCount,
  pageSize,
  setPage,
  setPageSize,
  selectedId,
  search,
  setSearch,
  status,
  counts,
  incomplete,
  profileFilter,
  sort,
  sortDirection,
  onSort,
  onStatusChange,
  onIncompleteToggle,
  onClearFilters,
  onSelect,
  directoryActions,
  loading = false,
  error = false,
  onRetry,
  creating = false,
}: {
  students: Student[];
  total: number;
  filteredTotal: number;
  page: number;
  pageCount: number;
  pageSize: number;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  selectedId: string;
  search: string;
  setSearch: (value: string) => void;
  status: StudentStatusFilter;
  counts: Record<StudentStatusFilter, number>;
  incomplete: number;
  profileFilter: StudentProfileFilter;
  sort: StudentSort;
  sortDirection: StudentSortDirection;
  onSort: (value: StudentSort) => void;
  onStatusChange: (value: StudentStatusFilter) => void;
  onIncompleteToggle: () => void;
  onClearFilters: () => void;
  onSelect: (student: Student) => void;
  directoryActions?: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  creating?: boolean;
}) {
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";
  const hasFilters = !!search.trim() || status !== "all" || profileFilter !== "all";
  const startItem = filteredTotal ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, filteredTotal);
  const statusLabel = status === "all" ? "" : copy[status];
  const itemSummary = copy.showingItems
    .replace("{start}", startItem.toLocaleString(locale))
    .replace("{end}", endItem.toLocaleString(locale))
    .replace("{total}", filteredTotal.toLocaleString(locale));

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] shadow-[var(--shadow-surface)] min-[1200px]:flex min-[1200px]:h-full min-[1200px]:min-h-0 min-[1200px]:flex-col">
      <div className="z-10 grid shrink-0 gap-3 border-b border-slate-200 bg-[rgb(var(--surface-card))] p-3 sm:p-4 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <UsersRound size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-ink">{copy.students}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {language === "fa"
                ? "جست‌وجو، بررسی پرونده و پیگیری وضعیت حساب از یک فضای کاری"
                : "Search, review records, and manage account status in one workspace."}
            </p>
          </div>
        </div>
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder={copy.searchStudents}
          resultLabel={
            <span className="inline-flex items-center gap-1.5">
              <UsersRound size={14} />
              {filteredTotal.toLocaleString(locale)} {copy.results}
            </span>
          }
          onClear={hasFilters ? onClearFilters : undefined}
          filters={
            status !== "all" || profileFilter === "incomplete" ? (
              <>
                {status !== "all" ? (
                  <span className="whitespace-nowrap px-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {copy.statusFilter}: {statusLabel}
                  </span>
                ) : null}
                {profileFilter === "incomplete" ? (
                  <span className="whitespace-nowrap px-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {copy.profileIncomplete}
                  </span>
                ) : null}
              </>
            ) : undefined
          }
          actions={directoryActions}
        />
        <StudentOverviewStats
          counts={counts}
          status={status}
          onStatusChange={onStatusChange}
          incomplete={incomplete}
          incompleteOnly={profileFilter === "incomplete"}
          onIncompleteToggle={onIncompleteToggle}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <label className="flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="shrink-0">{language === "fa" ? "مرتب‌سازی" : "Sort"}</span>
            <Select
              aria-label={language === "fa" ? "مرتب‌سازی فهرست طلبه‌ها" : "Sort student directory"}
              className="h-9 min-w-32 text-xs"
              value={sort}
              onChange={(event) => onSort(event.target.value as StudentSort)}
            >
              <option value="name">{copy.students}</option>
              <option value="username">{language === "fa" ? "نام کاربری" : "Username"}</option>
              <option value="grade">{copy.gradeAndMajor}</option>
              <option value="lastSeen">{copy.lastActivity}</option>
              <option value="completeness">{copy.profileCompletionShort}</option>
            </Select>
          </label>
          <Button variant="soft" className="h-9 px-3 text-xs" onClick={() => onSort(sort)}>
            {sortDirection === "asc"
              ? language === "fa"
                ? "صعودی"
                : "Ascending"
              : language === "fa"
                ? "نزولی"
                : "Descending"}
          </Button>
        </div>
      </div>
      <div className="z-[1] flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[rgb(var(--surface-card))] px-3 py-2.5 text-[11px] text-slate-500 sm:px-4 dark:border-slate-800 dark:text-slate-400">
        <span>
          {itemSummary}
          {filteredTotal !== total
            ? ` · ${copy.totalItems.replace("{total}", total.toLocaleString(locale))}`
            : ""}
        </span>
        {creating ? (
          <span className="rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {copy.creatingAccount}
          </span>
        ) : selectedId ? (
          <span className="inline-flex items-center gap-1 text-brand">
            <CheckCircle2 size={13} />
            {copy.selectedStudent}
          </span>
        ) : null}
      </div>
      <AdminDataTable
        rows={students}
        rowId={(student) => student.id}
        label={copy.studentDirectory}
        loading={loading}
        error={error}
        emptyTitle={hasFilters ? copy.noStudentMatches : copy.noStudents}
        errorTitle={copy.directoryLoadFailed}
        onRetry={onRetry}
        activeId={creating ? undefined : selectedId}
        onRowClick={onSelect}
        sortId={sort}
        sortDirection={sortDirection}
        onSort={(value) => onSort(value as StudentSort)}
        scrollClassName="overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tableClassName="min-w-[780px]"
        columns={[
          {
            id: "name",
            header: copy.students,
            sortLabel: copy.students,
            className: "min-w-44",
            cell: (student) => (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-ink">{student.name}</strong>
                  <StudentStatus student={student} language={language} />
                </div>
                <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {student.grade || copy.educationNotSet}
                </span>
              </div>
            ),
          },
          {
            id: "username",
            header: copy.username,
            sortLabel: language === "fa" ? "نام کاربری" : "Username",
            className: "min-w-36",
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
            header: copy.gradeAndMajor,
            sortLabel: copy.gradeAndMajor,
            className: "min-w-32",
            cell: (student) => (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {[student.grade, student.major].filter(Boolean).join(" / ") || copy.educationNotSet}
              </span>
            ),
          },
          {
            id: "guardians",
            header: language === "fa" ? "سرپرست‌ها" : "Guardians",
            className: "min-w-28",
            cell: (student) => (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck size={14} className="text-brand" aria-hidden="true" />
                {(student.guardians?.length || 0).toLocaleString(locale)}
              </span>
            ),
          },
          {
            id: "completeness",
            header: copy.profileCompletionShort,
            sortLabel: copy.profileCompletionShort,
            className: "min-w-36",
            cell: (student) => <Completeness student={student} language={language} />,
          },
          {
            id: "lastSeen",
            header: copy.lastActivity,
            sortLabel: copy.lastActivity,
            className: "min-w-32",
            cell: (student) => (
              <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                {formatStudentLastSeen(student.last_seen_at, language)}
              </span>
            ),
          },
        ]}
        mobileCard={(student) => (
          <div className="grid gap-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-ink">{student.name}</strong>
                <span className="mt-1 block truncate text-xs text-slate-500" dir="ltr">
                  {getStudentUsername(student) || copy.usernameNotSet}
                </span>
              </div>
              <StudentStatus student={student} language={language} />
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <span className="text-slate-500">
                {language === "fa" ? "تحصیل" : "Education"}
                <strong className="mt-1 block truncate text-slate-700 dark:text-slate-200">
                  {[student.grade, student.major].filter(Boolean).join(" / ") ||
                    copy.educationNotSet}
                </strong>
              </span>
              <span className="text-slate-500">
                {language === "fa" ? "سرپرست" : "Guardians"}
                <strong className="mt-1 block text-slate-700 dark:text-slate-200">
                  {(student.guardians?.length || 0).toLocaleString(locale)}
                </strong>
              </span>
            </div>
            <Completeness student={student} language={language} />
          </div>
        )}
        footer={
          <div className="z-[1] flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[rgb(var(--surface-card))] p-3 sm:p-4 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{copy.itemsPerPage}</span>
              <Select
                aria-label={copy.itemsPerPage}
                className="h-9 min-w-16 px-2 text-xs"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={25}>{(25).toLocaleString(locale)}</option>
                <option value={50}>{(50).toLocaleString(locale)}</option>
                <option value={100}>{(100).toLocaleString(locale)}</option>
              </Select>
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="soft"
                className="h-9 px-2.5"
                disabled={page <= 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                <ChevronRight size={15} className="ltr:rotate-180" />
                <span className="hidden sm:inline">{copy.previousPage}</span>
              </Button>
              <span className="min-w-20 whitespace-nowrap text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                {page.toLocaleString(locale)} {" / "}{" "}
                {Math.max(1, pageCount).toLocaleString(locale)}
              </span>
              <Button
                variant="soft"
                className="h-9 px-2.5"
                disabled={page >= pageCount}
                onClick={() => setPage(Math.min(pageCount, page + 1))}
              >
                <span className="hidden sm:inline">{copy.nextPage}</span>
                <ChevronLeft size={15} className="ltr:rotate-180" />
              </Button>
            </div>
          </div>
        }
        emptyAction={
          hasFilters ? (
            <Button variant="soft" onClick={onClearFilters}>
              {copy.showAllStudents}
            </Button>
          ) : undefined
        }
      />
    </section>
  );
}
