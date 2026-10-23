import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { assertTimetableRange, normalizeTimetableClock } from "../lib/timetable-input";
import { TimetableTimeInput } from "./TimetableTimeInput";
import { TimetableDateInput } from "./TimetableDateInput";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { TimetableWorkspace } from "@moshaver/api-contract";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { Button, Field, Input } from "../../../../shared/ui/ui";
import { notify } from "../../../../shared/ui/notifications";
import { saveTimetableConfig } from "../api/timetable.api";
import { timetableSelectClass } from "./TimetableLessonEditor";
import { persianWeekdays } from "../lib/timetable-workbook";
const kinds = [
  { id: "year", name: "سال تحصیلی" },
  { id: "term", name: "نیم‌سال" },
  { id: "section", name: "بخش مدرسه" },
  { id: "classSection", name: "تخصیص کلاس به بخش" },
  { id: "location", name: "اتاق / محل" },
  { id: "bell", name: "برنامه زنگ" },
  { id: "session", name: "نوبت صبح / عصر" },
  { id: "period", name: "زنگ درسی" },
  { id: "holiday", name: "تعطیلی" },
  { id: "availability", name: "زمان عدم دسترسی استاد" },
  { id: "allocation", name: "سهم هفتگی کتاب" },
];
export function TimetableSettings({
  workspace,
  versionId,
  open,
  onClose,
  onSaved,
  initialKind = "year",
  initialParentId,
  guided = false,
}: {
  workspace: TimetableWorkspace;
  versionId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  initialKind?: string;
  initialParentId?: string;
  guided?: boolean;
}) {
  const [kind, setKind] = useState(initialKind);
  const [values, setValues] = useState<Record<string, string>>(
    initialParentId
      ? {
          parentId: initialParentId,
          ...(initialKind === "period"
            ? {
                number: String(
                  Math.max(
                    0,
                    ...workspace.periods
                      .filter((period) => period.sessionId === initialParentId)
                      .map((period) => period.ordinal),
                  ) + 1,
                ),
              }
            : {}),
        }
      : {},
  );
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const set = (key: string, value: string) => setValues((old) => ({ ...old, [key]: value }));
  const version = workspace.versions.find((x) => x.id === versionId);
  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { kind };
      for (const [key, value] of Object.entries(values))
        if (value) body[key] = key === "number" || key === "weekday" ? Number(value) : value;
      if (["year", "term", "availability"].includes(kind))
        assertTimetableRange(values.startsOn ?? "", values.endsOn ?? "", "date");
      if (["session", "period", "availability"].includes(kind)) {
        body.startTime = normalizeTimetableClock(values.startTime ?? "");
        body.endTime = normalizeTimetableClock(values.endTime ?? "");
        assertTimetableRange(String(body.startTime), String(body.endTime), "time");
      }
      if (kind === "availability") body.weekday = Number(values.weekday ?? 6);
      if (kind === "year") {
        body.active = active;
        body.timeZone = values.timeZone || "Asia/Tehran";
      }
      if (kind === "allocation") {
        body.parentId = versionId;
        body.expectedRevision = version?.revision;
      }
      return saveTimetableConfig(workspace.organizationId, body);
    },
    onSuccess: async () => {
      notify("پیکربندی ذخیره شد.", "success");
      setError("");
      setValues({});
      await onSaved();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "ذخیره انجام نشد."),
  });
  const parentOptions =
    kind === "term"
      ? workspace.years
      : kind === "session"
        ? workspace.bells
        : kind === "period"
          ? workspace.sessions
          : kind === "holiday"
            ? workspace.terms
            : [];
  const dates = ["year", "term", "availability"].includes(kind);
  const times = ["session", "period", "availability"].includes(kind);
  const parentYear = workspace.years.find((y) => y.id === values.parentId);
  const parentSession = workspace.sessions.find((session) => session.id === values.parentId);
  let rangeError = "";
  try {
    if (dates && values.startsOn && values.endsOn)
      assertTimetableRange(values.startsOn, values.endsOn, "date");
    if (times && values.startTime && values.endTime) {
      const start = normalizeTimetableClock(values.startTime),
        end = normalizeTimetableClock(values.endTime);
      assertTimetableRange(start, end, "time");
      if (
        kind === "period" &&
        parentSession &&
        (start < parentSession.startTime || end > parentSession.endTime)
      )
        rangeError = "ساعت زنگ باید داخل بازه نوبت انتخاب‌شده باشد.";
    }
  } catch (error) {
    rangeError = error instanceof Error ? error.message : "بازه نامعتبر است.";
  }
  const selectedClass = workspace.classes.find((x) => x.id === values.classroomId);
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next && !save.isPending) onClose();
      }}
      title={
        guided ? `راه‌اندازی · ${kinds.find((x) => x.id === kind)?.name}` : "تنظیمات برنامه درسی"
      }
      description="ابتدا سال و نیم‌سال، سپس برنامه زنگ، نوبت و زنگ‌های آن را بسازید. نسخه‌های قبلی حفظ می‌شوند."
    >
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        {guided ? (
          <p className="rounded-xl bg-brand/5 p-3 text-sm">
            مرحله {["year", "term", "bell", "session", "period"].indexOf(kind) + 1} از ۶ · مرحله
            راه‌اندازی: {kinds.find((x) => x.id === kind)?.name} · پس از ذخیره، به قدم بعدی می‌روید.
          </p>
        ) : (
          <Field label="بخش تنظیمات">
            <AdaptiveSelect
              className={timetableSelectClass}
              value={kind}
              onChange={(event) => {
                setKind(event.target.value);
                setValues({});
                setError("");
              }}
            >
              {kinds.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AdaptiveSelect>
          </Field>
        )}
        {!["availability", "allocation", "classSection"].includes(kind) ? (
          <Field label="نام">
            <Input
              required
              value={values.name ?? ""}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
        ) : null}
        {parentOptions.length || ["term", "session", "period", "holiday"].includes(kind) ? (
          <Field
            label={
              kind === "term"
                ? "سال تحصیلی"
                : kind === "session"
                  ? "برنامه زنگ"
                  : kind === "period"
                    ? "نوبت"
                    : "نیم‌سال"
            }
          >
            <AdaptiveSelect
              required
              className={timetableSelectClass}
              value={values.parentId ?? ""}
              onChange={(event) => {
                set("parentId", event.target.value);
                if (kind === "period")
                  set(
                    "number",
                    String(
                      Math.max(
                        0,
                        ...workspace.periods
                          .filter((p) => p.sessionId === event.target.value)
                          .map((p) => p.ordinal),
                      ) + 1,
                    ),
                  );
              }}
            >
              <option value="">انتخاب</option>
              {parentOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AdaptiveSelect>
          </Field>
        ) : null}
        {dates ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="از تاریخ">
              <TimetableDateInput
                timeZone={
                  parentYear?.timeZone ?? workspace.years.find((year) => year.active)?.timeZone
                }
                data-field-control
                label="از تاریخ"
                min={kind === "term" ? parentYear?.startsOn : undefined}
                max={kind === "term" ? parentYear?.endsOn : values.endsOn || undefined}
                required

                value={values.startsOn ?? ""}
                onChange={(iso) => set("startsOn", iso)}
              />
            </Field>
            <Field label="تا تاریخ">
              <TimetableDateInput
                timeZone={
                  parentYear?.timeZone ?? workspace.years.find((year) => year.active)?.timeZone
                }
                data-field-control
                label="تا تاریخ"
                min={values.startsOn || (kind === "term" ? parentYear?.startsOn : undefined)}
                max={kind === "term" ? parentYear?.endsOn : undefined}
                required

                value={values.endsOn ?? ""}
                onChange={(iso) => set("endsOn", iso)}
              />
            </Field>
          </div>
        ) : null}
        {kind === "year" ? (
          <>
            <Field label="منطقه زمانی IANA">
              <Input
                dir="ltr"
                value={values.timeZone ?? "Asia/Tehran"}
                onChange={(event) => set("timeZone", event.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              سال فعال مدرسه
            </label>
            {workspace.years.map((year) => (
              <Button
                type="button"
                key={year.id}
                disabled={save.isPending || year.active}
                onClick={() => {
                  void saveTimetableConfig(workspace.organizationId, {
                    kind: "year",
                    id: year.id,
                    startsOn: year.startsOn,
                    endsOn: year.endsOn,
                    timeZone: year.timeZone,
                    active: true,
                  })
                    .then(onSaved)
                    .catch((e) => setError(e.message));
                }}
              >
                {year.name}
                {year.active ? " · فعال" : " · فعال‌سازی"}
              </Button>
            ))}
          </>
        ) : null}
        {kind === "bell" || kind === "classSection" ? (
          <Field label="بخش مدرسه">
            <AdaptiveSelect
              className={timetableSelectClass}
              required={kind === "classSection"}
              value={values.sectionId ?? ""}
              onChange={(event) => set("sectionId", event.target.value)}
            >
              <option value="">همه بخش‌ها</option>
              {workspace.sections.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AdaptiveSelect>
          </Field>
        ) : null}
        {kind === "session" ? (
          <Field label="نوع نوبت">
            <AdaptiveSelect
              className={timetableSelectClass}
              value={values.sessionKind ?? "MORNING"}
              onChange={(event) => set("sessionKind", event.target.value)}
            >
              <option value="MORNING">صبح</option>
              <option value="AFTERNOON">عصر</option>
              <option value="OTHER">سایر</option>
            </AdaptiveSelect>
          </Field>
        ) : null}
        {kind === "period" && parentSession ? (
          <p className="rounded-xl bg-brand/5 p-3 text-sm">
            این زنگ باید داخل نوبت {parentSession.name} از {parentSession.startTime} تا{" "}
            {parentSession.endTime} باشد.
          </p>
        ) : null}
        {times ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="شروع">
              <TimetableTimeInput
                data-field-control
                required

                value={values.startTime ?? ""}
                onChange={(event) => set("startTime", event.target.value)}
              />
            </Field>
            <Field label="پایان">
              <TimetableTimeInput
                data-field-control
                required

                value={values.endTime ?? ""}
                onChange={(event) => set("endTime", event.target.value)}
              />
            </Field>
          </div>
        ) : null}
        {["period", "location", "allocation"].includes(kind) ? (
          <Field
            label={
              kind === "period" ? "شماره زنگ" : kind === "location" ? "ظرفیت" : "تعداد درس در هفته"
            }
          >
            <Input
              required
              type="number"
              min={1}
              max={500}
              value={values.number ?? "1"}
              onChange={(event) => set("number", event.target.value)}
            />
          </Field>
        ) : null}
        {kind === "holiday" ? (
          <Field label="تاریخ تعطیلی">
            <TimetableDateInput
              timeZone={
                parentYear?.timeZone ?? workspace.years.find((year) => year.active)?.timeZone
              }
              data-field-control
              label="تاریخ تعطیلی"
              required

              value={values.date ?? ""}
              onChange={(iso) => set("date", iso)}
            />
          </Field>
        ) : null}
        {kind === "allocation" || kind === "classSection" ? (
          <Field label="کلاس">
            <AdaptiveSelect
              required
              className={timetableSelectClass}
              value={values.classroomId ?? ""}
              onChange={(event) => set("classroomId", event.target.value)}
            >
              <option value="">انتخاب کلاس</option>
              {workspace.classes.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AdaptiveSelect>
          </Field>
        ) : null}
        {kind === "allocation" ? (
          <Field label="کتاب کلاس">
            <AdaptiveSelect
              required
              className={timetableSelectClass}
              value={values.classBookId ?? ""}
              onChange={(event) => set("classBookId", event.target.value)}
            >
              <option value="">انتخاب کتاب</option>
              {selectedClass?.books.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AdaptiveSelect>
            <p className="mt-1 text-xs text-slate-500">
              برای نسخه پیش‌نویس انتخاب‌شده؛ عدم تکمیل سهم هفتگی مانع انتشار است.
            </p>
          </Field>
        ) : null}
        {kind === "availability" ? (
          <>
            <Field label="استاد">
              <AdaptiveSelect
                required
                className={timetableSelectClass}
                value={values.teacherId ?? ""}
                onChange={(event) => set("teacherId", event.target.value)}
              >
                <option value="">انتخاب استاد</option>
                {workspace.teachers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </AdaptiveSelect>
            </Field>
            <Field label="روز">
              <AdaptiveSelect
                className={timetableSelectClass}
                value={values.weekday ?? "6"}
                onChange={(event) => set("weekday", event.target.value)}
              >
                {persianWeekdays.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </AdaptiveSelect>
            </Field>
            <Field label="دلیل">
              <Input
                value={values.reason ?? ""}
                onChange={(event) => set("reason", event.target.value)}
              />
            </Field>
          </>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        {rangeError ? (
          <p role="alert" className="text-sm text-rose-700">
            {rangeError}
          </p>
        ) : null}
        <Button
          disabled={
            save.isPending || !!rangeError || (kind === "allocation" && version?.state !== "DRAFT")
          }
        >
          {save.isPending ? "ذخیره…" : guided ? "ذخیره و ادامه" : "ذخیره تنظیمات"}
        </Button>
      </form>
    </ResponsiveModal>
  );
}
