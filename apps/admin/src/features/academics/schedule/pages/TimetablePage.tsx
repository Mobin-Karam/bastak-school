import { assertTimetableRange } from "../lib/timetable-input";
import { TimetableTimeInput } from "../components/TimetableTimeInput";
import { TimetableDateInput } from "../components/TimetableDateInput";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Printer,
  Settings2,
  Upload,
  Undo2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type {
  TimetableWorkspace,
  TimetableLesson,
  TimetableLessonDraft,
  TimetableOccurrence,
  TimetablePeriod,
  TimetableOverrideDraft,
} from "@moshaver/api-contract";
import { useAuth } from "../../auth";
import { Button, Card, EmptyState, Field, Input, LoadingState } from "../../../shared/ui/ui";
import { ResponsiveModal } from "../../../shared/ui/responsive-modal";
import { useMobileDialog } from "../../../shared/ui/responsive-modal";
import { notify } from "../../../shared/ui/notifications";
import { defineSpreadsheet, downloadSpreadsheet } from "../../../shared/lib/spreadsheet-transfer";
import {
  getTimetable,
  createTimetableVersion,
  writeTimetableLesson,
  removeTimetableLesson,
  publishTimetable,
  overrideTimetable,
  openTimetableAttendance,
  getTimetableAttendanceReport,
} from "../api/timetable.api";
import { TimetableLessonEditor, timetableSelectClass } from "../components/TimetableLessonEditor";
import { timetableSetup, TimetableOnboarding } from "../components/TimetableOnboarding";
import { TimetableSettings } from "../components/TimetableSettings";
import { TimetableImportWizard } from "../components/TimetableImportWizard";
import { TimetableGrid } from "../components/TimetableGrid";
import { persianWeekdays } from "../lib/timetable-workbook";
import {
  timetableAddDays,
  timetableDateLabel,
  timetableToday,
  timetableWeekStart,
} from "../lib/timetable-time";
import "../timetable.css";
const views = [
  { id: "class", name: "کلاس" },
  { id: "teacher", name: "استاد" },
  { id: "room", name: "اتاق" },
  { id: "all", name: "همه کلاس‌ها" },
  { id: "daily", name: "روزانه" },
  { id: "unassigned", name: "تخصیص ناقص" },
  { id: "conflicts", name: "تداخل‌ها" },
];
export function TimetablePage() {
  const auth = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const mobile = useMobileDialog();
  const full = auth.can("schedule.read.all");
  const org = auth.context?.activeOrganization?.id;
  const [versionId, setVersionId] = useState("");
  const [yearId, setYearId] = useState("");
  const [view, setView] = useState(full ? "class" : "daily");
  const [week, setWeek] = useState(() => timetableWeekStart(timetableToday()));
  const [selectedDay, setSelectedDay] = useState(() =>
    new Date(`${timetableToday()}T12:00:00Z`).getUTCDay(),
  );
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [session, setSession] = useState("");
  const [settings, setSettings] = useState(false);
  const [setupStep, setSetupStep] = useState<{ kind: string; parentId?: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importAfterVersion, setImportAfterVersion] = useState(false);
  const [editor, setEditor] = useState<{
    lesson?: TimetableLesson;
    initial?: Partial<TimetableLessonDraft>;
  } | null>(null);
  const [detail, setDetail] = useState<TimetableLesson | null>(null);
  const [newVersion, setNewVersion] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [overrideDate, setOverrideDate] = useState(timetableToday());
  const [cancelled, setCancelled] = useState(false);
  const [subTeacher, setSubTeacher] = useState("");
  const [subRoom, setSubRoom] = useState("");
  const [subStart, setSubStart] = useState("");
  const [subEnd, setSubEnd] = useState("");
  const [undo, setUndo] = useState<{ lesson: TimetableLesson; revision: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const queryKey = ["timetable", org, versionId, week, auth.activeRole];
  const workspace = useQuery({
    queryKey,
    queryFn: () => getTimetable(org!, versionId || undefined, week),
    enabled: !!org,
  });
  const attendanceReport = useQuery({
    queryKey: ["timetable-attendance-report", org, week, auth.activeRole],
    queryFn: () => getTimetableAttendanceReport(org!, week, timetableAddDays(week, 6)),
    enabled: !!org && full,
  });
  const data = workspace.data;
  const selectedVersion =
    data?.versions.find((x) => x.id === (versionId || data.lessons[0]?.versionId)) ??
    data?.versions.find((x) => x.state === "PUBLISHED");
  const currentVersionId = selectedVersion?.id ?? "";
  const timeZone =
    data?.years.find(
      (y) => y.id === data.terms.find((t) => t.id === selectedVersion?.termId)?.yearId,
    )?.timeZone ?? "Asia/Tehran";
  const today = timetableToday(timeZone);
  const editable =
    selectedVersion?.state === "DRAFT" && auth.canAny(["schedule.create", "schedule.update"]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setVersionId("");
    setClassId("");
    setTeacherId("");
    setRoomId("");
    setYearId("");
    setImportOpen(false);
    setImportAfterVersion(false);
    setSettings(false);
    setSetupStep(null);
    setNewVersion(false);
    setEditor(null);
    setDetail(null);
    setUndo(null);
    setView(full ? "class" : "daily");
  }, [org, auth.activeRole, full]);
  const reload = () => client.invalidateQueries({ queryKey: ["timetable", org] });
  const filtered = useMemo(
    () =>
      (data?.lessons ?? []).filter(
        (x) =>
          (!classId || x.classroomId === classId) &&
          (!teacherId || x.teacherId === teacherId) &&
          (!roomId || x.locationId === roomId) &&
          (!subjectId || x.classBookId === subjectId) &&
          (!grade || String(x.gradeId) === grade) &&
          (!sectionId || x.sectionId === sectionId) &&
          (!session || x.sessionKind === session),
      ),
    [data, classId, teacherId, roomId, subjectId, grade, sectionId, session],
  );
  const ids = new Set(filtered.map((x) => x.id));
  const occurrences = (data?.occurrences ?? []).filter((x) => ids.has(x.id));
  const dayDate = timetableAddDays(week, (selectedDay + 1) % 7);
  const daily = occurrences
    .filter((x) => x.date === dayDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const live = occurrences.find(
    (x) => !x.cancelled && Date.parse(x.startsAt) <= now && Date.parse(x.endsAt) > now,
  );
  const next = occurrences
    .filter((x) => !x.cancelled && Date.parse(x.startsAt) > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const saveMove = useMutation({
    mutationFn: ({
      lesson,
      period,
      weekday,
    }: {
      lesson: TimetableLesson;
      period: TimetablePeriod;
      weekday: number;
    }) =>
      writeTimetableLesson(
        currentVersionId,
        selectedVersion!.revision,
        {
          ...lesson,
          periodId: period.id,
          weekday,
          startTime: period.startTime,
          endTime: period.endTime,
        },
        lesson.id,
      ),
    onMutate: async (variables) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<TimetableWorkspace>(queryKey);
      client.setQueryData<TimetableWorkspace>(queryKey, (old) =>
        old
          ? {
              ...old,
              lessons: old.lessons.map((x) =>
                x.id === variables.lesson.id
                  ? {
                      ...x,
                      weekday: variables.weekday,
                      periodId: variables.period.id,
                      startTime: variables.period.startTime,
                      endTime: variables.period.endTime,
                    }
                  : x,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
      notify(error instanceof Error ? error.message : "جابجایی انجام نشد.", "error");
    },
    onSuccess: (result, variables) => {
      setUndo({ lesson: variables.lesson, revision: result.revision });
      notify("درس جابجا شد.", "success");
    },
    onSettled: () => void reload(),
  });
  const remove = useMutation({
    mutationFn: () =>
      removeTimetableLesson(currentVersionId, detail!.id, selectedVersion!.revision),
    onSuccess: () => {
      setUndo({ lesson: detail!, revision: selectedVersion!.revision + 1 });
      setDeleteOpen(false);
      setDetail(null);
      void reload();
      notify("درس از پیش‌نویس حذف شد.", "success");
    },
    onError: (e) => notify(e.message, "error"),
  });
  const publish = useMutation({
    mutationFn: () => publishTimetable(currentVersionId, selectedVersion!.revision, reason),
    onSuccess: () => {
      setPublishOpen(false);
      setUndo(null);
      void reload();
      notify("برنامه منتشر شد.", "success");
    },
    onError: (e) => notify(e.message, "error"),
  });
  const override = useMutation({
    mutationFn: () => {
      const body: TimetableOverrideDraft = {
        lessonId: detail!.id,
        date: overrideDate,
        cancelled,
        reason,
        ...(subTeacher ? { teacherId: subTeacher } : {}),
        ...(subRoom ? { locationId: subRoom } : {}),
        ...(subStart ? { startTime: subStart } : {}),
        ...(subEnd ? { endTime: subEnd } : {}),
      };
      return overrideTimetable(currentVersionId, selectedVersion!.revision, body);
    },
    onSuccess: () => {
      setOverrideOpen(false);
      setDetail(null);
      void reload();
      notify("تغییر ثبت شد؛ سوابق حضور حفظ شدند.", "success");
    },
    onError: (e) => notify(e.message, "error"),
  });
  const attendance = useMutation({
    mutationFn: ({ lesson, date }: { lesson: TimetableLesson; date: string }) =>
      openTimetableAttendance(lesson.id, date),
    onSuccess: (result, variables) => {
      navigate(
        `/admin/attendance?contextType=class&contextId=${variables.lesson.classroomId}&sessionId=${result.sessionId}`,
      );
    },
    onError: (e) => notify(e.message, "error"),
  });
  const undoChange = useMutation({
    mutationFn: () =>
      writeTimetableLesson(
        currentVersionId,
        selectedVersion!.revision,
        undo!.lesson,
        undo!.lesson.id,
      ),
    onSuccess: () => {
      setUndo(null);
      void reload();
      notify("تغییر بازگردانده شد.", "success");
    },
    onError: (e) => notify(e.message, "error"),
  });
  const exportRows = () => {
    const definition = defineSpreadsheet<Record<string, unknown>>({
      sheetName: "برنامه درسی",
      columns: [
        { key: "classroomName", header: "کلاس" },
        { key: "title", header: "درس" },
        { key: "teacherName", header: "استاد" },
        { key: "locationName", header: "اتاق" },
        { key: "day", header: "روز" },
        { key: "periodName", header: "زنگ" },
        { key: "startTime", header: "شروع" },
        { key: "endTime", header: "پایان" },
        { key: "startsOn", header: "از تاریخ (شمسی)" },
        { key: "endsOn", header: "تا تاریخ (شمسی)" },
      ],
    });
    void downloadSpreadsheet(
      definition,
      filtered.map((x) => ({
        ...x,
        startsOn: timetableDateLabel(x.startsOn),
        endsOn: timetableDateLabel(x.endsOn),
        day: persianWeekdays.find((d) => d.id === x.weekday)?.name,
      })),
      "برنامه-درسی.xlsx",
    ).catch((e) => notify(e.message, "error"));
  };
  if (!org)
    return (
      <Card className="p-4">
        <h2 className="sr-only">برنامه درسی</h2>
        <Field label="مدرسه">
          <select
            className={timetableSelectClass}
            value=""
            onChange={(event) => {
              const organization = auth.context?.availableOrganizations.find(
                (x) => x.id === event.target.value,
              );
              if (organization) void auth.setActiveOrganization(organization);
            }}
          >
            <option value="" disabled>
              مدرسه را انتخاب کنید
            </option>
            {auth.context?.availableOrganizations.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
      </Card>
    );
  if (workspace.isLoading) return <LoadingState label="دریافت برنامه درسی…" />;
  if (workspace.isError || !data)
    return (
      <Card className="grid gap-3 p-4">
        <p role="alert">
          {workspace.error instanceof Error ? workspace.error.message : "دریافت برنامه انجام نشد."}
        </p>
        <Button onClick={() => void workspace.refetch()}>تلاش دوباره</Button>
      </Card>
    );
  const showSetup =
    full && !data.versions.some((v) => v.state === "PUBLISHED") && !data.lessons.length;
  const periodIds = new Set(filtered.map((x) => x.periodId));
  const periods = [...data.periods]
    .filter((x) => !session || data.sessions.find((s) => s.id === x.sessionId)?.kind === session)
    .filter((x) => editable || periodIds.has(x.id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <section className="timetable-page grid min-w-0 gap-4" dir="rtl">
      <section className="timetable-controls flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="sr-only">
            <CalendarDays size={22} />
            برنامه درسی
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {auth.context?.activeOrganization?.name} · {timeZone} ·{" "}
            {selectedVersion
              ? `${selectedVersion.name} — ${selectedVersion.state === "DRAFT" ? "پیش‌نویس" : selectedVersion.state === "PUBLISHED" ? "منتشرشده" : "بایگانی"}`
              : "هنوز نسخه منتشرشده‌ای وجود ندارد"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showSetup && auth.can("schedule.import") ? (
            <Button variant="soft" onClick={() => setImportOpen(true)}>
              ورود اکسل
            </Button>
          ) : null}
          {auth.can("schedule.update") ? (
            <Button
              variant="soft"
              onClick={() => {
                setSetupStep(null);
                setSettings(true);
              }}
            >
              <Settings2 size={16} />
              تنظیمات
            </Button>
          ) : null}
          {auth.can("schedule.create") ? (
            <Button variant="soft" onClick={() => setNewVersion(true)}>
              پیش‌نویس جدید
            </Button>
          ) : null}
          {editable && auth.can("schedule.create") ? (
            <Button onClick={() => setEditor({})}>
              <Plus size={16} />
              افزودن درس
            </Button>
          ) : null}
        </div>
      </section>
      {showSetup ? (
        <TimetableOnboarding
          workspace={data}
          canConfigure={auth.can("schedule.update")}
          canCreate={auth.can("schedule.create")}
          canImport={auth.can("schedule.import")}
          onConfigure={(kind, parentId) => {
            setSetupStep({ kind, parentId });
            setSettings(true);
          }}
          onCreate={() => setNewVersion(true)}
          onImport={(id) => {
            setVersionId(id);
            setImportOpen(true);
          }}
          onManual={(id) => {
            setVersionId(id);
            setEditor({});
          }}
        />
      ) : null}
      <div hidden={showSetup} className={showSetup ? "hidden" : "grid min-w-0 gap-4"}>
        <div className="timetable-controls flex flex-wrap items-center gap-2">
          <label className="text-xs">
            سال تحصیلی
            <select
              className={timetableSelectClass}
              value={yearId}
              onChange={(event) => {
                setYearId(event.target.value);
                setVersionId("");
              }}
            >
              <option value="">همه سال‌ها</option>
              {data.years.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                  {x.active ? " · فعال" : ""}
                </option>
              ))}
            </select>
          </label>
          {full ? (
            <label className="text-xs">
              نسخه برنامه
              <select
                className={timetableSelectClass}
                value={versionId}
                onChange={(event) => {
                  setVersionId(event.target.value);
                  setUndo(null);
                }}
              >
                <option value="">نسخه فعال منتشرشده</option>
                {data.versions
                  .filter(
                    (v) => !yearId || data.terms.find((t) => t.id === v.termId)?.yearId === yearId,
                  )
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} ·{" "}
                      {x.state === "DRAFT"
                        ? "پیش‌نویس"
                        : x.state === "PUBLISHED"
                          ? "منتشرشده"
                          : "بایگانی"}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              variant="soft"
              aria-label="هفته قبل"
              onClick={() => setWeek(timetableAddDays(week, -7))}
            >
              <ChevronRight size={16} />
            </Button>
            <span className="text-sm">{timetableDateLabel(week, timeZone)}</span>
            <Button
              variant="soft"
              aria-label="هفته بعد"
              onClick={() => setWeek(timetableAddDays(week, 7))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                setWeek(timetableWeekStart(today));
                setSelectedDay(new Date(`${today}T12:00:00Z`).getUTCDay());
              }}
            >
              امروز
            </Button>
          </div>
        </div>
        {full ? (
          <>
            <nav
              className="timetable-controls flex gap-2 overflow-x-auto pb-1"
              aria-label="نمای برنامه"
            >
              {views.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setView(x.id)}
                  aria-pressed={view === x.id}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-brand ${view === x.id ? "bg-brand text-white" : "border text-ink"}`}
                >
                  {x.name}
                  {x.id === "conflicts" ? ` (${data.conflicts.length})` : ""}
                </button>
              ))}
            </nav>
            <div className="timetable-controls grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
              {[
                { label: "کلاس", value: classId, set: setClassId, options: data.classes },
                {
                  label: "پایه",
                  value: grade,
                  set: setGrade,
                  options: [...new Set(data.classes.map((x) => String(x.gradeId)))].map((id) => ({
                    id,
                    name: id,
                  })),
                },
                { label: "استاد", value: teacherId, set: setTeacherId, options: data.teachers },
                {
                  label: "کتاب",
                  value: subjectId,
                  set: setSubjectId,
                  options: data.classes.flatMap((x) => x.books),
                },
                { label: "اتاق", value: roomId, set: setRoomId, options: data.locations },
                { label: "بخش", value: sectionId, set: setSectionId, options: data.sections },
                {
                  label: "نوبت",
                  value: session,
                  set: setSession,
                  options: [
                    { id: "MORNING", name: "صبح" },
                    { id: "AFTERNOON", name: "عصر" },
                    { id: "OTHER", name: "سایر" },
                  ],
                },
              ].map((filter) => (
                <label key={filter.label} className="text-xs">
                  {filter.label}
                  <select
                    className={timetableSelectClass}
                    value={filter.value}
                    onChange={(event) => filter.set(event.target.value)}
                  >
                    <option value="">همه</option>
                    {filter.options.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </>
        ) : null}
        <div className="timetable-controls flex flex-wrap items-center gap-2">
          {auth.can("schedule.export") ? (
            <Button variant="soft" onClick={exportRows}>
              <Download size={15} />
              اکسل نمای فعلی
            </Button>
          ) : null}
          <Button variant="soft" onClick={() => window.print()}>
            <Printer size={15} />
            چاپ / PDF
          </Button>
          {auth.can("schedule.import") ? (
            <Button variant="soft" onClick={() => setImportOpen(true)}>
              <Upload size={15} />
              ورود اکسل
            </Button>
          ) : null}
          {editable && auth.can("schedule.publish") ? (
            <Button
              disabled={!!data.conflicts.length || !data.lessons.length}
              onClick={() => {
                setReason("");
                setPublishOpen(true);
              }}
            >
              انتشار برنامه
            </Button>
          ) : null}
          {undo && editable ? (
            <Button
              variant="soft"
              disabled={undoChange.isPending}
              onClick={() => undoChange.mutate()}
            >
              <Undo2 size={15} />
              بازگردانی آخرین تغییر
            </Button>
          ) : null}
          {workspace.isFetching ? (
            <span role="status" className="text-xs text-slate-500">
              به‌روزرسانی…
            </span>
          ) : null}
        </div>
        {full ? (
          <Card className="grid gap-2 p-3" aria-label="پایش اجرای برنامه و حضور">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">پایش اجرای برنامه و حضور</h3>
                <p className="text-xs text-slate-500">
                  {timetableDateLabel(week, timeZone)} تا{" "}
                  {timetableDateLabel(timetableAddDays(week, 6), timeZone)}
                </p>
              </div>
              {attendanceReport.isFetching ? (
                <span role="status" className="text-xs text-slate-500">
                  به‌روزرسانی…
                </span>
              ) : null}
            </div>
            {attendanceReport.isError ? (
              <p role="alert" className="text-sm text-red-600">
                گزارش حضور این بازه دریافت نشد.
              </p>
            ) : attendanceReport.data ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
                  {[
                    ["برنامه‌ریزی‌شده", attendanceReport.data.planned],
                    ["لغوشده", attendanceReport.data.cancelled],
                    ["جلسه حضور باز", attendanceReport.data.attendanceOpened],
                    ["دارای ثبت حضور", attendanceReport.data.attendanceRecorded],
                    ["در انتظار حضور", attendanceReport.data.awaitingAttendance],
                  ].map(([label, count]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg bg-[rgb(var(--surface-muted))] p-2"
                    >
                      <strong className="block text-lg">{count}</strong>
                      <span className="text-xs text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>
                {attendanceReport.data.classes.length ? (
                  <p className="text-xs text-slate-500">
                    {attendanceReport.data.classes
                      .map(
                        (row) => `${row.classroomName}: ${row.attendanceRecorded}/${row.planned}`,
                      )
                      .join(" · ")}
                  </p>
                ) : null}
                {attendanceReport.data.subjects.length ? (
                  <p className="text-xs text-slate-500">
                    {attendanceReport.data.subjects
                      .map((row) => `${row.subjectName}: ${row.attendanceRecorded}/${row.planned}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </>
            ) : null}
          </Card>
        ) : null}
        {!full ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Card className="p-3">
              <p className="text-xs text-slate-500">درس جاری</p>
              {live ? (
                <>
                  <strong className="block">{live.title}</strong>
                  <p className="mt-1 text-sm">
                    {live.teacherName} · {live.locationName || live.classroomName}
                  </p>
                  <p className="mt-1 text-xs">
                    {Math.max(0, Math.ceil((Date.parse(live.endsAt) - now) / 60000))} دقیقه باقی
                    مانده
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm">اکنون کلاس فعالی ندارید.</p>
              )}
            </Card>
            <Card className="p-3">
              <p className="text-xs text-slate-500">درس بعدی</p>
              {next ? (
                <>
                  <strong className="block">{next.title}</strong>
                  <p className="mt-1 text-sm">
                    {next.teacherName} · {next.locationName || next.classroomName}
                  </p>
                  <p className="mt-1 text-xs">
                    {timetableDateLabel(next.date, timeZone)} · {next.startTime}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm">در این هفته درس بعدی ثبت نشده است.</p>
              )}
            </Card>
          </div>
        ) : null}
        {view === "conflicts" ? (
          <div className="grid gap-3">
            {data.conflicts.length ? (
              data.conflicts.map((x, i) => (
                <Card key={i} className="p-3">
                  <strong className="text-sm">{x.message}</strong>
                  <p className="mt-1 text-xs">
                    {x.date ? timetableDateLabel(x.date, timeZone) : ""} ·{" "}
                    {x.alternatives.join("؛ ")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {x.lessonIds.map((id) => {
                      const lesson = data.lessons.find((l) => l.id === id);
                      return lesson ? (
                        <Button
                          key={id}
                          variant="soft"
                          onClick={() => (editable ? setEditor({ lesson }) : setDetail(lesson))}
                        >
                          بازبینی {lesson.title}
                        </Button>
                      ) : null;
                    })}
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState title="تداخلی پیدا نشد." />
            )}
          </div>
        ) : view === "unassigned" ? (
          <div className="grid gap-2">
            {filtered
              .filter((x) => !x.teacherId)
              .map((x) => (
                <LessonSummary key={x.id} lesson={x} onClick={() => setDetail(x)} />
              ))}
            {!filtered.some((x) => !x.teacherId) ? (
              <EmptyState title="همه درس‌ها استاد دارند." />
            ) : null}
          </div>
        ) : mobile || view === "daily" || !full ? (
          <>
            <nav className="timetable-controls flex gap-2 overflow-x-auto" aria-label="روزهای هفته">
              {persianWeekdays.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  aria-pressed={selectedDay === day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`min-h-11 shrink-0 rounded-lg px-3 text-sm ${selectedDay === day.id ? "bg-brand text-white" : "border"}`}
                >
                  {day.name}
                </button>
              ))}
            </nav>
            <p className="text-sm font-medium">{timetableDateLabel(dayDate, timeZone)}</p>
            <div className="grid gap-3">
              {daily.map((x) => (
                <OccurrenceCard
                  key={`${x.id}:${x.date}`}
                  occurrence={x}
                  now={now}
                  onClick={() => setDetail(x)}
                  canAttend={auth.can("attendance.class.manage")}
                  onAttend={() => attendance.mutate({ lesson: x, date: x.date })}
                  busy={attendance.isPending}
                />
              ))}
              {!daily.length ? (
                <EmptyState
                  title={
                    data.holidays.some((x) => x.date === dayDate)
                      ? `تعطیل: ${data.holidays.find((x) => x.date === dayDate)?.name}`
                      : "برای این روز درسی ثبت نشده است."
                  }
                />
              ) : null}
            </div>
            {!full ? (
              <p className="text-xs text-slate-500">
                این هفته {occurrences.filter((x) => !x.cancelled).length} درس ·{" "}
                {occurrences
                  .filter((x) => !x.cancelled)
                  .reduce(
                    (n, x) => n + (Date.parse(x.endsAt) - Date.parse(x.startsAt)) / 60000,
                    0,
                  )}{" "}
                دقیقه ·{" "}
                {
                  data.periods.filter(
                    (x) => !daily.some((l) => l.periodId === x.id && !l.cancelled),
                  ).length
                }{" "}
                زنگ آزاد در روز انتخاب‌شده
              </p>
            ) : null}
          </>
        ) : periods.length ? (
          <TimetableGrid
            lessons={filtered}
            periods={periods}
            editable={!!editable && !saveMove.isPending}
            onEdit={(lesson) => setDetail(lesson)}
            onAdd={(period, weekday) =>
              setEditor({
                initial: {
                  classroomId: classId || undefined,
                  periodId: period.id,
                  weekday,
                  startTime: period.startTime,
                  endTime: period.endTime,
                },
              })
            }
            onMove={(lesson, period, weekday) => saveMove.mutate({ lesson, period, weekday })}
          />
        ) : (
          <EmptyState
            title={
              data.periods.length
                ? "در این نما درسی نیست؛ فیلترها را بازبینی کنید."
                : "ابتدا سال، نیم‌سال و زنگ‌های مدرسه را از تنظیمات بسازید."
            }
          />
        )}
        {full && data.changes.length ? (
          <details className="timetable-controls rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-bold">
              تغییرهای اخیر و سابقه برنامه
            </summary>
            <div className="mt-3 grid gap-2">
              {data.changes.slice(0, 20).map((x) => (
                <p key={x.id} className="border-b pb-2 text-xs">
                  {x.actorName} · {new Date(x.createdAt).toLocaleString("fa-IR")} · {x.beforeText} ←{" "}
                  {x.afterText} · {x.reason}
                </p>
              ))}
            </div>
          </details>
        ) : null}
      </div>
      {editor && selectedVersion ? (
        <TimetableLessonEditor
          key={editor.lesson?.id ?? `${editor.initial?.periodId}:${editor.initial?.weekday}`}
          open
          workspace={data}
          versionId={currentVersionId}
          lesson={editor.lesson}
          initial={editor.initial}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setUndo(null);
            void reload();
          }}
        />
      ) : null}
      {settings ? (
        <TimetableSettings
          open
          workspace={data}
          versionId={currentVersionId}
          key={setupStep?.kind ?? "advanced"}
          initialKind={setupStep?.kind}
          initialParentId={setupStep?.parentId}
          guided={!!setupStep}
          onClose={() => {
            setSettings(false);
            setSetupStep(null);
          }}
          onSaved={async () => {
            await reload();
            if (!setupStep) return;
            const fresh = client.getQueryData<TimetableWorkspace>(queryKey);
            if (!fresh) return;
            const progress = timetableSetup(fresh);
            const next = progress.steps[progress.next];
            if (next && next.kind !== "draft") {
              setSetupStep({ kind: next.kind, parentId: next.parentId });
            } else {
              setSettings(false);
              setSetupStep(null);
              if (next?.kind === "draft") setNewVersion(true);
            }
          }}
        />
      ) : null}
      {importOpen && selectedVersion?.state === "DRAFT" ? (
        <TimetableImportWizard
          open
          workspace={data}
          versionId={currentVersionId}
          onClose={() => setImportOpen(false)}
          onSaved={() => void reload()}
        />
      ) : null}
      {importOpen && selectedVersion?.state !== "DRAFT" ? (
        <ResponsiveModal
          open
          onOpenChange={setImportOpen}
          title="ورود برنامه از اکسل"
          description="ابتدا پیش‌نویس مقصد را انتخاب کنید؛ سپس فایل و اتصال‌های آن را بررسی می‌کنیم."
        >
          <div className="grid gap-3">
            {data.versions
              .filter((v) => v.state === "DRAFT")
              .map((v) => (
                <Button key={v.id} variant="soft" onClick={() => setVersionId(v.id)}>
                  ورود به {v.name}
                </Button>
              ))}
            {!data.versions.some((v) => v.state === "DRAFT") ? (
              <p>هنوز پیش‌نویسی وجود ندارد. سال و نیم‌سال را تنظیم کنید و پیش‌نویس بسازید.</p>
            ) : null}
            {auth.can("schedule.create") && data.terms.length > 0 ? (
              <Button
                onClick={() => {
                  setImportOpen(false);
                  setImportAfterVersion(true);
                  setNewVersion(true);
                }}
              >
                ساخت پیش‌نویس مقصد
              </Button>
            ) : null}
            {auth.can("schedule.update") ? (
              <Button
                variant="soft"
                onClick={() => {
                  setImportOpen(false);
                  setSettings(true);
                }}
              >
                تنظیم سال، نیم‌سال و زنگ‌ها
              </Button>
            ) : null}
          </div>
        </ResponsiveModal>
      ) : null}
      {newVersion ? (
        <NewVersionModal
          workspace={data}
          copyVersionId={currentVersionId}
          onClose={() => {
            setNewVersion(false);
            setImportAfterVersion(false);
          }}
          onSaved={(id) => {
            setVersionId(id);
            setNewVersion(false);
            if (importAfterVersion) setImportOpen(true);
            setImportAfterVersion(false);
            void reload();
          }}
        />
      ) : null}
      {detail ? (
        <ResponsiveModal
          open
          onOpenChange={(value) => {
            if (!value) setDetail(null);
          }}
          title={detail.title}
          description={`${detail.classroomName} · ${detail.teacherName} · ${detail.startTime}–${detail.endTime}`}
        >
          <div className="grid gap-3">
            {editable && auth.can("schedule.update") ? (
              <Button
                onClick={() => {
                  setEditor({ lesson: detail });
                  setDetail(null);
                }}
              >
                ویرایش درس
              </Button>
            ) : null}
            <p>{detail.locationName || "محل تعیین نشده"}</p>
            <p className="text-sm">
              {timetableDateLabel(detail.startsOn, timeZone)} تا{" "}
              {timetableDateLabel(detail.endsOn, timeZone)} · {detail.notes}
            </p>
            {editable && auth.can("schedule.delete") ? (
              <Button variant="soft" onClick={() => setDeleteOpen(true)}>
                حذف از پیش‌نویس
              </Button>
            ) : null}
            {editable && auth.can("schedule.create") ? (
              <Button
                onClick={() => {
                  setEditor({
                    initial: {
                      ...detail,
                      classBookId: detail.classBookId,
                      teacherId: detail.teacherId,
                    },
                  });
                  setDetail(null);
                }}
              >
                تکرار این درس
              </Button>
            ) : null}
            {selectedVersion?.state === "PUBLISHED" && auth.can("schedule.publish") ? (
              <Button
                variant="soft"
                onClick={() => {
                  setOverrideDate(today);
                  setReason("");
                  setCancelled(false);
                  setSubTeacher("");
                  setSubRoom("");
                  setSubStart("");
                  setSubEnd("");
                  setOverrideOpen(true);
                }}
              >
                استثنا / لغو / استاد جایگزین
              </Button>
            ) : null}
            {auth.can("attendance.class.manage") ? (
              <Button
                disabled={attendance.isPending}
                onClick={() => attendance.mutate({ lesson: detail, date: today })}
              >
                حضور این درس امروز
              </Button>
            ) : null}
          </div>
        </ResponsiveModal>
      ) : null}
      <ResponsiveModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="انتشار برنامه"
        description="نسخه قبلی بایگانی می‌شود. استادان و دانش‌آموزان کلاس‌های مربوط اعلان دریافت می‌کنند."
      >
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            publish.mutate();
          }}
        >
          <Field label="دلیل انتشار">
            <Input
              required
              minLength={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <Button disabled={publish.isPending || reason.trim().length < 2}>تأیید انتشار</Button>
        </form>
      </ResponsiveModal>
      <ResponsiveModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف درس از پیش‌نویس"
        description="پس از حذف می‌توانید آخرین تغییر را بازگردانید؛ حضورهای تاریخی حذف نمی‌شوند."
      >
        <Button disabled={remove.isPending} onClick={() => remove.mutate()}>
          تأیید حذف
        </Button>
      </ResponsiveModal>
      <ResponsiveModal
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        title="تغییر یک روز"
        description="این تغییر فقط برای یک وقوع درس اعمال می‌شود. حضور قبلی بازنویسی نمی‌شود."
      >
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            override.mutate();
          }}
        >
          <Field label="تاریخ اجرا">
            <TimetableDateInput
              data-field-control
              label="تاریخ اجرا"
              timeZone={timeZone}

              required
              value={overrideDate}
              onChange={(iso) => setOverrideDate(iso)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={cancelled}
              onChange={(event) => setCancelled(event.target.checked)}
            />
            لغو درس در این تاریخ
          </label>
          {!cancelled ? (
            <>
              <Field label="استاد جایگزین">
                <select
                  className={timetableSelectClass}
                  value={subTeacher}
                  onChange={(event) => setSubTeacher(event.target.value)}
                >
                  <option value="">استاد اصلی</option>
                  {data.teachers.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="اتاق جایگزین">
                <select
                  className={timetableSelectClass}
                  value={subRoom}
                  onChange={(event) => setSubRoom(event.target.value)}
                >
                  <option value="">اتاق اصلی</option>
                  {data.locations.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="شروع جایگزین">
                  <TimetableTimeInput
                    data-field-control
                    value={subStart}
                    onChange={(event) => setSubStart(event.target.value)}
                  />
                </Field>
                <Field label="پایان جایگزین">
                  <TimetableTimeInput
                    data-field-control
                    value={subEnd}
                    onChange={(event) => setSubEnd(event.target.value)}
                  />
                </Field>
              </div>
            </>
          ) : null}
          <Field label="دلیل">
            <Input
              required
              minLength={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <Button disabled={override.isPending || reason.trim().length < 2}>تأیید تغییر</Button>
        </form>
      </ResponsiveModal>
      <div className="timetable-print-only">
        <h2>
          {auth.context?.activeOrganization?.name} · {selectedVersion?.name}
        </h2>
        {persianWeekdays.map((day) => (
          <div key={day.id}>
            <h3>{day.name}</h3>
            {filtered
              .filter((x) => x.weekday === day.id)
              .map((x) => (
                <p key={x.id}>
                  {x.classroomName} · {x.title} · {x.teacherName} · {x.locationName} · {x.startTime}
                  –{x.endTime}
                </p>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
function LessonSummary({ lesson, onClick }: { lesson: TimetableLesson; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-xl border bg-[rgb(var(--surface-card))] p-3 text-start focus-visible:ring-2 focus-visible:ring-brand"
      onClick={onClick}
    >
      <strong>{lesson.title}</strong>
      <span className="ms-2 text-sm text-slate-500">
        {lesson.classroomName} · {lesson.teacherName} · {lesson.startTime}–{lesson.endTime}
      </span>
    </button>
  );
}
function OccurrenceCard({
  occurrence: x,
  now,
  onClick,
  canAttend,
  onAttend,
  busy,
}: {
  occurrence: TimetableOccurrence;
  now: number;
  onClick: () => void;
  canAttend: boolean;
  onAttend: () => void;
  busy: boolean;
}) {
  const current = !x.cancelled && Date.parse(x.startsAt) <= now && Date.parse(x.endsAt) > now;
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (current && !focused.current && document.activeElement === document.body) {
      focused.current = true;
      ref.current?.focus({ preventScroll: true });
    }
  }, [current]);
  return (
    <Card>
      <div
        ref={ref}
        tabIndex={-1}
        className={`grid gap-2 rounded-xl p-3 ${current ? "ring-2 ring-brand" : ""} ${x.cancelled ? "opacity-70" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="min-h-11 text-start focus-visible:ring-2 focus-visible:ring-brand"
            onClick={onClick}
          >
            <strong className="block">
              {x.title}
              {x.cancelled ? " · لغو شده" : current ? " · اکنون" : ""}
            </strong>
            <span className="mt-1 block text-xs text-slate-500">
              {x.classroomName} · {x.periodName}
            </span>
          </button>
          <span className="pt-2 text-sm font-bold" dir="ltr">
            {x.startTime}–{x.endTime}
          </span>
        </div>
        <p className="text-sm">
          {x.teacherName} · {x.locationName || "محل تعیین نشده"}
        </p>
        {x.changeReason ? (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            تغییر برنامه: {x.changeReason}
          </p>
        ) : null}
        {canAttend ? (
          <Button
            variant="soft"
            disabled={busy || (x.cancelled && !x.attendanceSessionId)}
            onClick={onAttend}
          >
            {x.attendanceSessionId ? "مشاهده حضور این درس" : "ثبت حضور این درس"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
function NewVersionModal({
  workspace,
  copyVersionId,
  onClose,
  onSaved,
}: {
  workspace: TimetableWorkspace;
  copyVersionId: string;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [termId, setTermId] = useState(workspace.terms.length === 1 ? workspace.terms[0].id : "");
  const [name, setName] = useState("");
  const [effectiveOn, setEffectiveOn] = useState(
    workspace.terms.length === 1 ? workspace.terms[0].startsOn : "",
  );
  const [reason, setReason] = useState("");
  const [copy, setCopy] = useState(false);
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: () => {
      assertTimetableRange(effectiveOn, effectiveOn, "date");
      const term = workspace.terms.find((t) => t.id === termId);
      if (!term || effectiveOn < term.startsOn || effectiveOn > term.endsOn)
        throw Error("تاریخ شروع اجرا باید داخل نیم‌سال انتخاب‌شده باشد.");
      return createTimetableVersion(workspace.organizationId, {
        termId,
        name,
        effectiveOn,
        reason,
        ...(copy && copyVersionId ? { copyVersionId } : {}),
      });
    },
    onSuccess: (result) => onSaved(result.id),
    onError: (e) => setError(e.message),
  });
  return (
    <ResponsiveModal
      open
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      title="پیش‌نویس جدید"
      description="برای تغییر دائمی، نسخه منتشرشده را کپی کنید. حضور و نسخه‌های قبلی حفظ می‌شوند."
    >
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <Field label="نیم‌سال">
          <select
            required
            className={timetableSelectClass}
            value={termId}
            onChange={(event) => {
              setTermId(event.target.value);
              setEffectiveOn(
                workspace.terms.find((x) => x.id === event.target.value)?.startsOn ?? "",
              );
            }}
          >
            <option value="">انتخاب نیم‌سال</option>
            {workspace.terms.map((x) => (
              <option key={x.id} value={x.id}>
                {workspace.years.find((y) => y.id === x.yearId)?.name} · {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="نام نسخه">
          <Input
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="تاریخ شروع اجرا">
          <TimetableDateInput
            data-field-control
            label="تاریخ شروع اجرا"
            timeZone={
              workspace.years.find(
                (year) => year.id === workspace.terms.find((term) => term.id === termId)?.yearId,
              )?.timeZone
            }

            required
            value={effectiveOn}
            onChange={(iso) => setEffectiveOn(iso)}
          />
        </Field>
        <Field label="دلیل">
          <Input
            required
            minLength={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {copyVersionId ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={copy}
              onChange={(event) => setCopy(event.target.checked)}
            />
            کپی درس‌های نسخه انتخاب‌شده
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <Button disabled={save.isPending || !workspace.terms.length}>ایجاد پیش‌نویس</Button>
      </form>
    </ResponsiveModal>
  );
}
