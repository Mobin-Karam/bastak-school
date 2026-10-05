import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  TableProperties,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { Student } from "../../../shared/types/domain";
import { Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { AdminDataTable } from "../../../shared/ui/admin-data-table";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { useState } from "react";
import { createCollectionView, createViewPreferenceStore } from "@moshaver/admin-workspace-ui";
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

const STUDENT_DIRECTORY_VIEW_ID = "student-directory";

function studentDirectoryPreferenceStore() {
  if (typeof window === "undefined") return undefined;
  return createViewPreferenceStore({
    namespace: "moshaver-admin",
    storage: window.localStorage,
  });
}

function readStudentDisplayMode(): "table" | "cards" {
  const layout = studentDirectoryPreferenceStore()?.load(STUDENT_DIRECTORY_VIEW_ID)?.layout;
  return layout === "cards" ? "cards" : "table";
}

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

function Completeness({
  student,
  language,
  compact = false,
}: {
  student: Student;
  language: "fa" | "en";
  compact?: boolean;
}) {
  const value = getStudentProfileCompleteness(student);
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";
  return (
    <div className={compact ? "min-w-0" : "min-w-28"}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{compact ? copy.profileCompletionShort : copy.directoryProfile}</span>
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
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  creating?: boolean;
}) {
  const [displayMode, setDisplayMode] = useState<"table" | "cards">(readStudentDisplayMode);
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";

  function changeDisplayMode(next: "table" | "cards") {
    setDisplayMode(next);
    studentDirectoryPreferenceStore()?.save(
      createCollectionView({
        id: STUDENT_DIRECTORY_VIEW_ID,
        title: copy.studentDirectoryPreference,
        layout: next,
        columns: ["name", "grade", "target", "lastSeen", "completeness"],
        visibleColumns: ["name", "grade", "target", "lastSeen", "completeness"],
      }),
    );
  }
  const hasFilters = !!search.trim() || status !== "all" || profileFilter !== "all";
  const startItem = filteredTotal ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, filteredTotal);
  const statusLabel = status === "all" ? "" : copy[status];
  const itemSummary = copy.showingItems
    .replace("{start}", startItem.toLocaleString(locale))
    .replace("{end}", endItem.toLocaleString(locale))
    .replace("{total}", filteredTotal.toLocaleString(locale));

  return (
    <Card className="min-w-0 p-0 xl:flex xl:max-h-[calc(100dvh-6rem)] xl:flex-col">
      <div className="z-10 grid shrink-0 gap-3 border-b border-slate-200 bg-[rgb(var(--surface-card))] p-3 sm:p-4 dark:border-slate-800">
        <StudentOverviewStats
          counts={counts}
          status={status}
          onStatusChange={onStatusChange}
          incomplete={incomplete}
          incompleteOnly={profileFilter === "incomplete"}
          onIncompleteToggle={onIncompleteToggle}
        />
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
                  <span className="px-1.5 text-[11px] font-semibold text-slate-600">
                    {copy.statusFilter}: {statusLabel}
                  </span>
                ) : null}
                {profileFilter === "incomplete" ? (
                  <span className="px-1.5 text-[11px] font-semibold text-amber-700">
                    {copy.profileIncomplete}
                  </span>
                ) : null}
              </>
            ) : undefined
          }
          actions={
            <SegmentedControl
              ariaLabel={copy.studentDirectory}
              value={displayMode}
              onValueChange={(value) => changeDisplayMode(value as "table" | "cards")}
              options={[
                {
                  value: "table",
                  label: (
                    <>
                      <TableProperties size={14} /> {copy.studentDirectoryTable}
                    </>
                  ),
                },
                {
                  value: "cards",
                  label: (
                    <>
                      <LayoutGrid size={14} /> {copy.studentDirectoryCards}
                    </>
                  ),
                },
              ]}
            />
          }
        />

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:hidden">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{copy.sort}</span>
            <select
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              value={sort}
              onChange={(event) => onSort(event.target.value as StudentSort)}
            >
              <option value="name">{copy.sortName}</option>
              <option value="username">{copy.sortUsername}</option>
              <option value="grade">{copy.sortGrade}</option>
              <option value="lastSeen">{copy.sortLastActivity}</option>
              <option value="completeness">{copy.sortProfileCompletion}</option>
            </select>
          </label>
          <Button
            variant="soft"
            className="h-9 px-3"
            onClick={() => onSort(sort)}
            aria-label={sortDirection === "asc" ? copy.sortDescending : copy.sortAscending}
          >
            {sortDirection === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
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

      {loading ? (
        <div className="p-4">
          <LoadingState label={copy.loadingDirectory} />
        </div>
      ) : error ? (
        <div className="p-4">
          <EmptyState
            title={copy.directoryLoadFailed}
            action={
              onRetry ? (
                <Button variant="soft" onClick={onRetry}>
                  {copy.directoryRetry}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : students.length ? (
        <>
          <div className="min-h-0 xl:flex-1">
            <AdminDataTable
              rows={students}
              rowId={(student) => student.id}
              label={copy.studentDirectory}
              activeId={creating ? undefined : selectedId}
              sortId={sort}
              sortDirection={sortDirection}
              onSort={(value) => onSort(value as StudentSort)}
              onRowClick={onSelect}
              displayMode={displayMode}
              scrollClassName="xl:max-h-full xl:overflow-y-auto xl:overscroll-contain"
              mobileCard={(student) => {
                const education =
                  [student.grade, student.major].filter(Boolean).join(" / ") ||
                  copy.educationNotSet;
                return (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <UserRound size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-ink">{student.name}</strong>
                          <StudentStatus student={student} language={language} />
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {education}
                        </span>
                      </span>
                      <ChevronLeft className="mt-2 text-slate-400 ltr:rotate-180" size={16} />
                    </div>
                    <Completeness student={student} language={language} compact />
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatStudentLastSeen(student.last_seen_at, language)}</span>
                      <span className="font-bold text-brand">{copy.openRecord}</span>
                    </div>
                  </div>
                );
              }}
              columns={[
                {
                  id: "name",
                  header: copy.students,
                  sortLabel: copy.students,
                  cell: (student) => (
                    <div className="flex max-w-[260px] items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <UserRound size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-ink">{student.name}</strong>
                          <StudentStatus student={student} language={language} />
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500" dir="ltr">
                          {getStudentUsername(student) || copy.usernameNotSet}
                        </span>
                      </span>
                    </div>
                  ),
                },
                {
                  id: "grade",
                  header: copy.gradeAndMajor,
                  sortLabel: copy.gradeAndMajor,
                  cell: (student) => (
                    <p className="max-w-[190px] truncate font-semibold text-slate-700 dark:text-slate-200">
                      {[student.grade, student.major].filter(Boolean).join(" / ") ||
                        copy.notRecorded}
                    </p>
                  ),
                },
                {
                  id: "target",
                  header: copy.goal,
                  cell: (student) => (
                    <p className="max-w-[220px] truncate text-xs text-slate-500">
                      {[
                        student.targetField || student.target_major,
                        student.targetUniversity || student.target_city,
                      ]
                        .filter(Boolean)
                        .join(" · ") || copy.notRecorded}
                    </p>
                  ),
                },
                {
                  id: "lastSeen",
                  header: copy.lastActivity,
                  sortLabel: copy.lastActivity,
                  cell: (student) => (
                    <span className="text-xs text-slate-500">
                      {formatStudentLastSeen(student.last_seen_at, language)}
                    </span>
                  ),
                },
                {
                  id: "completeness",
                  header: copy.directoryProfile,
                  sortLabel: copy.profileCompletionShort,
                  cell: (student) => <Completeness student={student} language={language} />,
                },
              ]}
            />
          </div>

          {filteredTotal > 0 ? (
            <div className="z-[1] flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[rgb(var(--surface-card))] p-3 sm:p-4 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{copy.itemsPerPage}</span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={25}>{(25).toLocaleString(locale)}</option>
                  <option value={50}>{(50).toLocaleString(locale)}</option>
                  <option value={100}>{(100).toLocaleString(locale)}</option>
                </select>
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="soft"
                  className="h-9 px-2.5"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  <ChevronRight size={15} className="ltr:rotate-180" />
                  {copy.previousPage}
                </Button>
                <span className="min-w-20 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {page.toLocaleString(locale)} / {Math.max(1, pageCount).toLocaleString(locale)}
                </span>
                <Button
                  variant="soft"
                  className="h-9 px-2.5"
                  disabled={page >= pageCount}
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                >
                  {copy.nextPage}
                  <ChevronLeft size={15} className="ltr:rotate-180" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-4">
          <EmptyState
            title={hasFilters ? copy.noStudentMatches : copy.noStudents}
            action={
              hasFilters ? (
                <Button variant="soft" onClick={onClearFilters}>
                  {copy.showAllStudents}
                </Button>
              ) : undefined
            }
          />
        </div>
      )}
    </Card>
  );
}
