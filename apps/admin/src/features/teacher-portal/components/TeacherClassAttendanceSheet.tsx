import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, MapPin, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  bulkMarkAttendance,
  getAttendanceParticipants,
  type SelfAttendanceRecord,
} from "../../attendance/api/attendance.api";
import type { ScheduleEntry } from "../../schedule/api/schedule.api";
import { notify } from "../../../shared/ui/notifications";
import { MobileSheet } from "../../../shared/ui/mobile-sheet";
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
  const participants = useQuery({
    queryKey: ["attendance", "participants", "class", entry?.classroom?.id],
    queryFn: () => getAttendanceParticipants("class", entry!.classroom!.id),
    enabled: open && Boolean(entry?.classroom?.id),
  });

  useEffect(() => {
    setMarks({});
  }, [entry?.id, open]);

  const save = useMutation({
    mutationFn: () => {
      if (!entry?.classroom?.id) throw new Error("این کلاس هنوز به برنامه متصل نشده است.");
      const entries = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
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
    <MobileSheet open={open} onOpenChange={onOpenChange}>
      <section className="mx-auto w-full max-w-2xl p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700"
        />
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
              <UsersRound size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-ink">
                {entry?.title ?? "فهرست کلاس"}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} aria-hidden="true" />
                  {entry ? `${entry.startTime} تا ${entry.endTime}` : ""}
                </span>
                {entry?.room ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} aria-hidden="true" />
                    {entry.room}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="بستن فهرست کلاس"
            onClick={() => onOpenChange(false)}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </header>

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
                </li>
              ))}
            </ul>
            {canManage ? (
              <div className="sticky bottom-0 mt-4 flex gap-2 bg-card pt-3">
                <Button
                  variant="soft"
                  className="flex-1"
                  disabled={!Object.keys(marks).length || save.isPending}
                  onClick={() => setMarks({})}
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
    </MobileSheet>
  );
}
