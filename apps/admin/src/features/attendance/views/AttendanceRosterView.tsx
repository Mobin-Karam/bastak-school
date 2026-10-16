import {
  Check,
  CheckCheck,
  LoaderCircle,
  UsersRound,
  Clock3,
  Minus,
  UserRound,
} from "lucide-react";
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
  canManage,
  absenceFirst = false,
  participants,
  filtered,
  selected,
  filter,
  search,
  loading,
  saving,
  conflict,
  unmarkedCount,
  onFilterChange,
  onSearchChange,
  onMark,
  onMarkAllPresent,
  onClearFilters,
  onViewProfile,
}: {
  canManage: boolean;
  /** Saved timetable sessions are committed absence-first; ad-hoc marking remains explicit. */
  absenceFirst?: boolean;
  participants: AttendanceParticipant[];
  filtered: AttendanceParticipant[];
  selected: boolean;
  filter: AttendanceFilter;
  search: string;
  loading: boolean;
  saving: boolean;
  conflict: boolean;
  unmarkedCount: number;
  onFilterChange: (value: AttendanceFilter) => void;
  onSearchChange: (value: string) => void;
  onMark: (id: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onClearFilters: () => void;
  onViewProfile?: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-sky-100 p-0 dark:border-slate-700">
      <div className="space-y-3 border-b border-[rgb(var(--border-subtle))] p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-black">فهرست طلبه‌ها</h2>
            <p className={`text-xs ${muted}`}>
              {canManage
                ? absenceFirst
                  ? "فقط غایب یا دیرآمده را انتخاب کنید؛ بقیه پس از تأیید حاضر می‌شوند."
                  : "برای هر نفر یک وضعیت انتخاب کنید"
                : "فهرست اعضا؛ دسترسی شما فقط برای مشاهده است."}
            </p>
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={onMarkAllPresent}
              disabled={saving || conflict || loading || unmarkedCount === 0}
              className={`${buttonBase} border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300`}
            >
              <CheckCheck size={17} /> {absenceFirst ? "تأیید حضور همه" : "ثبت‌نشده‌ها حاضر"}
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            maxLength={120}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="جستجوی طلبه"
            placeholder="جستجو با نام یا شماره طلبه"
            className={`min-h-12 w-full rounded-2xl ${shell} px-4 text-sm font-semibold sm:flex-1`}
          />
          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as AttendanceFilter)}
            aria-label="فیلتر وضعیت"
            className={`min-h-12 w-full rounded-2xl ${shell} px-4 font-semibold`}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="unmarked">نامشخص</option>
            {participants.some((person) => person.status === "excused") ? (
              <option value="excused">موجه</option>
            ) : null}
            {attendanceStatuses.map((status) => (
              <option key={status} value={status}>
                {attendanceStatusMeta[status].label}
              </option>
            ))}
          </select>
        </div>
        {filter !== "all" ? (
          <button
            type="button"
            className="text-xs font-bold text-blue-600"
            onClick={() => onFilterChange("all")}
          >
            نمایش همه
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className={`flex items-center justify-center gap-2 p-12 text-sm ${muted}`}>
          <LoaderCircle className="animate-spin" size={19} /> در حال دریافت فهرست…
        </div>
      ) : filtered.length === 0 ? (
        <div className={`flex flex-col items-center gap-3 p-10 text-center text-sm ${muted}`}>
          <UsersRound size={30} />
          <p>
            {participants.length
              ? "طلبه‌ای با این وضعیت پیدا نشد."
              : selected
                ? "برای این گروه طلبه‌ای یافت نشد."
                : "ابتدا کلاس، گروه یا اتاق را انتخاب کنید."}
          </p>
          {participants.length > 0 ? (
            <button className="font-bold text-blue-600" type="button" onClick={onClearFilters}>
              پاک‌کردن فیلترها
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 p-3 sm:p-4">
          {filtered.map((student, index) => (
            <div
              key={student.id}
              className="space-y-3 md:flex md:items-center md:gap-4 md:space-y-0 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                  {student.name.trim().slice(0, 1) || index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{student.name}</p>
                  <p className={`text-xs ${muted}`}>{student.studentNumber}</p>
                </div>
                {onViewProfile ? (
                  <button
                    type="button"
                    className="ms-auto min-h-11 rounded-xl border border-[rgb(var(--border-subtle))] px-3 text-xs font-bold"
                    aria-label={`پرونده حضور ${student.name}`}
                    onClick={() => onViewProfile(student.id)}
                  >
                    پرونده حضور
                  </button>
                ) : null}
                {student.status !== "unmarked" ? (
                  <Check size={15} className="shrink-0 text-emerald-600" aria-label="تعیین شده" />
                ) : null}
              </div>
              {!canManage || student.status === "excused" ? (
                <span
                  className={`text-sm font-bold ${student.status === "unmarked" ? muted : attendanceStatusMeta[student.status].active} rounded-lg px-3 py-2`}
                >
                  {student.status === "unmarked"
                    ? "نامشخص"
                    : attendanceStatusMeta[student.status].label}
                </span>
              ) : null}
              {canManage ? (
                <div
                  role="group"
                  aria-label={`وضعیت ${student.name}`}
                  className="grid grid-cols-3 gap-2 md:w-80 md:shrink-0"
                >
                  {(absenceFirst
                    ? attendanceStatuses.filter((status) => status !== "present")
                    : attendanceStatuses
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={student.status === status}
                      disabled={saving || conflict}
                      onClick={() =>
                        onMark(student.id, student.status === status ? "unmarked" : status)
                      }
                      className={`mobile-attendance-status min-h-14 md:min-h-11 rounded-xl border px-2 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${student.status === status ? `${attendanceStatusMeta[status].active} ring-2 ring-current` : `${attendanceStatusMeta[status].active} opacity-75 hover:opacity-100`}`}
                    >
                      {status === "present" ? (
                        <UserRound
                          className="mx-auto mb-1 text-emerald-600"
                          size={20}
                          aria-hidden="true"
                        />
                      ) : status === "absent" ? (
                        <Minus
                          className="mx-auto mb-1 text-rose-600"
                          size={20}
                          aria-hidden="true"
                        />
                      ) : (
                        <Clock3
                          className="mx-auto mb-1 text-amber-600"
                          size={20}
                          aria-hidden="true"
                        />
                      )}
                      {attendanceStatusMeta[status].label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
