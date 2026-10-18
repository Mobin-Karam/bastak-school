import { normalizeTimetableClock } from "../lib/timetable-input";
import { TimetableTimeInput } from "./TimetableTimeInput";
import { TimetableDateInput } from "./TimetableDateInput";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type {
  TimetableLessonDraft,
  TimetableWorkspace,
  TimetableLesson,
  TimetableConflict,
} from "@moshaver/api-contract";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { Button, Field, Input } from "../../../../shared/ui/ui";
import { notify } from "../../../../shared/ui/notifications";
import { previewTimetableLesson, writeTimetableLesson } from "../api/timetable.api.ts";
import { persianWeekdays } from "../lib/timetable-workbook";

const schema = z
  .object({
    classroomId: z.string().uuid("کلاس را انتخاب کنید"),
    classBookId: z.string().uuid("کتاب کلاس را انتخاب کنید"),
    teacherId: z.string().optional(),
    periodId: z.string().uuid("زنگ را انتخاب کنید"),
    locationId: z.string().optional(),
    weekday: z.coerce.number().min(0).max(6),
    startTime: z.preprocess(
      (value) => normalizeTimetableClock(String(value ?? "")),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت معتبر لازم است"),
    ),
    endTime: z.preprocess(
      (value) => normalizeTimetableClock(String(value ?? "")),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت معتبر لازم است"),
    ),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().max(1000),
  })
  .refine((x) => x.endTime > x.startTime, {
    path: ["endTime"],
    message: "پایان باید پس از شروع باشد",
  })
  .refine((x) => x.endsOn >= x.startsOn, { path: ["endsOn"], message: "بازه تاریخ معتبر نیست" });
export const timetableSelectClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-[rgb(var(--surface-card))] px-3 text-sm text-ink dark:border-white/15";
export function TimetableLessonEditor({
  workspace,
  versionId,
  lesson,
  initial,
  open,
  onClose,
  onSaved,
}: {
  workspace: TimetableWorkspace;
  versionId: string;
  lesson?: TimetableLesson;
  initial?: Partial<TimetableLessonDraft>;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const version = workspace.versions.find((x) => x.id === versionId)!;
  const term = workspace.terms.find((x) => x.id === version.termId)!;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      classroomId: lesson?.classroomId ?? initial?.classroomId ?? "",
      classBookId: lesson?.classBookId ?? initial?.classBookId ?? "",
      teacherId: lesson?.teacherId ?? initial?.teacherId ?? "",
      periodId: lesson?.periodId ?? initial?.periodId ?? "",
      locationId: lesson?.locationId ?? initial?.locationId ?? "",
      weekday: lesson?.weekday ?? initial?.weekday ?? 6,
      startTime: lesson?.startTime ?? initial?.startTime ?? "08:00",
      endTime: lesson?.endTime ?? initial?.endTime ?? "08:50",
      startsOn: lesson?.startsOn ?? version.effectiveOn,
      endsOn: lesson?.endsOn ?? term.endsOn,
      notes: lesson?.notes ?? initial?.notes ?? "",
    },
  });
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [checking, setChecking] = useState(false);
  const classroomId = form.watch("classroomId");
  const periodId = form.watch("periodId");
  const values = form.watch();
  const selectedClass = workspace.classes.find((x) => x.id === classroomId);
  const [previewError, setPreviewError] = useState("");
  const dto = useCallback(
    (): TimetableLessonDraft => ({
      ...form.getValues(),
      startTime: normalizeTimetableClock(form.getValues("startTime")),
      endTime: normalizeTimetableClock(form.getValues("endTime")),
      teacherId: form.getValues("teacherId") || null,
      locationId: form.getValues("locationId") || null,
    }),
    [form],
  );
  useEffect(() => {
    let alive = true;
    const timeout = setTimeout(() => {
      if (
        !form.getValues("classBookId") ||
        !form.getValues("classroomId") ||
        !form.getValues("periodId")
      )
        return;
      if (!schema.safeParse(form.getValues()).success) {
        setConflicts([]);
        setPreviewError("");
        setChecking(false);
        return;
      }
      setPreviewError("");
      setChecking(true);
      void previewTimetableLesson(versionId, version.revision, dto(), lesson?.id)
        .then((result) => {
          if (alive) {
            setConflicts(result.conflicts);
            setPreviewError("");
          }
        })
        .catch((error) => {
          if (alive)
            setPreviewError(
              error instanceof Error ? error.message : "بررسی زمان و تداخل انجام نشد.",
            );
        })
        .finally(() => {
          if (alive) setChecking(false);
        });
    }, 500);
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [
    dto,
    form,
    values.classroomId,
    values.classBookId,
    values.teacherId,
    values.periodId,
    values.locationId,
    values.weekday,
    values.startTime,
    values.endTime,
    values.startsOn,
    values.endsOn,
    versionId,
    version.revision,
    lesson?.id,
  ]);
  const save = useMutation({
    mutationFn: () => writeTimetableLesson(versionId, version.revision, dto(), lesson?.id),
    onSuccess: () => {
      notify("درس ذخیره شد.", "success");
      onSaved();
      onClose();
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره انجام نشد.", "error"),
  });
  const unavailable = new Set(
    workspace.lessons
      .filter(
        (x) =>
          x.id !== lesson?.id &&
          x.weekday === Number(values.weekday) &&
          x.startsOn <= values.endsOn &&
          x.endsOn >= values.startsOn &&
          x.startTime < values.endTime &&
          values.startTime < x.endTime,
      )
      .map((x) => x.teacherId),
  );
  const occupied = new Set(
    workspace.lessons
      .filter(
        (x) =>
          x.id !== lesson?.id &&
          x.weekday === Number(values.weekday) &&
          x.startTime < values.endTime &&
          values.startTime < x.endTime,
      )
      .map((x) => x.locationId),
  );
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(value) => {
        if (!value && !save.isPending) onClose();
      }}
      title={lesson ? "ویرایش درس" : "افزودن درس"}
      description="زمان و تخصیص‌ها پیش از ذخیره روی سرور بررسی می‌شوند."
    >
      <form onSubmit={form.handleSubmit(() => save.mutate())} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="کلاس" error={form.formState.errors.classroomId?.message}>
            <select
              className={timetableSelectClass}
              {...form.register("classroomId")}
              onChange={(event) => {
                form.setValue("classroomId", event.target.value);
                form.setValue("classBookId", "");
              }}
            >
              <option value="">انتخاب کلاس</option>
              {workspace.classes.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="کتاب / درس" error={form.formState.errors.classBookId?.message}>
            <select
              className={timetableSelectClass}
              {...form.register("classBookId")}
              onChange={(event) => {
                form.setValue("classBookId", event.target.value);
                form.setValue(
                  "teacherId",
                  selectedClass?.books.find((x) => x.id === event.target.value)?.teacherId ?? "",
                );
              }}
            >
              <option value="">انتخاب کتاب کلاس</option>
              {selectedClass?.books.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="استاد">
            <select className={timetableSelectClass} {...form.register("teacherId")}>
              <option value="">تعیین نشده (فقط پیش‌نویس)</option>
              {[...workspace.teachers]
                .sort((a, b) => Number(unavailable.has(a.id)) - Number(unavailable.has(b.id)))
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {unavailable.has(x.id) ? " · احتمال تداخل" : " · آزاد"}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="اتاق">
            <select className={timetableSelectClass} {...form.register("locationId")}>
              <option value="">بدون اتاق اختصاصی</option>
              {[...workspace.locations]
                .sort((a, b) => Number(occupied.has(a.id)) - Number(occupied.has(b.id)))
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {occupied.has(x.id) ? " · اشغال" : " · آزاد"}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="روز">
            <select className={timetableSelectClass} {...form.register("weekday")}>
              {persianWeekdays.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="زنگ / نوبت" error={form.formState.errors.periodId?.message}>
            <select
              className={timetableSelectClass}
              value={periodId}
              onChange={(event) => {
                const period = workspace.periods.find((x) => x.id === event.target.value);
                form.setValue("periodId", event.target.value);
                if (period) {
                  form.setValue("startTime", period.startTime);
                  form.setValue("endTime", period.endTime);
                }
              }}
            >
              <option value="">انتخاب زنگ</option>
              {workspace.periods.map((x) => (
                <option key={x.id} value={x.id}>
                  {workspace.sessions.find((s) => s.id === x.sessionId)?.name} · {x.name} (
                  {x.startTime}–{x.endTime})
                </option>
              ))}
            </select>
          </Field>
          <Field label="شروع" error={form.formState.errors.startTime?.message}>
            <TimetableTimeInput data-field-control dir="ltr" {...form.register("startTime")} />
          </Field>
          <Field label="پایان" error={form.formState.errors.endTime?.message}>
            <TimetableTimeInput data-field-control dir="ltr" {...form.register("endTime")} />
          </Field>
          <Field label="از تاریخ" error={form.formState.errors.startsOn?.message}>
            <TimetableDateInput
              timeZone={workspace.years.find((year) => year.id === term.yearId)?.timeZone}
              data-field-control
              label="از تاریخ"
              min={version.effectiveOn}
              max={term.endsOn}
              value={form.watch("startsOn")}
              onChange={(iso) =>
                form.setValue("startsOn", iso, { shouldValidate: true, shouldDirty: true })
              }
            />
          </Field>
          <Field label="تا تاریخ" error={form.formState.errors.endsOn?.message}>
            <TimetableDateInput
              timeZone={workspace.years.find((year) => year.id === term.yearId)?.timeZone}
              data-field-control
              label="تا تاریخ"
              min={version.effectiveOn}
              max={term.endsOn}
              value={form.watch("endsOn")}
              onChange={(iso) =>
                form.setValue("endsOn", iso, { shouldValidate: true, shouldDirty: true })
              }
            />
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          تکرار: هر هفته در روز انتخاب‌شده، فقط در بازه بالا؛ تعطیلات و استثناها جدا اعمال می‌شوند.
        </p>
        <Field label="یادداشت">
          <Input {...form.register("notes")} />
        </Field>
        {previewError ? (
          <p role="alert" className="text-sm text-rose-700">
            {previewError}
          </p>
        ) : null}
        <div aria-live="polite">
          {checking ? <p className="text-xs">بررسی تداخل…</p> : null}
          {conflicts.map((x, i) => (
            <p
              key={i}
              className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              {x.message} {x.alternatives.join("؛ ")}
            </p>
          ))}
        </div>
        <Button
          disabled={
            save.isPending ||
            checking ||
            !!previewError ||
            conflicts.some((x) => x.code !== "UNASSIGNED")
          }
        >
          {save.isPending ? "ذخیره…" : "ذخیره درس"}
        </Button>
      </form>
    </ResponsiveModal>
  );
}
