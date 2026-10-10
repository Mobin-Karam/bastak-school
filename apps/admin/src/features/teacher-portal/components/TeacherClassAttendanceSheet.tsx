import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import {
  bulkMarkAttendance,
  getAttendanceParticipants,
  listMyAttendanceAbsenceReviews,
  type SelfAttendanceRecord,
} from "../../attendance/api/attendance.api";
import type { ScheduleEntry } from "../../schedule/api/schedule.api";
import { notify } from "../../../shared/ui/notifications";
import { api } from "../../../shared/api/api";
import { ResponsiveDrawer } from "../../../shared/ui/responsive-drawer";
import { Button, EmptyState, LoadingState } from "../../../shared/ui/ui";

type AttendanceStatus = SelfAttendanceRecord["status"];

const attendanceActions: Array<{
  status: AttendanceStatus;
  label: string;
  activeClassName: string;
}> = [
  { status: "present", label: "حاضر", activeClassName: "bg-emerald-600 text-white" },
  { status: "absent", label: "غایب", activeClassName: "bg-rose-600 text-white" },
  { status: "late", label: "تأخیر", activeClassName: "bg-amber-500 text-white" },
  { status: "excused", label: "موجه", activeClassName: "bg-sky-600 text-white" },
];

/** Class roster and four-status attendance management for a teacher's own scheduled class. */
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
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const participants = useQuery({
    queryKey: ["attendance", "participants", "class", entry?.classroom?.id],
    queryFn: () => getAttendanceParticipants("class", entry!.classroom!.id),
    enabled: open && Boolean(entry?.classroom?.id),
  });
  const reviews = useQuery({
    queryKey: ["attendance", "my-absence-reviews"],
    queryFn: listMyAttendanceAbsenceReviews,
    enabled: open,
  });
  const classReviews = (reviews.data ?? []).filter(
    (review) => review.contextType === "class" && review.contextId === entry?.classroom?.id,
  );

  useEffect(() => {
    setMarks({});
    setReasons({});
  }, [entry?.id, open]);

  useEffect(() => {
    if (!open) return;
    const stream = api.openEvents((type) => {
      if (type === "attendance.reviewed")
        void client.invalidateQueries({ queryKey: ["attendance", "my-absence-reviews"] });
    });
    return () => stream.close();
  }, [client, open]);

  const save = useMutation({
    mutationFn: () => {
      if (!entry?.classroom?.id) throw new Error("این کلاس هنوز به برنامه متصل نشده است.");
      const entries = Object.entries(marks).map(([studentId, status]) => ({
        studentId,
        status,
        note: status === "absent" ? reasons[studentId]?.trim() || undefined : undefined,
      }));
      if (!entries.length) throw new Error("برای ثبت، وضعیت دست‌کم یک دانش‌آموز را انتخاب کنید.");
      return bulkMarkAttendance({
        organizationId: entry.organization.id,
        contextType: "class",
        contextId: entry.classroom.id,
        sessionDate: new Date().toISOString(),
        entries,
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance"] });
      notify("حضور و غیاب کلاس ثبت شد.", "success");
      onOpenChange(false);
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ثبت حضور و غیاب انجام نشد.", "error"),
  });

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entry?.title ?? "فهرست کلاس"}
      description={
        entry
          ? `${entry.startTime} تا ${entry.endTime}${entry.room ? ` · ${entry.room}` : ""}`
          : undefined
      }
      className="md:w-[min(34rem,92vw)]"
    >
      <section aria-label="فهرست دانش‌آموزان کلاس">
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
            <p className="mt-5 text-xs leading-5 text-slate-500">
              {canManage
                ? "برای هر دانش‌آموز یک وضعیت انتخاب کنید؛ سپس تغییرات را ثبت کنید."
                : "فهرست دانش‌آموزان این کلاس در اختیار شماست."}
            </p>
            {classReviews.length ? (
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
            <ul className="mt-3 grid gap-2" aria-label="فهرست دانش‌آموزان کلاس">
              {participants.data.map((student) => (
                <li
                  key={student.id}
                  className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-bold text-ink">{student.name}</p>
                    <span className="shrink-0 text-[11px] text-slate-500">
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
                            aria-pressed={selected}
                            onClick={() =>
                              setMarks((current) => ({ ...current, [student.id]: action.status }))
                            }
                            className={`min-h-9 rounded-xl border px-1 text-[11px] font-bold transition-colors motion-reduce:transition-none ${selected ? action.activeClassName : "border-[rgb(var(--border-subtle))] bg-card text-slate-600 hover:border-brand/40 dark:text-slate-300"}`}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {canManage && marks[student.id] === "absent" ? (
                    <label className="mt-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                      دلیل غیبت
                      <input
                        value={reasons[student.id] ?? ""}
                        onChange={(event) =>
                          setReasons((current) => ({ ...current, [student.id]: event.target.value }))
                        }
                        maxLength={500}
                        placeholder="دلیل اعلام‌شده توسط دانش‌آموز یا ولی"
                        className="mt-1 min-h-10 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-card px-3 text-xs font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      />
                    </label>
                  ) : null}
                </li>
              ))}
            </ul>
            {canManage ? (
              <div className="sticky bottom-0 mt-4 flex gap-2 bg-card pt-3">
                <Button
                  variant="soft"
                  className="flex-1"
                  disabled={!Object.keys(marks).length || save.isPending}
                  onClick={() => { setMarks({}); setReasons({}); }}
                >
                  پاک کردن
                </Button>
                <Button
                  className="flex-[1.4]"
                  disabled={!Object.keys(marks).length || save.isPending}
                  onClick={() => save.mutate()}
                >
                  <Check size={16} aria-hidden="true" />{" "}
                  {save.isPending ? "در حال ثبت…" : "ثبت حضور و غیاب"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </ResponsiveDrawer>
  );
}
