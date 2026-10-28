import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkMarkAttendance,
  awardAttendancePoints,
  getAttendanceParticipants,
  listMyAttendanceAbsenceReviews,
  prepareAttendanceWrite,
  type PendingAttendanceWrite,
  type SelfAttendanceRecord,
  useAttendanceDiscard,
} from "../../../student-life/attendance/public";
import { useAuth } from "../../../identity/auth";
import {
  BadgeCheck,
  Check,
  CircleCheck,
  CircleX,
  Clock3,
  MessageSquareText,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";
import { notify } from "../../../../shared/ui/notifications";
import { api } from "../../../../shared/api/api";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { Button, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { DatePicker } from "../../../../shared/ui/date-picker";

type AttendanceStatus = SelfAttendanceRecord["status"];

const attendanceActions: Array<{
  status: AttendanceStatus;
  label: string;
  activeClassName: string;
}> = [
  { status: "present", label: "ح · حاضر", activeClassName: "bg-emerald-600 text-white" },
  { status: "absent", label: "غ · غایب", activeClassName: "bg-rose-600 text-white" },
  {
    status: "late",
    label: "ت · تأخیر",
    activeClassName: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  },
  { status: "excused", label: "م · موجه", activeClassName: "bg-sky-600 text-white" },
];

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
function nearestSessionDate(date: string, weekday: number, direction: -1 | 1) {
  const next = new Date(`${date}T12:00:00Z`);
  do next.setUTCDate(next.getUTCDate() + direction);
  while ((next.getUTCDay() + 1) % 7 !== weekday);
  return isoDay(next);
}

/** Class roster and physical attendance management for a teacher's own scheduled class. */
export function TeacherClassAttendanceSheet({
  entry,
  open,
  onOpenChange,
  canManage,
}: {
  entry: ScheduleEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}) {
  const client = useQueryClient();
  const auth = useAuth();
  const scopeKey = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const scopeRef = useRef(scopeKey);
  scopeRef.current = scopeKey;
  const pendingWrite = useRef<PendingAttendanceWrite | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pointTarget, setPointTarget] = useState<{
    id: string;
    name: string;
    points: number;
  } | null>(null);
  const [pointReason, setPointReason] = useState("");
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [reportText, setReportText] = useState<Record<string, string>>({});
  const [sessionDate, setSessionDate] = useState(() => isoDay(new Date()));
  const participants = useQuery({
    queryKey: ["attendance", "participants", scopeKey, "class", entry?.classroom?.id],
    queryFn: () => getAttendanceParticipants("class", entry!.classroom!.id),
    enabled: open && Boolean(entry?.classroom?.id),
  });
  const reviews = useQuery({
    queryKey: ["attendance", "my-absence-reviews", scopeKey],
    queryFn: listMyAttendanceAbsenceReviews,
    enabled: open,
  });
  const teacherReports = useQuery({
    queryKey: ["teacher", "student-reports", scopeKey],
    queryFn: () =>
      api.get<Array<{ studentId: string; sessionId: string; seenAt: string | null }>>(
        "/teacher/student-reports",
      ),
    enabled: open && canManage,
  });
  const classReviews = (reviews.data ?? []).filter(
    (review) => review.contextType === "class" && review.contextId === entry?.classroom?.id,
  );

  useEffect(() => {
    setReviewing(false);
    setClearConfirmationOpen(false);
    setMarks({});
    setReasons({});
    pendingWrite.current = null;
    setPointTarget(null);
    setPointReason("");
    setSavedSessionId(null);
    setReportText({});
    setSessionDate(isoDay(new Date()));
  }, [entry?.id, open, scopeKey]);

  // The roster is an attendance-taking surface: a teacher starts from a full
  // present register and records only exceptions. The API still receives an
  // explicit status for every authorized participant on save.
  useEffect(() => {
    if (!open || !participants.data?.length) return;
    setMarks((current) =>
      Object.keys(current).length
        ? current
        : Object.fromEntries(participants.data.map((student) => [student.id, "present"])),
    );
  }, [open, participants.data]);

  useEffect(() => {
    if (!open) return;
    const stream = api.openEvents((type) => {
      if (type === "attendance.reviewed")
        void client.invalidateQueries({ queryKey: ["attendance", "my-absence-reviews"] });
    });
    return () => stream.close();
  }, [client, open]);

  const save = useMutation({
    onMutate: () => ({ scopeKey }),
    mutationFn: async () => {
      if (!entry?.classroom?.id) throw new Error("این کلاس هنوز به برنامه متصل نشده است.");
      const entries = Object.entries(marks).map(([studentId, status]) => ({
        studentId,
        status,
        note: status === "excused" ? reasons[studentId]?.trim() || undefined : undefined,
      }));
      if (!entries.length) throw new Error("برای ثبت، وضعیت دست‌کم یک دانش‌آموز را انتخاب کنید.");
      const scheduled = await api.post<{ id: string; revision: number; duplicate: boolean }>(
        "/attendance/legacy-schedule-session",
        { entryId: entry.id, date: sessionDate },
      );
      const write = prepareAttendanceWrite(
        pendingWrite.current,
        JSON.stringify({
          scopeKey,
          scheduleId: entry.id,
          sessionId: scheduled.id,
          organizationId: entry.organization.id,
          classroomId: entry.classroom.id,
          entries,
        }),
        () => ({
          organizationId: entry.organization.id,
          sessionId: scheduled.id,
          expectedRevision: scheduled.revision,
          entries,
        }),
      );
      pendingWrite.current = write;
      return bulkMarkAttendance(write.body);
    },
    onSuccess: (result, __, context) => {
      if (context?.scopeKey !== scopeRef.current) return;
      pendingWrite.current = null;
      void client.invalidateQueries({ queryKey: ["attendance"] });
      notify("حضور و غیاب کلاس ثبت شد.", "success");
      setSavedSessionId(result.sessionId);
      setReviewing(false);
    },
    onError: (error, _, context) => {
      if (context?.scopeKey !== scopeRef.current) return;
      notify(error instanceof Error ? error.message : "ثبت حضور و غیاب انجام نشد.", "error");
    },
  });
  const report = useMutation({
    mutationFn: ({ studentId, message }: { studentId: string; message: string }) => {
      if (!savedSessionId) throw new Error("ابتدا حضور این جلسه را ثبت کنید.");
      return api.post(
        `/attendance/sessions/${encodeURIComponent(savedSessionId)}/students/${encodeURIComponent(studentId)}/reports`,
        { message },
      );
    },
    onSuccess: (_, values) => {
      setReportText((current) => ({ ...current, [values.studentId]: "" }));
      notify("گزارش برای مدیر ارسال شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ارسال گزارش انجام نشد.", "error"),
  });

  // A complete "present" register is the starting state, not an unsaved edit.
  // This keeps the leave guard for actual exceptions while allowing a teacher to
  // clear exceptions or return from review without a second drawer competing
  // with the roster drawer.
  const hasUnsavedChanges =
    (participants.data ?? []).some((student) => marks[student.id] !== "present") ||
    Object.values(reasons).some((reason) => Boolean(reason.trim()));
  const discard = useAttendanceDiscard(
    hasUnsavedChanges,
    save.isPending,
    `${scopeKey}:${entry?.id}:${open}`,
  );
  const resetToPresent = () => {
    setMarks(
      Object.fromEntries((participants.data ?? []).map((student) => [student.id, "present"])),
    );
    setReasons({});
  };
  const points = useMutation({
    mutationFn: () => {
      if (!entry?.classroom?.id || !pointTarget)
        throw new Error("دانش‌آموز یا کلاس انتخاب نشده است.");
      if (pointReason.trim().length < 3) throw new Error("دلیل سکه را وارد کنید.");
      return awardAttendancePoints({
        requestId: crypto.randomUUID(),
        organizationId: entry.organization.id,
        contextType: "class",
        contextId: entry.classroom.id,
        studentId: pointTarget.id,
        points: pointTarget.points,
        reason: pointReason.trim(),
      });
    },
    onSuccess: () => {
      notify("سکه کلاسی ثبت شد.", "success");
      setPointTarget(null);
      setPointReason("");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ثبت سکه انجام نشد.", "error"),
  });

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else discard.request(() => onOpenChange(false));
        }}
        title={entry?.title ?? "فهرست کلاس"}
        description={
          entry
            ? `${entry.startTime} تا ${entry.endTime}${entry.room ? ` · ${entry.room}` : ""}`
            : "وضعیت دانش‌آموزان را انتخاب و سپس بررسی کنید."
        }
      >
        <section aria-label="فهرست دانش‌آموزان کلاس">
          {entry ? (
            <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-[rgb(var(--surface-muted))] p-3">
              <Button
                size="sm"
                variant="soft"
                onClick={() => setSessionDate(nearestSessionDate(sessionDate, entry.weekday, -1))}
              >
                جلسه قبل
              </Button>
              <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                تاریخ جلسه
                <DatePicker value={sessionDate} onChange={setSessionDate} />
              </label>
              <Button
                size="sm"
                variant="soft"
                onClick={() => setSessionDate(nearestSessionDate(sessionDate, entry.weekday, 1))}
              >
                جلسه بعد
              </Button>
            </div>
          ) : null}
          {!entry?.classroom?.id ? (
            <div className="mt-5">
              <EmptyState title="برای این برنامه کلاس مشخص نشده است." />
            </div>
          ) : participants.isLoading ? (
            <div className="mt-5">
              <LoadingState label="در حال دریافت فهرست دانش‌آموزان…" />
            </div>
          ) : participants.isError ? (
            <div className="mt-5">
              <EmptyState title="فهرست دانش‌آموزان دریافت نشد." />
            </div>
          ) : !participants.data?.length ? (
            <div className="mt-5">
              <EmptyState title="دانش‌آموز فعالی در این کلاس نیست." />
            </div>
          ) : (
            <>
              <p className="mt-5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {canManage
                  ? reviewing
                    ? "انتخاب‌های خود را بررسی کنید و سپس ثبت را تأیید کنید."
                    : "همه دانش‌آموزان حاضر هستند؛ فقط وضعیت استثناها را تغییر دهید و سپس به بررسی بروید."
                  : "فهرست دانش‌آموزان این کلاس در اختیار شماست."}
              </p>
              {classReviews.length && !reviewing ? (
                <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs dark:border-sky-900/60 dark:bg-sky-950/25">
                  <p className="flex items-center gap-1.5 font-black text-sky-900 dark:text-sky-100">
                    <MessageSquareText size={15} aria-hidden="true" /> نتیجه بررسی مدیر
                  </p>
                  <ul className="mt-2 grid gap-1.5 text-slate-700 dark:text-slate-200">
                    {classReviews.slice(0, 4).map((review) => (
                      <li key={review.id}>
                        <span className="font-bold">{review.studentName}: </span>
                        {review.reviewStatus === "pending"
                          ? "در انتظار بررسی دلیل غیبت"
                          : review.reviewStatus === "approved"
                            ? "دلیل پذیرفته شد و غیبت موجه است"
                            : "دلیل غیبت رد شد"}
                        {review.reviewNote ? ` — ${review.reviewNote}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <ul
                className={reviewing ? "hidden" : "mt-3 grid gap-2"}
                aria-label="فهرست دانش‌آموزان کلاس"
              >
                {participants.data.map((student) => (
                  <li
                    key={student.id}
                    className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-bold text-ink">{student.name}</p>
                      <span className="shrink-0 text-[11px] text-slate-600 dark:text-slate-300">
                        {student.nationalCode || "دانش‌آموز"}
                      </span>
                    </div>
                    {canManage ? (
                      <div
                        className="mt-3 grid grid-cols-4 gap-1.5"
                        role="group"
                        aria-label={`وضعیت حضور ${student.name}`}
                      >
                        {attendanceActions.map((action) => {
                          const selected = marks[student.id] === action.status;
                          return (
                            <button
                              key={action.status}
                              type="button"
                              aria-label={action.label}
                              aria-pressed={selected}
                              disabled={save.isPending}
                              onClick={() =>
                                setMarks((current) => ({ ...current, [student.id]: action.status }))
                              }
                              title={action.label}
                              className={`grid min-h-11 place-items-center rounded-xl border transition-colors motion-reduce:transition-none ${selected ? action.activeClassName : "border-[rgb(var(--border-subtle))] bg-card text-slate-600 hover:border-brand/40 dark:text-slate-300"}`}
                            >
                              {action.status === "present" ? (
                                <CircleCheck size={19} aria-hidden="true" />
                              ) : action.status === "absent" ? (
                                <CircleX size={19} aria-hidden="true" />
                              ) : action.status === "late" ? (
                                <Clock3 size={19} aria-hidden="true" />
                              ) : (
                                <BadgeCheck size={19} aria-hidden="true" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    {canManage && marks[student.id] === "excused" ? (
                      <label className="mt-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                        توضیح موجه (اختیاری)
                        <input
                          value={reasons[student.id] ?? ""}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [student.id]: event.target.value,
                            }))
                          }
                          disabled={save.isPending}
                          maxLength={500}
                          placeholder="در صورت نیاز، توضیح موجه را بنویسید"
                          className="mt-1 min-h-10 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-card px-3 text-xs font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        />
                      </label>
                    ) : null}
                    {canManage ? (
                      <div className="mt-3 flex items-center gap-2 border-t border-[rgb(var(--border-subtle))] pt-2">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <AttendanceCoin className="size-4 object-contain" /> سکه کلاسی
                        </span>
                        <button
                          type="button"
                          disabled={save.isPending || points.isPending}
                          onClick={() => {
                            setPointTarget({ id: student.id, name: student.name, points: 1 });
                            setPointReason("");
                          }}
                          aria-label={`افزودن یک سکه برای ${student.name}`}
                          title="افزودن یک سکه"
                          className="grid min-h-9 min-w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={save.isPending || points.isPending}
                          onClick={() => {
                            setPointTarget({ id: student.id, name: student.name, points: -1 });
                            setPointReason("");
                          }}
                          aria-label={`کسر یک سکه از ${student.name}`}
                          title="کسر یک سکه"
                          className="grid min-h-9 min-w-9 place-items-center rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                    {canManage && savedSessionId ? (
                      <div className="mt-3 border-t border-[rgb(var(--border-subtle))] pt-3">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                          گزارش خصوصی برای مدیر
                          <textarea
                            value={reportText[student.id] ?? ""}
                            onChange={(event) =>
                              setReportText((current) => ({
                                ...current,
                                [student.id]: event.target.value,
                              }))
                            }
                            maxLength={2000}
                            placeholder="مشاهده، نگرانی یا پیگیری مربوط به این دانش‌آموز"
                            className="mt-1 min-h-20 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-card p-2 text-xs font-normal text-ink"
                          />
                        </label>
                        <Button
                          size="sm"
                          className="mt-2"
                          disabled={
                            report.isPending || (reportText[student.id] ?? "").trim().length < 2
                          }
                          onClick={() =>
                            report.mutate({
                              studentId: student.id,
                              message: reportText[student.id].trim(),
                            })
                          }
                        >
                          ارسال برای مدیر
                        </Button>
                        {teacherReports.data?.some(
                          (item) =>
                            item.studentId === student.id && item.sessionId === savedSessionId,
                        ) ? (
                          <p className="mt-2 text-[11px] text-slate-500">
                            {teacherReports.data.find(
                              (item) =>
                                item.studentId === student.id && item.sessionId === savedSessionId,
                            )?.seenAt
                              ? "مدیر گزارش را دیده است."
                              : "گزارش در انتظار مشاهده مدیر است."}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              {reviewing ? (
                <div className="mt-4 space-y-3">
                  <h2 className="font-black">مرحله ۲: بررسی و ثبت</h2>
                  {save.isError ? (
                    <p
                      role="alert"
                      className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                    >
                      {save.error instanceof Error
                        ? save.error.message
                        : "ثبت انجام نشد. انتخاب‌های شما حفظ شده‌اند؛ دوباره تلاش کنید."}
                    </p>
                  ) : null}
                  <p className="text-sm">
                    {Object.keys(marks).length} از {participants.data.length} نفر تعیین وضعیت
                    شده‌اند.
                  </p>
                  <ul className="grid gap-2">
                    {participants.data
                      .filter((student) => marks[student.id])
                      .map((student) => (
                        <li
                          key={student.id}
                          className="flex justify-between gap-2 rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm"
                        >
                          <span>{student.name}</span>
                          <strong>
                            {
                              attendanceActions.find(
                                (action) => action.status === marks[student.id],
                              )?.label
                            }
                          </strong>
                        </li>
                      ))}
                  </ul>
                  {Object.keys(marks).length < participants.data.length ? (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      افراد تعیین‌وضعیت‌نشده غایب محسوب نمی‌شوند و در این ثبت ارسال نمی‌شوند.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {canManage ? (
                <div className="sticky bottom-0 mt-4 bg-card pt-3">
                  {clearConfirmationOpen ? (
                    <div
                      role="alert"
                      className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                    >
                      <p className="font-black">تغییرات حضور و غیاب پاک می‌شوند</p>
                      <p className="mt-1 text-xs leading-5">
                        همه دانش‌آموزان دوباره حاضر می‌شوند و دلیل‌های غیبت پاک خواهد شد.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="soft"
                          className="flex-1"
                          disabled={save.isPending}
                          onClick={() => setClearConfirmationOpen(false)}
                        >
                          بازگشت و حفظ تغییرات
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-1"
                          disabled={save.isPending}
                          onClick={() => {
                            resetToPresent();
                            setClearConfirmationOpen(false);
                            onOpenChange(false);
                          }}
                        >
                          ادامه و پاک‌کردن
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      variant="soft"
                      className="flex-1"
                      disabled={!Object.keys(marks).length || save.isPending}
                      onClick={() => {
                        if (reviewing) {
                          setReviewing(false);
                          return;
                        }
                        // Keep the confirmation in this drawer. A nested drawer
                        // could propagate its back action to the roster itself.
                        setClearConfirmationOpen(true);
                      }}
                    >
                      {reviewing ? "بازگشت" : "پاک کردن"}
                    </Button>
                    <Button
                      className="flex-[1.4]"
                      disabled={!Object.keys(marks).length || save.isPending}
                      onClick={() => (reviewing ? save.mutate() : setReviewing(true))}
                    >
                      <Check size={16} aria-hidden="true" />{" "}
                      {save.isPending
                        ? "در حال ثبت…"
                        : reviewing
                          ? "تأیید و ثبت"
                          : "بررسی و ثبت حضور و غیاب"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </ResponsiveModal>
      {discard.confirmation}
      <ResponsiveModal
        open={Boolean(pointTarget)}
        onOpenChange={(next) => !next && !points.isPending && setPointTarget(null)}
        title={pointTarget?.points && pointTarget.points > 0 ? "افزودن سکه کلاسی" : "کسر سکه کلاسی"}
        description={pointTarget?.name ?? ""}
      >
        <div className="space-y-4" dir="rtl">
          <p className="text-sm leading-6">
            برای ثبت {pointTarget?.points ?? 0} سکه، دلیل روشن و قابل پیگیری وارد کنید.
          </p>
          <label className="block text-sm font-bold">
            دلیل
            <textarea
              autoFocus
              value={pointReason}
              onChange={(event) => setPointReason(event.target.value)}
              maxLength={500}
              className="mt-2 min-h-24 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 font-normal"
            />
          </label>
          <Button
            loading={points.isPending}
            disabled={pointReason.trim().length < 3}
            onClick={() => points.mutate()}
          >
            ثبت سکه
          </Button>
        </div>
      </ResponsiveModal>
    </>
  );
}
