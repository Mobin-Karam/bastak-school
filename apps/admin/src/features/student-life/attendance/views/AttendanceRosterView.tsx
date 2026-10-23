import {
  Check,
  CheckCheck,
  LoaderCircle,
  UsersRound,
  Clock3,
  Minus,
  Plus,
  Trophy,
  UserRound,
  Search,
  BadgeCheck,
} from "lucide-react";
import { Card } from "../../../../shared/ui/ui";
import { AttendanceSelect } from "../components/AttendanceSelect";
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

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
  onAdjustPoints,
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
  onAdjustPoints?: (student: AttendanceParticipant, points: 1 | -1) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl p-0">
      <div className="space-y-4 border-b border-[rgb(var(--border-subtle))] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black">فهرست دانش‌آموزان</h2>
              <span className="rounded-full bg-[rgb(var(--surface-muted))] px-2.5 py-1 text-xs font-bold tabular-nums text-[rgb(var(--color-ink))]">
                {participants.length.toLocaleString("fa-IR")} نفر
              </span>
            </div>
            <p className={`mt-1 max-w-2xl text-xs leading-5 ${muted}`}>
              {canManage
                ? absenceFirst
                  ? "برای ثبت سریع، فقط غایبان و افراد دیررس را مشخص کنید؛ سایر اعضا با تأیید نهایی حاضر ثبت می‌شوند."
                  : "وضعیت هر دانش‌آموز را مشخص کنید؛ پیش از ثبت، خلاصه و موارد نامشخص را بررسی خواهید کرد."
                : "فهرست اعضا؛ دسترسی شما فقط برای مشاهده است."}
            </p>
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={onMarkAllPresent}
              disabled={saving || conflict || loading || unmarkedCount === 0}
              className={`${buttonBase} shrink-0 border border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200`}
            >
              <CheckCheck size={17} /> {absenceFirst ? "تأیید حضور همه" : "ثبت‌نشده‌ها حاضر"}
            </button>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <label
            className={`flex min-h-11 items-center gap-2 rounded-xl ${shell} px-3 focus-within:ring-2 focus-within:ring-brand`}
          >
            <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              maxLength={120}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              aria-label="جستجوی طلبه"
              placeholder="جستجو با نام یا شماره طلبه…"
              className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </label>
          <AttendanceSelect
            value={filter}
            onChange={(value) => onFilterChange(value as AttendanceFilter)}
            label="فیلتر وضعیت"
            className="rounded-xl font-semibold"
            options={[
              { value: "all", label: "همه وضعیت‌ها" },
              { value: "unmarked", label: "ثبت‌نشده" },
              ...(participants.some((person) => person.status === "excused")
                ? [{ value: "excused", label: "موجه" }]
                : []),
              ...attendanceStatuses.map((status) => ({
                value: status,
                label: attendanceStatusMeta[status].label,
              })),
            ]}
          />
        </div>
        {filter !== "all" || search ? (
          <button
            type="button"
            className="text-xs font-bold text-brand hover:underline"
            onClick={onClearFilters}
          >
            پاک‌کردن جستجو و فیلتر
          </button>
        ) : null}
      </div>

      {loading ? (
        <div
          className={`flex min-h-40 flex-col items-center justify-center gap-3 p-8 text-sm ${muted}`}
        >
          <LoaderCircle className="animate-spin text-brand motion-reduce:animate-none" size={24} />
          <span>در حال دریافت فهرست دانش‌آموزان…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`flex min-h-44 flex-col items-center justify-center gap-3 p-8 text-center text-sm ${muted}`}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(var(--surface-muted))] text-brand">
            <UsersRound size={23} />
          </span>
          <p>
            {participants.length
              ? "دانش‌آموزی با این جستجو و وضعیت پیدا نشد."
              : selected
                ? "برای این گروه دانش‌آموزی یافت نشد."
                : "ابتدا کلاس، گروه یا اتاق را انتخاب کنید."}
          </p>
          {participants.length > 0 ? (
            <button
              className="font-bold text-brand hover:underline"
              type="button"
              onClick={onClearFilters}
            >
              پاک‌کردن جستجو و فیلتر
            </button>
          ) : null}
        </div>
      ) : (
        <div className="divide-y divide-[rgb(var(--border-subtle))]">
          {filtered.map((student, index) => (
            <div
              key={student.id}
              className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(12rem,1fr)_minmax(15rem,auto)] lg:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-base font-black text-brand">
                  {student.name.trim().slice(0, 1) || index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[rgb(var(--color-ink))]">
                    {student.name}
                  </p>
                  <p className={`mt-0.5 text-xs ${muted}`} dir="ltr">
                    {student.studentNumber}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {canManage ? (
                  <div
                    role="group"
                    aria-label={`وضعیت ${student.name}`}
                    className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:flex-none"
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
                        className={`mobile-attendance-status min-h-11 rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:min-w-24 sm:text-sm ${student.status === status ? `${attendanceStatusMeta[status].active} ring-2 ring-current ring-offset-1` : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-[rgb(var(--color-ink))] hover:bg-[rgb(var(--surface-muted))]"}`}
                      >
                        {status === "present" ? (
                          <Check size={15} aria-hidden="true" />
                        ) : status === "absent" ? (
                          <Minus size={15} aria-hidden="true" />
                        ) : (
                          <Clock3 size={15} aria-hidden="true" />
                        )}
                        {attendanceStatusMeta[status].label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${student.status === "unmarked" ? "bg-[rgb(var(--surface-muted))] text-slate-600 dark:text-slate-300" : `${attendanceStatusMeta[student.status].active}`}`}
                  >
                    {student.status === "unmarked" ? (
                      <UserRound size={14} />
                    ) : (
                      <BadgeCheck size={14} />
                    )}
                    {student.status === "unmarked"
                      ? "ثبت‌نشده"
                      : attendanceStatusMeta[student.status].label}
                  </span>
                )}
                {onViewProfile ? (
                  <button
                    type="button"
                    className={`${buttonBase} min-h-10 border border-[rgb(var(--border-subtle))] px-3 text-xs hover:bg-[rgb(var(--surface-muted))]`}
                    aria-label={`پرونده حضور ${student.name}`}
                    onClick={() => onViewProfile(student.id)}
                  >
                    پرونده
                  </button>
                ) : null}
                {onAdjustPoints ? (
                  <div
                    className="flex shrink-0 items-center gap-1"
                    role="group"
                    aria-label={`امتیاز ${student.name}`}
                  >
                    <Trophy size={15} className="text-amber-600" aria-hidden="true" />
                    <button
                      type="button"
                      className="grid min-h-9 min-w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200"
                      aria-label={`افزودن یک امتیاز برای ${student.name}`}
                      disabled={saving}
                      onClick={() => onAdjustPoints(student, 1)}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="grid min-h-9 min-w-9 place-items-center rounded-lg bg-rose-50 text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 dark:bg-rose-950/40 dark:text-rose-200"
                      aria-label={`کسر یک امتیاز از ${student.name}`}
                      disabled={saving}
                      onClick={() => onAdjustPoints(student, -1)}
                    >
                      <Minus size={16} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
