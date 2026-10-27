import { CalendarClock, MapPin, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import {
  listSchedule,
  listScheduleTimeBlocks,
  listScheduleSubstitutionSlots,
  requestScheduleSubstitution,
  type ScheduleEntry,
} from "../../../academics/schedule/api/schedule.api";
import { Button, Card, EmptyState, Field, Input, LoadingState } from "../../../../shared/ui/ui";
import { AdaptiveSelect } from "../../../../shared/ui/adaptive-select";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { notify } from "../../../../shared/ui/notifications";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";

// Schedule API weekday 0 is Saturday. Keep every schedule audience in the same school-week order.
const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const isoToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
const dateForWeekday = (iso: string, weekday: number) => {
  const date = new Date(`${iso}T12:00:00Z`);
  const current = (date.getUTCDay() + 1) % 7;
  date.setUTCDate(date.getUTCDate() + ((weekday - current + 7) % 7));
  return date.toISOString().slice(0, 10);
};

/** A read-only, server-scoped weekly timetable for teachers. */
export function TeacherSchedulePage({ entries: suppliedEntries }: { entries?: ScheduleEntry[] }) {
  const auth = useAuth();
  const [selectedClass, setSelectedClass] = useState<ScheduleEntry | null>(null);
  const [requestDay, setRequestDay] = useState<number | null>(null);
  const [requestEntry, setRequestEntry] = useState<ScheduleEntry | null>(null);
  const [freezeDate, setFreezeDate] = useState(isoToday);
  const [replacementDate, setReplacementDate] = useState(isoToday);
  const [timeBlockId, setTimeBlockId] = useState("");
  const [targetEntryId, setTargetEntryId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewDate, setViewDate] = useState(isoToday);
  const schedule = useQuery({
    queryKey: ["schedule", "teacher"],
    queryFn: listSchedule,
    enabled: suppliedEntries === undefined,
  });
  const entries = suppliedEntries ?? schedule.data ?? [];
  const active = entries.filter(
    (entry) =>
      entry.status === "ACTIVE" ||
      (entry.status === "REPLACED" && entry.startsOn === viewDate && entry.endsOn === viewDate),
  );
  const timeBlocks = useQuery({
    queryKey: ["schedule", "time-blocks", auth.context?.activeOrganization?.id],
    queryFn: listScheduleTimeBlocks,
    enabled: requestDay !== null,
  });
  const slots = useQuery({
    queryKey: ["schedule", "substitution-slots", replacementDate],
    queryFn: () => listScheduleSubstitutionSlots(replacementDate),
    enabled: Boolean(requestEntry && replacementDate),
  });
  const submitRequest = async () => {
    if (!requestEntry || !targetEntryId || !timeBlockId || title.trim().length < 2) return;
    try {
      setSubmitting(true);
      await requestScheduleSubstitution({
        sourceEntryId: requestEntry.id,
        targetEntryId,
        freezeDate,
        replacementDate,
        replacementTimeBlockId: timeBlockId,
        title: title.trim(),
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      setRequestEntry(null);
      setRequestDay(null);
      notify("درخواست جابه‌جایی برای بررسی مدیر ارسال شد.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ارسال درخواست انجام نشد.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4" dir="rtl">
      <section className="flex items-start gap-3 px-1 pt-1">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand/10 text-brand">
          <CalendarClock size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="sr-only">برنامه هفتگی من</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            برای دیدن دانش‌آموزان و ثبت حضور، یک کلاس را انتخاب کنید.
          </p>
        </div>
        <label className="ms-auto grid gap-1 text-xs font-bold text-slate-600">
          تاریخ مشاهده جلسه جایگزین
          <Input
            type="date"
            value={viewDate}
            onChange={(event) => setViewDate(event.target.value)}
          />
        </label>
      </section>
      {suppliedEntries === undefined && schedule.isLoading ? (
        <LoadingState label="در حال دریافت برنامه هفتگی…" />
      ) : suppliedEntries === undefined && schedule.isError ? (
        <EmptyState title="برنامه هفتگی دریافت نشد." />
      ) : !active.length ? (
        <EmptyState title="کلاسی در برنامه شما ثبت نشده است." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-3">
          {weekdays.map((day, weekday) => {
            const dayEntries = active.filter((entry) => entry.weekday === weekday);
            return (
              <Card key={day} className="min-w-0 p-3">
                <button
                  type="button"
                  disabled={!auth.can("attendance.class.manage")}
                  className="min-h-11 text-sm font-black text-ink focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:focus-visible:ring-0"
                  onClick={() => {
                    if (!auth.can("attendance.class.manage")) return;
                    setRequestDay(weekday);
                    setRequestEntry(null);
                    setTargetEntryId("");
                    setTimeBlockId("");
                    setTitle("");
                    setMessage("");
                  }}
                >
                  {day}
                  {auth.can("attendance.class.manage") ? " · جابه‌جایی جلسه" : ""}
                </button>
                {dayEntries.length ? (
                  <ul className="mt-3 grid gap-2">
                    {dayEntries.map((entry) => (
                      <li key={entry.id} className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedClass(entry)}
                          className="w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3 text-right outline-none transition hover:border-brand/40 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
                            <span className="shrink-0 text-xs font-bold text-brand">
                              {entry.startTime}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={13} aria-hidden="true" />
                            {entry.room || entry.classroom?.name || "محل ثبت نشده"}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                            <UsersRound size={13} aria-hidden="true" />
                            فهرست کلاس و حضور
                          </p>
                          {entry.status === "REPLACED" ? (
                            <p className="mt-1 text-[11px] font-bold text-amber-700">
                              جلسه جایگزین یک‌باره · {entry.startsOn}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-4 text-center text-xs text-slate-500">
                    کلاسی ندارید
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <TeacherClassAttendanceSheet
        entry={selectedClass}
        open={Boolean(selectedClass)}
        onOpenChange={(open) => !open && setSelectedClass(null)}
        canManage={auth.can("attendance.manage")}
      />
      <ResponsiveDrawer
        open={requestDay !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRequestDay(null);
            setRequestEntry(null);
          }
        }}
        title="درخواست جابه‌جایی یک جلسه"
        description={
          requestEntry
            ? "اکنون تاریخ، بازه و جلسه مقصد را انتخاب کنید؛ نام دبیر مقصد پیش از ارسال نمایش داده می‌شود."
            : "ابتدا یکی از جلسه‌های همین روز را انتخاب کنید."
        }
      >
        {!requestEntry ? (
          <div className="grid gap-2">
            {active
              .filter((entry) => entry.status === "ACTIVE" && entry.weekday === requestDay)
              .map((entry) => (
                <Button
                  key={entry.id}
                  variant="soft"
                  onClick={() => {
                    setRequestEntry(entry);
                    setTitle(entry.title);
                    setFreezeDate(dateForWeekday(viewDate, entry.weekday));
                  }}
                >
                  {entry.title} · {entry.startTime}–{entry.endTime} · {entry.classroom?.name}
                </Button>
              ))}
            {!active.some((entry) => entry.status === "ACTIVE" && entry.weekday === requestDay) ? (
              <EmptyState title="جلسه‌ای برای این روز ندارید." />
            ) : null}
          </div>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitRequest();
            }}
          >
            <Field label="جلسه‌ای که منجمد می‌شود">
              <Input
                readOnly
                value={
                  requestEntry
                    ? `${requestEntry.title} · ${requestEntry.startTime}–${requestEntry.endTime}`
                    : ""
                }
              />
            </Field>
            <Field label="تاریخ جلسه اصلی">
              <Input
                required
                type="date"
                value={freezeDate}
                onChange={(event) => setFreezeDate(event.target.value)}
              />
            </Field>
            <Field label="تاریخ جلسه جایگزین">
              <Input
                required
                type="date"
                value={replacementDate}
                onChange={(event) => setReplacementDate(event.target.value)}
              />
            </Field>
            <Field label="بازه زمانی جایگزین">
              <AdaptiveSelect
                required
                value={timeBlockId}
                onChange={(event) => {
                  setTimeBlockId(event.target.value);
                  setTargetEntryId("");
                }}
              >
                <option value="">انتخاب بازه زمانی</option>
                {(timeBlocks.data ?? []).map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name} · {block.startTime}–{block.endTime}
                  </option>
                ))}
              </AdaptiveSelect>
            </Field>
            <Field label="جلسه و دبیر حاضر در بازه مقصد">
              <AdaptiveSelect
                required
                value={targetEntryId}
                onChange={(event) => setTargetEntryId(event.target.value)}
              >
                <option value="">ابتدا بازه زمانی را انتخاب کنید</option>
                {(slots.data ?? [])
                  .filter((entry) => {
                    const block = (timeBlocks.data ?? []).find((item) => item.id === timeBlockId);
                    return (
                      block &&
                      entry.id !== requestEntry.id &&
                      entry.startTime === block.startTime &&
                      entry.endTime === block.endTime
                    );
                  })
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title} ·{" "}
                      {entry.teacher
                        ? `${entry.teacher.firstName ?? ""} ${entry.teacher.lastName ?? entry.teacher.username}`
                        : "دبیر تعیین نشده"}
                    </option>
                  ))}
              </AdaptiveSelect>
              {timeBlockId &&
              !slots.isLoading &&
              !(slots.data ?? []).some((entry) => {
                const block = (timeBlocks.data ?? []).find((item) => item.id === timeBlockId);
                return (
                  block &&
                  entry.id !== requestEntry.id &&
                  entry.startTime === block.startTime &&
                  entry.endTime === block.endTime
                );
              }) ? (
                <p className="mt-1 text-xs text-amber-700">
                  برای این تاریخ و بازه، جلسه‌ای برای جابه‌جایی پیدا نشد.
                </p>
              ) : null}
            </Field>
            <Field label="عنوان جلسه جایگزین">
              <Input
                required
                minLength={2}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Field label="پیام برای مدیر (اختیاری)">
              <textarea
                className="min-h-24 w-full rounded-lg border border-[rgb(var(--border-subtle))] p-2"
                maxLength={2000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </Field>
            {timeBlocks.isError ? (
              <p role="alert" className="text-sm text-red-600">
                بازه‌های زمانی دریافت نشدند.
              </p>
            ) : null}
            <Button
              disabled={!targetEntryId || !timeBlockId || title.trim().length < 2 || submitting}
            >
              ارسال برای بررسی مدیر
            </Button>
          </form>
        )}
      </ResponsiveDrawer>
    </section>
  );
}
