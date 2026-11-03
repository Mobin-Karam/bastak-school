import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkMarkAttendance,
  getTeacherStudentClassProfile,
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
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  MessageSquareText,
  PencilLine,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";
import { notify } from "../../../../shared/ui/notifications";
import { api } from "../../../../shared/api/api";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { Button, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { TeacherStudentAttendanceProfile } from "./TeacherStudentAttendanceProfile";
import { reportOutsideStudentPresent } from "../../../student-life/attendance/api/attendance-operations.api";
import {
  listTeacherLeaveRequests,
  requestTeacherLeaveReturn,
} from "../../../academics/schedule/api/teacher-leave.api";

type AttendanceStatus = SelfAttendanceRecord["status"];

const attendanceActions: Array<{
  status: AttendanceStatus;
  label: string;
  activeClassName: string;
  idleClassName: string;
  rowClassName: string;
  summaryClassName: string;
}> = [
  {
    status: "present",
    label: "حاضر",
    activeClassName: "border-emerald-700 bg-emerald-600 text-white",
    idleClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-500 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100",
    rowClassName: "border-s-emerald-600 bg-emerald-50/45 dark:bg-emerald-950/15",
    summaryClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100",
  },
  {
    status: "absent",
    label: "غایب",
    activeClassName: "border-rose-700 bg-rose-600 text-white",
    idleClassName:
      "border-rose-300 bg-rose-50 text-rose-950 hover:border-rose-500 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-100",
    rowClassName: "border-s-rose-600 bg-rose-50/45 dark:bg-rose-950/15",
    summaryClassName:
      "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-100",
  },
  {
    status: "late",
    label: "تأخیر",
    activeClassName: "border-amber-600 bg-amber-400 text-amber-950",
    idleClassName:
      "border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-500 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100",
    rowClassName: "border-s-amber-500 bg-amber-50/45 dark:bg-amber-950/15",
    summaryClassName:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100",
  },
  {
    status: "excused",
    label: "موجه",
    activeClassName: "border-sky-700 bg-sky-600 text-white",
    idleClassName:
      "border-sky-300 bg-sky-50 text-sky-950 hover:border-sky-500 dark:border-sky-900 dark:bg-sky-950/35 dark:text-sky-100",
    rowClassName: "border-s-sky-600 bg-sky-50/45 dark:bg-sky-950/15",
    summaryClassName:
      "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/35 dark:text-sky-100",
  },
];
const attendanceActionByStatus = new Map(
  attendanceActions.map((action) => [action.status, action]),
);

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

function tehranNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}
export function latestTeacherSessionDate(date: string, weekday: number) {
  const current = new Date(`${date}T12:00:00Z`);
  while ((current.getUTCDay() + 1) % 7 !== weekday) current.setUTCDate(current.getUTCDate() - 1);
  return isoDay(current);
}
function nearestSessionDate(date: string, weekday: number, direction: -1 | 1) {
  const next = new Date(`${date}T12:00:00Z`);
  do next.setUTCDate(next.getUTCDate() + direction);
  while ((next.getUTCDay() + 1) % 7 !== weekday);
  return isoDay(next);
}
function firstSessionDateOnOrAfter(date: string, weekday: number) {
  const first = new Date(`${date}T12:00:00Z`);
  while ((first.getUTCDay() + 1) % 7 !== weekday) first.setUTCDate(first.getUTCDate() + 1);
  return isoDay(first);
}
function clampTeacherSessionDate(
  date: string,
  weekday: number,
  minimum?: string,
  maximum?: string,
) {
  let aligned = latestTeacherSessionDate(date, weekday);
  if (minimum && aligned < minimum) aligned = firstSessionDateOnOrAfter(minimum, weekday);
  if (maximum && aligned > maximum) aligned = latestTeacherSessionDate(maximum, weekday);
  return aligned;
}

function clampTeacherEntryDate(
  entry: ScheduleEntry,
  date: string,
  minimum?: string,
  maximum?: string,
) {
  if (entry.status === "REPLACED" && entry.startsOn && entry.endsOn) return entry.startsOn;
  const effectiveMinimum = [minimum, entry.startsOn]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const effectiveMaximum = [maximum, entry.endsOn]
    .filter((value): value is string => Boolean(value))
    .sort()[0];
  return clampTeacherSessionDate(date, entry.weekday, effectiveMinimum, effectiveMaximum);
}

function isTeacherScheduleDate(entry: ScheduleEntry, date: string) {
  const current = new Date(`${date}T12:00:00.000Z`);
  if ((current.getUTCDay() + 1) % 7 !== entry.weekday) return false;
  if (entry.status === "REPLACED") return entry.startsOn === date && entry.endsOn === date;
  return (!entry.startsOn || entry.startsOn <= date) && (!entry.endsOn || entry.endsOn >= date);
}

/** Class roster and physical attendance management for a teacher's own scheduled class. */
export function TeacherClassAttendanceSheet({
  entry,
  open,
  onOpenChange,
  canManage,
  initialDate,
  semesterStartsOn,
  semesterEndsOn,
}: {
  entry: ScheduleEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  initialDate?: string;
  semesterStartsOn?: string;
  semesterEndsOn?: string;
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
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(null);
  const [revisionConfirmationOpen, setRevisionConfirmationOpen] = useState(false);
  const [revisionConfirmedSessionId, setRevisionConfirmedSessionId] = useState<string | null>(null);
  const [reportText, setReportText] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [leaveReturnPromptOpen, setLeaveReturnPromptOpen] = useState(false);
  const entryWeekday = entry?.weekday;
  const schoolToday = tehranNow().date;
  const [sessionDate, setSessionDate] = useState(() =>
    !entry || entryWeekday === undefined
      ? schoolToday
      : clampTeacherEntryDate(entry, initialDate ?? schoolToday, semesterStartsOn, semesterEndsOn),
  );
  const participantsQueryKey = [
    "attendance",
    "participants",
    scopeKey,
    "class",
    entry?.classroom?.id,
    entry?.id,
    sessionDate,
  ] as const;
  const participants = useQuery({
    queryKey: participantsQueryKey,
    queryFn: () =>
      getAttendanceParticipants("class", entry!.classroom!.id, {
        scheduleEntryId: entry!.id,
        date: sessionDate,
      }),
    enabled:
      open &&
      Boolean(entry?.classroom?.id) &&
      Boolean(entry && isTeacherScheduleDate(entry, sessionDate)),
  });
  const sessionLookupKey = [
    "attendance",
    "legacy-schedule-session",
    scopeKey,
    entry?.id,
    sessionDate,
  ] as const;
  const savedSessionLookup = useQuery({
    queryKey: sessionLookupKey,
    queryFn: () =>
      api.get<{ id: string; revision: number } | null>(
        `/attendance/legacy-schedule-session?entryId=${encodeURIComponent(entry!.id)}&date=${encodeURIComponent(sessionDate)}`,
      ),
    enabled:
      open && Boolean(entry?.id) && Boolean(entry && isTeacherScheduleDate(entry, sessionDate)),
  });
  const savedSessionId = savedSessionLookup.data?.id ?? null;
  const isRevision = Boolean(savedSessionId);
  const revisionEditingConfirmed = !savedSessionId || revisionConfirmedSessionId === savedSessionId;
  const savedAttendance = useQuery({
    queryKey: ["attendance", "session-detail", savedSessionId],
    queryFn: () =>
      api.get<{
        roster: Array<{
          id: string;
          name: string;
          nationalCode: string | null;
          userId: string | null;
        }>;
        status: string;
        rosterComplete: boolean;
        records: Array<{ studentId: string; legacyStatus: AttendanceStatus; note: string }>;
      }>(`/attendance/sessions/${encodeURIComponent(savedSessionId!)}`),
    enabled: Boolean(savedSessionId),
  });
  const savedAttendanceSummary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    const saved = savedAttendance.data;
    if (!saved) return attendanceActions.map((action) => ({ ...action, count: 0 }));

    for (const record of saved.records) counts[record.legacyStatus] += 1;
    counts.present += Math.max(0, saved.roster.length - saved.records.length);
    return attendanceActions.map((action) => ({ ...action, count: counts[action.status] }));
  }, [savedAttendance.data]);
  const attendanceLoaded =
    savedSessionLookup.isSuccess && (!savedSessionId || savedAttendance.isSuccess);
  const attendanceHydrated =
    attendanceLoaded && (!savedSessionId || hydratedSessionId === savedSessionId);
  const reviews = useQuery({
    queryKey: ["attendance", "my-absence-reviews", scopeKey],
    queryFn: listMyAttendanceAbsenceReviews,
    enabled: open,
  });
  const teacherLeaves = useQuery({
    queryKey: ["teacher-leaves", "attendance-sheet", scopeKey],
    queryFn: listTeacherLeaveRequests,
    enabled: open,
  });
  const teacherStudentProfile = useQuery({
    queryKey: ["teacher", "student-class-profile", scopeKey, entry?.id, profileStudentId],
    queryFn: () => getTeacherStudentClassProfile(profileStudentId!, entry!.id),
    enabled: Boolean(profileStudentId && entry?.id),
  });
  const classReviews = (reviews.data ?? []).filter(
    (review) => review.contextType === "class" && review.contextId === entry?.classroom?.id,
  );
  const activeLeave = (teacherLeaves.data ?? []).find(
    (leave) =>
      leave.status === "approved" &&
      leave.startDate <= sessionDate &&
      leave.endDate >= sessionDate &&
      !(leave.returnStatus === "approved" && leave.returnDate && leave.returnDate <= sessionDate),
  );
  const requestLeaveReturn = useMutation({
    mutationFn: (leaveId: string) =>
      requestTeacherLeaveReturn(leaveId, { returnDate: sessionDate }),
    onSuccess: () => {
      setLeaveReturnPromptOpen(false);
      void client.invalidateQueries({ queryKey: ["teacher-leaves"] });
      notify("درخواست بازگشت برای تأیید مدیر ارسال شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ارسال درخواست بازگشت انجام نشد.", "error"),
  });
  const recentAbsenceCounts = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (reviews.data ?? []).reduce<Record<string, number>>((counts, review) => {
      const sessionTimestamp = Date.parse(review.sessionDate);
      if (
        review.status !== "absent" ||
        !Number.isFinite(sessionTimestamp) ||
        sessionTimestamp < sevenDaysAgo
      )
        return counts;
      counts[review.studentId] = (counts[review.studentId] ?? 0) + 1;
      return counts;
    }, {});
  }, [reviews.data]);

  useEffect(() => {
    setReviewing(false);
    setClearConfirmationOpen(false);
    setMarks({});
    setReasons({});
    pendingWrite.current = null;
    setHydratedSessionId(null);
    setRevisionConfirmationOpen(false);
    setRevisionConfirmedSessionId(null);
    setReportText({});
    setReportTarget(null);
    setProfileStudentId(null);
    setSessionDate(
      entryWeekday !== undefined
        ? entry
          ? clampTeacherEntryDate(
              entry,
              initialDate ?? schoolToday,
              semesterStartsOn,
              semesterEndsOn,
            )
          : clampTeacherSessionDate(
              initialDate ?? schoolToday,
              entryWeekday,
              semesterStartsOn,
              semesterEndsOn,
            )
        : isoDay(new Date()),
    );
  }, [
    entry,
    entryWeekday,
    initialDate,
    open,
    schoolToday,
    scopeKey,
    semesterStartsOn,
    semesterEndsOn,
  ]);

  useEffect(() => {
    setReviewing(false);
    setClearConfirmationOpen(false);
    setMarks({});
    setReasons({});
    setHydratedSessionId(null);
    setRevisionConfirmationOpen(false);
    setRevisionConfirmedSessionId(null);
    pendingWrite.current = null;
  }, [sessionDate]);

  const sessionParticipants = useMemo(() => {
    const currentParticipants = participants.data ?? [];
    if (!savedSessionId || !savedAttendance.data?.rosterComplete) return currentParticipants;

    const currentById = new Map(currentParticipants.map((student) => [student.id, student]));
    return savedAttendance.data.roster.map((snapshot) => ({
      ...(currentById.get(snapshot.id) ?? {}),
      ...snapshot,
    }));
  }, [participants.data, savedAttendance.data, savedSessionId]);

  // A new occurrence starts with a full present register. Existing occurrences
  // are hydrated from their saved roster and marks before editing is enabled.
  useEffect(() => {
    if (!open || !attendanceLoaded) return;
    if (savedSessionId && savedAttendance.data) {
      const saved = savedAttendance.data;
      const known = new Map(saved.records.map((record) => [record.studentId, record]));
      setMarks(
        Object.fromEntries(
          sessionParticipants.map((student) => [
            student.id,
            known.get(student.id)?.legacyStatus ?? "present",
          ]),
        ),
      );
      setReasons(
        Object.fromEntries(
          saved.records
            .filter((record) => Boolean(record.note))
            .map((record) => [record.studentId, record.note]),
        ),
      );
      setHydratedSessionId(savedSessionId);
      return;
    }
    setMarks((current) =>
      Object.keys(current).length
        ? current
        : Object.fromEntries(sessionParticipants.map((student) => [student.id, "present"])),
    );
  }, [
    attendanceLoaded,
    open,
    participants.data,
    savedAttendance.data,
    savedSessionId,
    sessionParticipants,
  ]);

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
        note:
          status === "excused" || status === "absent"
            ? reasons[studentId]?.trim() || undefined
            : undefined,
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
      client.setQueryData(sessionLookupKey, {
        id: result.sessionId,
        revision: result.revision,
      });
      setRevisionConfirmedSessionId(result.sessionId);
      void client.invalidateQueries({ queryKey: ["attendance"] });
      notify("حضور و غیاب کلاس ثبت شد.", "success");
      setReviewing(false);
    },
    onError: (error, _, context) => {
      if (context?.scopeKey !== scopeRef.current) return;
      if (error instanceof Error && error.message.includes("مرخصی تأییدشده")) {
        setLeaveReturnPromptOpen(true);
      }
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
      setReportTarget(null);
      notify("گزارش برای مدیر ارسال شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ارسال گزارش انجام نشد.", "error"),
  });
  const reportOutsidePresence = useMutation({
    mutationFn: (studentId: string) => {
      if (!savedSessionId) throw new Error("ابتدا حضور جلسه را ذخیره کنید.");
      return reportOutsideStudentPresent(savedSessionId, studentId);
    },
    onSuccess: (_result, studentId) => {
      client.setQueryData(participantsQueryKey, (current: typeof participants.data) =>
        current?.map((student) =>
          student.id === studentId ? { ...student, outsidePresenceReported: true } : student,
        ),
      );
      notify(
        "گزارش حضور برای تأیید مدیر ارسال شد؛ آمار مدرسه پس از تأیید تغییر می‌کند.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ارسال گزارش حضور انجام نشد.", "error"),
  });

  const savedRecordsByStudent = new Map(
    (savedAttendance.data?.records ?? []).map((record) => [record.studentId, record]),
  );
  const hasUnsavedChanges =
    attendanceHydrated &&
    sessionParticipants.some((student) => {
      const saved = savedSessionId ? savedRecordsByStudent.get(student.id) : undefined;
      return (
        marks[student.id] !== (saved?.legacyStatus ?? "present") ||
        (reasons[student.id] ?? "").trim() !== (saved?.note ?? "").trim()
      );
    });
  const discard = useAttendanceDiscard(
    hasUnsavedChanges,
    save.isPending,
    `${scopeKey}:${entry?.id}:${open}`,
  );
  const resetToPresent = () => {
    setMarks(Object.fromEntries(sessionParticipants.map((student) => [student.id, "present"])));
    setReasons({});
  };
  const hasMissingExcusedReason = sessionParticipants.some(
    (student) => marks[student.id] === "excused" && !(reasons[student.id] ?? "").trim(),
  );
  const selectSessionDate = (date: string) => {
    discard.request(() => {
      setSessionDate(date);
      setMarks({});
      setReasons({});
      setHydratedSessionId(null);
      setReviewing(false);
    });
  };
  const schoolNow = tehranNow();
  const canMoveToNextSession = entry
    ? nearestSessionDate(sessionDate, entry.weekday, 1) <= schoolNow.date &&
      (!semesterEndsOn || nearestSessionDate(sessionDate, entry.weekday, 1) <= semesterEndsOn)
    : false;
  const previousSessionDate = entry ? nearestSessionDate(sessionDate, entry.weekday, -1) : null;
  const canMoveToPreviousSession = Boolean(
    previousSessionDate && (!semesterStartsOn || previousSessionDate >= semesterStartsOn),
  );
  const hasSessionStarted =
    sessionDate < schoolNow.date ||
    (sessionDate === schoolNow.date && (entry?.startTime ?? "99:99") <= schoolNow.time);
  const canManageSelectedSession =
    canManage &&
    attendanceHydrated &&
    revisionEditingConfirmed &&
    savedAttendance.data?.status !== "cancelled" &&
    hasSessionStarted &&
    (!semesterStartsOn || sessionDate >= semesterStartsOn) &&
    (!semesterEndsOn || sessionDate <= semesterEndsOn);
  const canManageSessionCoins =
    canManage &&
    attendanceHydrated &&
    Boolean(savedSessionId) &&
    savedAttendance.data?.status !== "cancelled";
  const sessionCoins = useQuery({
    queryKey: ["attendance", "session-coins", savedSessionId],
    queryFn: () =>
      api.get<Array<{ studentId: string; coins: number; revision: number }>>(
        `/attendance/sessions/${encodeURIComponent(savedSessionId!)}/coins`,
      ),
    enabled: Boolean(savedSessionId),
  });
  const coinsByStudent = useMemo(
    () => Object.fromEntries((sessionCoins.data ?? []).map((coin) => [coin.studentId, coin])),
    [sessionCoins.data],
  );
  const setCoins = useMutation({
    mutationFn: ({ studentId, coins }: { studentId: string; coins: number }) => {
      if (!savedSessionId) throw new Error("ابتدا حضور این جلسه را ثبت کنید.");
      return api.patch(
        `/attendance/sessions/${encodeURIComponent(savedSessionId)}/students/${encodeURIComponent(studentId)}/coins`,
        {
          requestId: crypto.randomUUID(),
          coins,
          expectedRevision: coinsByStudent[studentId]?.revision ?? 0,
        },
      );
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance", "session-coins", savedSessionId] });
      notify("سکه جلسه ثبت شد.", "success");
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
            <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-2">
              <Button
                size="sm"
                variant="soft"
                aria-label="رفتن به جلسه قبل"
                disabled={!canMoveToPreviousSession}
                onClick={() => {
                  if (canMoveToPreviousSession && previousSessionDate)
                    selectSessionDate(previousSessionDate);
                }}
              >
                <ChevronRight size={17} aria-hidden="true" />
                <span className="hidden sm:inline">جلسه قبل</span>
              </Button>
              <label className="grid justify-items-center gap-0.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <CalendarDays size={14} aria-hidden="true" /> تاریخ جلسه
                </span>
                <DatePicker
                  value={sessionDate}
                  min={semesterStartsOn}
                  max={semesterEndsOn}
                  onChange={(date) =>
                    selectSessionDate(
                      clampTeacherEntryDate(entry, date, semesterStartsOn, semesterEndsOn),
                    )
                  }
                />
              </label>
              <Button
                size="sm"
                variant="soft"
                aria-label="رفتن به جلسه بعد"
                onClick={() => selectSessionDate(nearestSessionDate(sessionDate, entry.weekday, 1))}
                disabled={!canMoveToNextSession}
              >
                <span className="hidden sm:inline">جلسه بعد</span>
                <ChevronLeft size={17} aria-hidden="true" />
              </Button>
            </div>
          ) : null}
          {!entry?.classroom?.id ? (
            <div className="mt-5">
              <EmptyState title="برای این برنامه کلاس مشخص نشده است." />
            </div>
          ) : !isTeacherScheduleDate(entry, sessionDate) ? (
            <div className="mt-5" role="alert">
              <EmptyState
                title="تاریخ انتخاب‌شده با برنامهٔ این جلسه هماهنگ نیست."
                description="تاریخ جلسه را دوباره انتخاب کنید یا برنامهٔ کلاس را بررسی کنید."
              />
            </div>
          ) : participants.isLoading ? (
            <div className="mt-5">
              <LoadingState label="در حال دریافت فهرست دانش‌آموزان…" />
            </div>
          ) : participants.isError ? (
            <div className="mt-5">
              <EmptyState title="فهرست دانش‌آموزان دریافت نشد." />
            </div>
          ) : savedSessionLookup.isError || savedAttendance.isError ? (
            <div className="mt-5" role="alert">
              <EmptyState
                title="وضعیت ثبت‌شدهٔ این جلسه بارگذاری نشد."
                description="برای جلوگیری از بازنویسی اطلاعات قبلی، تا بارگذاری موفق امکان ثبت وجود ندارد."
                action={
                  <Button
                    variant="soft"
                    onClick={() => {
                      void savedSessionLookup.refetch();
                      if (savedSessionId) void savedAttendance.refetch();
                    }}
                  >
                    تلاش دوباره
                  </Button>
                }
              />
            </div>
          ) : !attendanceHydrated ? (
            <div className="mt-5">
              <LoadingState label="در حال بازیابی وضعیت ثبت‌شدهٔ جلسه…" />
            </div>
          ) : !sessionParticipants.length ? (
            <div className="mt-5">
              <EmptyState title="دانش‌آموز فعالی در این کلاس نیست." />
            </div>
          ) : (
            <>
              {savedAttendance.data?.status !== "cancelled" ? (
                <div
                  role="status"
                  className={`mt-5 rounded-2xl border p-3 text-xs leading-5 ${isRevision ? "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100" : "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100"}`}
                >
                  <p className="font-black">{isRevision ? "بازبینی ثبت‌شده" : "ثبت اولیه"}</p>
                  <p className="mt-1">
                    {isRevision
                      ? revisionEditingConfirmed
                        ? "حالت بازبینی فعال است؛ تغییرات شما پس از تأیید، به‌عنوان بازبینی ذخیره می‌شوند."
                        : "این جلسه قبلاً ثبت شده است؛ پیش از ویرایش، بازبینی آن را تأیید کنید."
                      : "وضعیت دانش‌آموزان را انتخاب کنید، سپس در مرحلهٔ بعد آن را بررسی و ثبت کنید."}
                  </p>
                  {isRevision && !revisionEditingConfirmed ? (
                    <Button
                      size="sm"
                      variant="soft"
                      className="mt-2"
                      onClick={() => setRevisionConfirmationOpen(true)}
                    >
                      <PencilLine size={15} aria-hidden="true" /> ویرایش بازبینی
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {savedAttendance.data?.status === "cancelled"
                  ? "این جلسه لغو شده و فقط قابل مشاهده است."
                  : sessionDate > schoolNow.date
                    ? "این جلسه هنوز برگزار نشده است؛ حضور و غیاب تا زمان برگزاری غیرفعال است."
                    : canManage
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
                {sessionParticipants.map((student) => {
                  const studentAction = attendanceActionByStatus.get(
                    marks[student.id] ?? "present",
                  );
                  return (
                    <li
                      key={student.id}
                      className={`rounded-xl border border-s-4 p-2.5 ${student.outsideSchool ? "border-rose-600 bg-rose-50 ring-2 ring-rose-400/60 dark:border-rose-400 dark:bg-rose-950/25 dark:ring-rose-500/50" : recentAbsenceCounts[student.id] ? "border-amber-500 bg-amber-50 ring-1 ring-amber-300/70 dark:border-amber-500 dark:bg-amber-950/25 dark:ring-amber-500/40" : (studentAction?.rowClassName ?? "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]")}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-bold text-ink">{student.name}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 whitespace-nowrap"
                            aria-label={`مشاهده پرونده ${student.name}`}
                            onClick={() => setProfileStudentId(student.id)}
                          >
                            پرونده
                          </Button>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-black ${studentAction?.summaryClassName ?? "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-slate-700 dark:text-slate-200"}`}
                          >
                            {studentAction?.label ?? "حاضر"}
                          </span>
                          {recentAbsenceCounts[student.id] ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                              {recentAbsenceCounts[student.id].toLocaleString("fa-IR")} غیبت در ۷
                              روز
                            </span>
                          ) : null}
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            {student.nationalCode || "دانش‌آموز"}
                          </span>
                        </div>
                      </div>
                      {student.outsideSchool ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-100 px-3 py-2 text-xs font-black text-rose-950 dark:bg-rose-950/60 dark:text-rose-100">
                          <span>
                            {student.outsidePresenceReported
                              ? "گزارش حضور در انتظار تأیید مدیر"
                              : "خارج از مدرسه"}
                          </span>
                          {student.outsidePresenceReported ? null : marks[student.id] ===
                              "present" && savedSessionId ? (
                            <button
                              type="button"
                              disabled={reportOutsidePresence.isPending}
                              onClick={() => reportOutsidePresence.mutate(student.id)}
                              className="min-h-9 rounded-lg border border-rose-500 bg-white px-3 font-bold text-rose-900 disabled:opacity-50 dark:bg-slate-950 dark:text-rose-100"
                            >
                              گزارش حضور به مدیر
                            </button>
                          ) : (
                            <span className="font-medium">
                              برای گزارش، حضور را ثبت و جلسه را ذخیره کنید.
                            </span>
                          )}
                        </div>
                      ) : null}
                      {canManageSelectedSession ? (
                        <div
                          className="grid w-full grid-cols-4 gap-1.5 sm:ms-auto sm:w-[21rem]"
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
                                  setMarks((current) => ({
                                    ...current,
                                    [student.id]: action.status,
                                  }))
                                }
                                title={action.label}
                                className={`flex min-h-11 items-center justify-center gap-1 rounded-lg border px-1 text-[11px] font-bold transition-colors motion-reduce:transition-none ${selected ? action.activeClassName : action.idleClassName}`}
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
                                <span>{action.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      {canManageSelectedSession &&
                      (marks[student.id] === "excused" || marks[student.id] === "absent") ? (
                        <label className="mt-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                          {marks[student.id] === "excused"
                            ? "توضیح موجه (اجباری)"
                            : "توضیح غیبت (اختیاری)"}
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
                            placeholder={
                              marks[student.id] === "excused"
                                ? "علت موجه‌بودن را بنویسید"
                                : "در صورت نیاز، توضیح غیبت را بنویسید"
                            }
                            className="mt-1 min-h-10 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-card px-3 text-xs font-normal text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          />
                        </label>
                      ) : null}
                      {canManageSessionCoins ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border-subtle))] pt-2">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <AttendanceCoin className="size-4 object-contain" /> امتیاز سکه (۳− تا
                            ۳+)
                          </span>
                          <div
                            className="flex gap-1"
                            role="group"
                            aria-label={`سکه ${student.name}`}
                          >
                            <button
                              type="button"
                              className="grid min-h-9 min-w-9 place-items-center rounded-lg bg-[rgb(var(--surface-muted))] text-base font-black"
                              aria-label={`کم‌کردن سکه ${student.name}`}
                              disabled={
                                setCoins.isPending || (coinsByStudent[student.id]?.coins ?? 0) <= -3
                              }
                              onClick={() =>
                                setCoins.mutate({
                                  studentId: student.id,
                                  coins: Math.max(-3, (coinsByStudent[student.id]?.coins ?? 0) - 1),
                                })
                              }
                            >
                              −
                            </button>
                            <output
                              className="grid min-h-9 min-w-10 place-items-center rounded-lg bg-amber-400 text-sm font-black text-amber-950"
                              aria-live="polite"
                            >
                              {(coinsByStudent[student.id]?.coins ?? 0).toLocaleString("fa-IR", {
                                signDisplay: "always",
                              })}
                            </output>
                            <button
                              type="button"
                              className="grid min-h-9 min-w-9 place-items-center rounded-lg bg-[rgb(var(--surface-muted))] text-base font-black"
                              aria-label={`افزودن سکه ${student.name}`}
                              disabled={
                                setCoins.isPending || (coinsByStudent[student.id]?.coins ?? 0) >= 3
                              }
                              onClick={() =>
                                setCoins.mutate({
                                  studentId: student.id,
                                  coins: Math.min(3, (coinsByStudent[student.id]?.coins ?? 0) + 1),
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {canManageSelectedSession && savedSessionId ? (
                        <div className="mt-2 flex items-center justify-between border-t border-[rgb(var(--border-subtle))] pt-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            گزارش خصوصی برای مدیر
                          </span>
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() => setReportTarget({ id: student.id, name: student.name })}
                          >
                            گزارش
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
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
                    {Object.keys(marks).length} از {sessionParticipants.length} نفر تعیین وضعیت
                    شده‌اند.
                  </p>
                  <ul className="grid gap-2">
                    {sessionParticipants
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
                  {Object.keys(marks).length < sessionParticipants.length ? (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      افراد تعیین‌وضعیت‌نشده غایب محسوب نمی‌شوند و در این ثبت ارسال نمی‌شوند.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {canManageSelectedSession ? (
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
                      disabled={
                        !Object.keys(marks).length || save.isPending || hasMissingExcusedReason
                      }
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
                          ? isRevision
                            ? "تأیید و ثبت بازبینی"
                            : "تأیید و ثبت حضور و غیاب"
                          : isRevision
                            ? "بررسی و ثبت بازبینی"
                            : "بررسی و ثبت حضور و غیاب"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </ResponsiveModal>
      <ResponsiveDrawer
        nested
        open={revisionConfirmationOpen}
        onOpenChange={setRevisionConfirmationOpen}
        title="بازبینی حضور و غیاب"
        description="این جلسه قبلاً ثبت شده است"
        desktopSide="bottom"
      >
        <div className="grid gap-4" dir="rtl">
          <div className="rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sm leading-6 text-sky-950 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100">
            تغییر وضعیت دانش‌آموزان، ثبت این جلسه را بازبینی می‌کند. پیش از ادامه، فهرست و دلیل‌های
            غیبت را با دقت بررسی کنید.
          </div>
          <p className="rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-2 text-xs leading-5 text-slate-700 dark:text-slate-200">
            با انتخاب «ادامه و ویرایش» فهرست ثبت قبلی و وضعیت هر دانش‌آموز را می‌بینید و می‌توانید
            آن را اصلاح کنید. اگر «فعلاً فقط مشاهده می‌کنم» را انتخاب کنید، هیچ تغییری در حضور و
            غیاب ثبت نمی‌شود.
          </p>
          <section aria-labelledby="previous-attendance-summary" className="grid gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="previous-attendance-summary" className="text-sm font-black text-ink">
                خلاصهٔ ثبت قبلی
              </h2>
              <span className="text-xs text-slate-500">
                {savedAttendance.data?.roster.length.toLocaleString("fa-IR") ?? "۰"} دانش‌آموز
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="خلاصه وضعیت ثبت قبلی">
              {savedAttendanceSummary.map((action) => (
                <li
                  key={action.status}
                  className={`rounded-xl border px-3 py-2 text-center ${action.summaryClassName}`}
                >
                  <p className="text-lg font-black leading-5">
                    {action.count.toLocaleString("fa-IR")}
                  </p>
                  <p className="mt-1 text-[11px] font-bold">{action.label}</p>
                </li>
              ))}
            </ul>
          </section>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="soft"
              className="min-h-11 flex-1 border border-[rgb(var(--border-subtle))]"
              onClick={() => setRevisionConfirmationOpen(false)}
            >
              فعلاً فقط مشاهده می‌کنم
            </Button>
            <Button
              className="min-h-11 flex-1 bg-sky-700 text-white hover:bg-sky-800"
              onClick={() => {
                if (savedSessionId) setRevisionConfirmedSessionId(savedSessionId);
                setRevisionConfirmationOpen(false);
              }}
            >
              <PencilLine size={16} aria-hidden="true" /> ادامه و ویرایش
            </Button>
          </div>
        </div>
      </ResponsiveDrawer>
      {discard.confirmation}
      <ResponsiveDrawer
        open={Boolean(profileStudentId)}
        onOpenChange={(next) => !next && setProfileStudentId(null)}
        title="کارنامه دانش‌آموز"
        description={`${entry?.classroom?.name ?? "کلاس"} · ${entry?.classBook?.book.titleFa ?? entry?.title ?? "کتاب"}`}
        desktopSide="left"
      >
        {teacherStudentProfile.data ? (
          <TeacherStudentAttendanceProfile profile={teacherStudentProfile.data} />
        ) : teacherStudentProfile.isLoading ? (
          <LoadingState label="در حال دریافت پرونده دانش‌آموز…" />
        ) : (
          <EmptyState
            title={
              teacherStudentProfile.isError
                ? "اطلاعات حضور دریافت نشد."
                : "دانش‌آموزی انتخاب نشده است."
            }
            description={
              teacherStudentProfile.isError
                ? "دوباره تلاش کنید یا دسترسی این برنامه به کلاس را بررسی کنید."
                : undefined
            }
            action={
              <Button
                variant="soft"
                onClick={() => {
                  void teacherStudentProfile.refetch();
                }}
              >
                تلاش دوباره
              </Button>
            }
          />
        )}
      </ResponsiveDrawer>
      <ResponsiveModal
        open={leaveReturnPromptOpen && Boolean(activeLeave)}
        onOpenChange={setLeaveReturnPromptOpen}
        title="شما در بازه مرخصی هستید"
        description="برای ثبت حضور این جلسه، ابتدا درخواست بازگشت خود را برای تأیید مدیر ارسال کنید."
      >
        <div className="grid gap-3" dir="rtl">
          <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            بازگشت از {sessionDate} درخواست می‌شود. تا تأیید مدیر، جلسه‌های مرخصی‌دار همچنان منجمد
            هستند.
          </p>
          <div className="flex gap-2">
            <Button
              variant="soft"
              className="flex-1"
              onClick={() => setLeaveReturnPromptOpen(false)}
            >
              فعلاً خیر
            </Button>
            <Button
              className="flex-1"
              disabled={!activeLeave || requestLeaveReturn.isPending}
              onClick={() => activeLeave && requestLeaveReturn.mutate(activeLeave.id)}
            >
              ارسال درخواست بازگشت
            </Button>
          </div>
        </div>
      </ResponsiveModal>
      <ResponsiveModal
        open={Boolean(reportTarget)}
        onOpenChange={(next) => !next && setReportTarget(null)}
        title="گزارش خصوصی برای مدیر"
        description={reportTarget ? `دربارهٔ ${reportTarget.name}` : ""}
      >
        {reportTarget ? (
          <div className="space-y-3" dir="rtl">
            <textarea
              value={reportText[reportTarget.id] ?? ""}
              onChange={(event) =>
                setReportText((current) => ({ ...current, [reportTarget.id]: event.target.value }))
              }
              maxLength={2000}
              placeholder="مشاهده، نگرانی یا پیگیری مربوط به این دانش‌آموز"
              className="min-h-32 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 text-sm"
            />
            <Button
              disabled={report.isPending || (reportText[reportTarget.id] ?? "").trim().length < 2}
              onClick={() =>
                report.mutate({
                  studentId: reportTarget.id,
                  message: reportText[reportTarget.id].trim(),
                })
              }
            >
              ارسال برای مدیر
            </Button>
          </div>
        ) : null}
      </ResponsiveModal>
    </>
  );
}
