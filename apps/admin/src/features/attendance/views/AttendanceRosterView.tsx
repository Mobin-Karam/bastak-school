import { Check, CheckCheck, LoaderCircle, Search, UsersRound } from "lucide-react";
import { Card } from "../../../shared/ui/ui";
import {
  attendanceStatusMeta,
  attendanceStatuses,
  type AttendanceFilter,
  type AttendanceParticipant,
  type AttendanceStatus,
} from "../model/attendance-workflow";

const shell = "border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]";
const muted = "text-slate-500 dark:text-slate-400";
const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * One roster presentation for every shell. CSS adapts the same controls from
 * one-handed mobile rows to a wider, denser desktop action row without
 * remounting the attendance draft.
 */
export function AttendanceRosterView({
  participants,
  filtered,
  selected,
  search,
  filter,
  loading,
  saving,
  conflict,
  unmarkedCount,
  onSearchChange,
  onFilterChange,
  onMark,
  onMarkAllPresent,
  onClearFilters,
}: {
  participants: AttendanceParticipant[];
  filtered: AttendanceParticipant[];
  selected: boolean;
  search: string;
  filter: AttendanceFilter;
  loading: boolean;
  saving: boolean;
  conflict: boolean;
  unmarkedCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: AttendanceFilter) => void;
  onMark: (id: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onClearFilters: () => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-3 border-b border-[rgb(var(--border-subtle))] p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-black">فهرست طلبه‌ها</h2>
            <p className={`text-xs ${muted}`}>برای هر نفر یک وضعیت انتخاب کنید</p>
          </div>
          <button
            type="button"
            onClick={onMarkAllPresent}
            disabled={saving || conflict || loading || unmarkedCount === 0}
            className={`${buttonBase} border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300`}
          >
            <CheckCheck size={17} /> ثبت‌نشده‌ها حاضر
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search size={17} className={`absolute right-3 top-3.5 ${muted}`} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="جستجوی نام یا شماره…"
              aria-label="جستجوی طلبه"
              className={`h-11 w-full rounded-xl ${shell} pr-10 pl-3 outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </label>
          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as AttendanceFilter)}
            aria-label="فیلتر وضعیت"
            className={`h-11 rounded-xl ${shell} px-3 sm:w-40`}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="unmarked">نامشخص</option>
            {attendanceStatuses.map((status) => <option key={status} value={status}>{attendanceStatusMeta[status].label}</option>)}
          </select>
        </div>
        {filter !== "all" ? <button type="button" className="text-xs font-bold text-blue-600" onClick={() => onFilterChange("all")}>نمایش همه</button> : null}
      </div>

      {loading ? (
        <div className={`flex items-center justify-center gap-2 p-12 text-sm ${muted}`}><LoaderCircle className="animate-spin" size={19} /> در حال دریافت فهرست…</div>
      ) : filtered.length === 0 ? (
        <div className={`flex flex-col items-center gap-3 p-10 text-center text-sm ${muted}`}>
          <UsersRound size={30} />
          <p>{participants.length ? "نتیجه‌ای برای جستجو یا فیلتر پیدا نشد." : selected ? "برای این گروه طلبه‌ای یافت نشد." : "ابتدا کلاس، گروه یا اتاق را انتخاب کنید."}</p>
          {participants.length > 0 ? <button className="font-bold text-blue-600" type="button" onClick={onClearFilters}>پاک‌کردن فیلترها</button> : null}
        </div>
      ) : (
        <div className="divide-y divide-[rgb(var(--border-subtle))]">
          {filtered.map((student, index) => (
            <div key={student.id} className="space-y-3 px-3 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{student.name.trim().slice(0, 1) || index + 1}</span>
                <div className="min-w-0"><p className="truncate text-sm font-bold">{student.name}</p><p className={`text-xs ${muted}`}>{student.studentNumber}</p></div>
                {student.status !== "unmarked" ? <Check size={15} className="shrink-0 text-emerald-600" aria-label="تعیین شده" /> : null}
              </div>
              <div role="group" aria-label={`وضعیت ${student.name}`} className="grid grid-cols-4 gap-1.5 sm:w-[340px]">
                {attendanceStatuses.map((status) => (
                  <button key={status} type="button" aria-pressed={student.status === status} disabled={saving || conflict} onClick={() => onMark(student.id, student.status === status ? "unmarked" : status)} className={`mobile-attendance-status min-h-12 rounded-xl border px-1 py-2 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${student.status === status ? attendanceStatusMeta[status].active : "border-[rgb(var(--border-subtle))] hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    <span className={`mx-auto mb-1 block size-1.5 rounded-full ${attendanceStatusMeta[status].dot}`} />{attendanceStatusMeta[status].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
