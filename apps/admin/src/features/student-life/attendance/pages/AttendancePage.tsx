import type { AttendanceSessionDetail } from "@moshaver/api-contract";
import {
  awardAttendancePoints,
  getSavedAttendanceSession,
  submitAttendanceAbsences,
} from "../api/attendance-operations.api";
import { DormDelegateEditor } from "../components/DormDelegateEditor";
import {
  AttendanceStaffWorkspace,
  AttendanceProfileDialog,
} from "../components/AttendanceStaffWorkspace";
import { AttendanceStatusTiles } from "../components/AttendanceStatusTiles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Check,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  UserRoundCheck,
  X,
  CalendarCheck2,
  Radio,
  Trophy,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocale } from "../../../../shared/ui/locale";
import { Card } from "../../../../shared/ui/ui";
import { api, ApiError } from "../../../../shared/api/api";
import { notify } from "../../../../shared/ui/notifications";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { useAuth } from "../../../identity/auth";
import { useAttendanceDiscard } from "../components/useAttendanceDiscard";
import { AttendanceRosterView } from "../views/AttendanceRosterView";
import { PendingCorrectionQueue } from "../components/PendingCorrectionQueue";
import { AttendanceReviewQueue } from "../components/AttendanceReviewQueue";
import {
  attendanceStatusMeta as statusMeta,
  attendanceStatuses as statuses,
  type AttendanceFilter,
  type AttendanceParticipant,
  type AttendanceStatus,
  type MarkedAttendanceStatus,
} from "../model/attendance-workflow";
import {
  bulkMarkAttendance,
  getAttendanceParticipants,
  listAttendanceContexts,
  type AttendanceContextOption,
  type AttendanceContextType,
} from "../api/attendance.api";

type MarkedStatus = MarkedAttendanceStatus;
type Participant = AttendanceParticipant;
type Filter = AttendanceFilter;
import { prepareAttendanceWrite, type PendingAttendanceWrite } from "../model/attendance-write";
import { attendanceSessionWindow } from "../model/attendance-session-window";

type Notice = { kind: "success" | "warning" | "error" | "info"; text: string };

type AttendanceSection = AttendanceContextType | "sessions" | "pool";
const contextOrder: AttendanceContextType[] = ["class", "class_group", "dorm"];
const sectionLabels = {
  class: "کلاس",
  class_group: "گروه کلاس",
  dorm: "خوابگاه",
  sessions: "جلسات",
  pool: "حوضچه",
};
const contextIcon = {
  class: BookOpenCheck,
  class_group: UserRoundCheck,
  dorm: Building2,
  sessions: CalendarCheck2,
  pool: Radio,
} as const;
const shell = "border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]";
const muted = "text-slate-600 dark:text-slate-300";
const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

function contextTargetLabel(type: AttendanceContextType) {
  if (type === "dorm") return "اتاق خوابگاه";
  if (type === "class_group") return "گروه کلاس";
  return "کلاس";
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AttendancePage() {
  const auth = useAuth();
  const canViewStaffSessions = auth.canAny(["attendance.review", "attendance.class.read"]);
  const { profile } = useLocale();
  const navigate = useNavigate();
  const [linkedSession, setLinkedSession] = useState<AttendanceSessionDetail | null>(null);
  const [windowNow, setWindowNow] = useState(() => Date.now());
  useEffect(() => {
    if (!linkedSession?.scheduledStartAt || !linkedSession.scheduledEndAt) return;
    setWindowNow(Date.now());
    const timer = window.setInterval(() => setWindowNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [linkedSession?.id, linkedSession?.scheduledStartAt, linkedSession?.scheduledEndAt]);
  const sessionWindow = linkedSession ? attendanceSessionWindow(linkedSession, windowNow) : null;
  const sessionWindowActive = !sessionWindow || sessionWindow.active;
  const canManage = linkedSession
    ? linkedSession.status !== "cancelled" &&
      linkedSession.status !== "finalized" &&
      (linkedSession.scheduledStartAt !== null || sessionWindowActive) &&
      (auth.can("attendance.manage") ||
        (linkedSession.contextType === "class" && auth.can("attendance.class.manage")))
    : auth.can("attendance.manage");
  const sections: AttendanceSection[] = [
    ...contextOrder,
    ...(canViewStaffSessions ? (["sessions"] as const) : []),
    ...(auth.can("attendance.review") ? (["pool"] as const) : []),
  ];
  const scopeKey = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const scopeRef = useRef(scopeKey);
  scopeRef.current = scopeKey;
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("contextId");
  const requestedType = searchParams.get("contextType");
  const requestedSessionId = searchParams.get("sessionId");
  const requestedSectionParam = searchParams.get("section");
  const requestedSection: AttendanceSection =
    requestedSectionParam === "sessions" && canViewStaffSessions
      ? "sessions"
      : requestedSectionParam === "pool" && auth.can("attendance.review")
        ? "pool"
        : contextOrder.includes(requestedSectionParam as AttendanceContextType)
          ? (requestedSectionParam as AttendanceContextType)
          : "class";
  const requestedReviewRecordId =
    requestedSection === "sessions" ? searchParams.get("reviewRecordId") : null;
  const requestedCorrectionId =
    requestedSection === "sessions" ? searchParams.get("correctionId") : null;
  const [contexts, setContexts] = useState<AttendanceContextOption[]>([]);
  const [contextType, setContextType] = useState<AttendanceContextType>("class");
  const [chosenType, setChosenType] = useState<AttendanceSection>("class");
  const [contextId, setContextId] = useState("");
  const [groupClassId, setGroupClassId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staffRefreshVersion, setStaffRefreshVersion] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pointTarget, setPointTarget] = useState<{
    id: string;
    name: string;
    points: 1 | -1;
  } | null>(null);
  const [pointReason, setPointReason] = useState("");
  const [savingPoints, setSavingPoints] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loadingContexts, setLoadingContexts] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState(false);
  const [rosterVersion, setRosterVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [conflict, setConflict] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const baseline = useRef(new Map<string, AttendanceStatus>());
  const pendingWrite = useRef<PendingAttendanceWrite | null>(null);
  const targetScrollRequested = useRef(false);
  const requestId = useRef(0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const selected = useMemo(
    () => contexts.find((c) => c.id === contextId && c.contextType === contextType) ?? null,
    [contexts, contextId, contextType],
  );
  const dormAbsenceOnly = selected?.contextType === "dorm";
  useEffect(() => {
    setChosenType(requestedSection);
    if (contextOrder.includes(requestedSection as AttendanceContextType)) {
      setContextType(requestedSection as AttendanceContextType);
    }
    if (!requestedId) return;
    const requested = contexts.find(
      (context) =>
        context.id === requestedId && (!requestedType || context.contextType === requestedType),
    );
    if (!requested) return;
    setContextType(requested.contextType);
    setContextId(requested.id);
    setGroupClassId(requested.classId || "");
  }, [contexts, requestedId, requestedSection, requestedType]);
  const visibleContexts = useMemo(
    () =>
      contexts.filter((c) =>
        chosenType === "class_group"
          ? groupClassId
            ? c.contextType === "class_group" && c.classId === groupClassId
            : c.contextType === "class"
          : c.contextType === chosenType,
      ),
    [contexts, chosenType, groupClassId],
  );
  const dormBuildings = useMemo(() => {
    if (chosenType !== "dorm") return [] as Array<[string, AttendanceContextOption[]]>;
    const grouped = visibleContexts.reduce<Record<string, AttendanceContextOption[]>>(
      (all, room) => {
        (all[room.building || "ساختمان اصلی"] ||= []).push(room);
        return all;
      },
      {},
    );
    return Object.entries(grouped);
  }, [chosenType, visibleContexts]);
  const dirty = participants.some((p) => p.status !== (baseline.current.get(p.id) ?? "unmarked"));
  dirtyRef.current = dirty;
  savingRef.current = saving;
  const discard = useAttendanceDiscard(dirty, saving, scopeKey);

  const refreshHistory = useCallback(() => {
    if (scopeRef.current === scopeKey) setStaffRefreshVersion((v) => v + 1);
  }, [scopeKey]);

  useEffect(() => {
    if (targetScrollRequested.current && chosenType !== "sessions" && chosenType !== "pool") {
      document.getElementById("attendance-targets")?.scrollIntoView({ block: "start" });
      targetScrollRequested.current = false;
    }
  }, [chosenType]);

  useEffect(() => {
    let active = true;
    pendingWrite.current = null;
    setContexts([]);
    setContextId("");
    setChosenType(requestedSection);
    setGroupClassId("");
    setParticipants([]);
    setNotice(null);
    setConflict(false);
    setReviewOpen(false);
    setProfileId(null);
    setLoadingContexts(true);
    const linkedContexts = async () => {
      const rows = await listAttendanceContexts();
      if (requestedSessionId) {
        const session = await getSavedAttendanceSession(requestedSessionId);
        if (
          session.contextType !== requestedType ||
          session.contextId !== requestedId ||
          session.organizationId !== auth.context?.activeOrganization?.id
        )
          throw new Error("جلسه و زمینه مدرسه مطابقت ندارند.");
        if (
          session.contextType === "class" &&
          !rows.some((row) => row.id === session.contextId && row.contextType === "class")
        )
          rows.push({
            id: session.contextId,
            contextType: "class",
            code: "",
            name: session.title,
            label: session.title,
            total: session.roster.length,
            activeOrganizationId: session.organizationId,
          });
      }
      return rows;
    };
    void linkedContexts()
      .then((available) => {
        if (!active) return;
        setContexts(available);
        const requested = available.find(
          (c) => c.id === requestedId && (!requestedType || c.contextType === requestedType),
        );
        if (requested) {
          setContextType(requested.contextType);
          setChosenType(requested.contextType);
          setContextId(requested.id);
          setGroupClassId(requested.classId || "");
        }
      })
      .catch((error) => {
        if (active) {
          notify(errorText(error, "دریافت اطلاعات حضور و غیاب انجام نشد."), "error");
          setNotice({
            kind: "error",
            text: errorText(error, "دریافت اطلاعات حضور و غیاب انجام نشد."),
          });
        }
      })
      .finally(() => {
        if (active) setLoadingContexts(false);
      });
    return () => {
      active = false;
    };
    // URL params are initial selection only. Subsequent selection is controlled by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadVersion, scopeKey]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setParticipants([]);
    baseline.current.clear();
    setLinkedSession(null);
    pendingWrite.current = null;
    setPeopleError(false);
    setConflict(false);
    setFilter("all");
    setSearch("");
    if (!selected) {
      setLoadingPeople(false);
      return;
    }
    setLoadingPeople(true);
    setLinkedSession(null);
    const sessionId =
      selected.id === requestedId && selected.contextType === requestedType
        ? requestedSessionId
        : null;
    const fetchRoster = sessionId
      ? getSavedAttendanceSession(sessionId).then((session) => {
          if (
            session.contextId !== selected.id ||
            session.contextType !== selected.contextType ||
            session.organizationId !== selected.activeOrganizationId
          )
            throw new Error("جلسه متعلق به این کلاس و مدرسه نیست.");
          if (requestId.current === currentRequest) setLinkedSession(session);
          return session.roster.map((person) => ({
            ...person,
            status:
              session.records.find((record) => record.studentId === person.id)?.legacyStatus ??
              "unmarked",
          }));
        })
      : getAttendanceParticipants(selected.contextType, selected.id);
    void fetchRoster
      .then((rows) => {
        if (requestId.current !== currentRequest) return;
        baseline.current = new Map(
          rows.map((row) => [
            row.id,
            "status" in row ? (row.status as AttendanceStatus) : "unmarked",
          ]),
        );
        setParticipants(
          rows.map((row, index) => ({
            id: row.id,
            name: row.name,
            userId: row.userId,
            studentNumber: row.nationalCode || `#${index + 1}`,
            status: "status" in row ? (row.status as AttendanceStatus) : ("unmarked" as const),
          })),
        );
      })
      .catch((error) => {
        if (requestId.current === currentRequest) {
          setPeopleError(true);
          notify(errorText(error, "فهرست طلبه‌ها دریافت نشد."), "error");
          setNotice({ kind: "error", text: errorText(error, "فهرست طلبه‌ها دریافت نشد.") });
        }
      })
      .finally(() => {
        if (requestId.current === currentRequest) setLoadingPeople(false);
      });
    return () => {
      if (requestId.current === currentRequest) requestId.current += 1;
    };
  }, [selected, rosterVersion, requestedId, requestedType, requestedSessionId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || savingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const stream = api.openEvents((eventType, payload) => {
      if (
        eventType !== "attendance.updated" ||
        payload.contextId !== selected.id ||
        (linkedSession && payload.sessionId && payload.sessionId !== linkedSession.id) ||
        (payload.contextType && payload.contextType !== selected.contextType) ||
        (payload.organizationId && payload.organizationId !== selected.activeOrganizationId) ||
        (payload.updatedBy === auth.user?.id && savingRef.current)
      )
        return;
      void refreshHistory();
      if (dirtyRef.current || savingRef.current) {
        setConflict(true);
        setNotice({
          kind: "warning",
          text: "اطلاعات این گروه در جای دیگری تغییر کرده است. پیش از ثبت، تغییرات را بررسی کنید.",
        });
      } else {
        if (linkedSession) setRosterVersion((value) => value + 1);
        setNotice({
          kind: "info",
          text: "حضور و غیاب این گروه در جای دیگری تغییر کرده است. برای مشاهده وضعیت ذخیره‌شده به تاریخچه مراجعه کنید.",
        });
      }
    });
    return () => stream.close();
  }, [selected, refreshHistory, linkedSession, auth.user?.id]);

  const counts = useMemo(
    () =>
      participants.reduce(
        (acc, p) => {
          acc[p.status]++;
          return acc;
        },
        { unmarked: 0, present: 0, absent: 0, late: 0, excused: 0 } as Record<
          AttendanceStatus,
          number
        >,
      ),
    [participants],
  );
  const marked = participants.length - counts.unmarked;
  const progress = participants.length ? Math.round((marked / participants.length) * 100) : 0;
  const filtered = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("fa-IR")
      .replaceAll("ي", "ی")
      .replaceAll("ك", "ک");
    return participants.filter((participant) => {
      if (filter !== "all" && participant.status !== filter) return false;
      if (!normalizedSearch) return true;
      const haystack = `${participant.name} ${participant.studentNumber}`
        .toLocaleLowerCase("fa-IR")
        .replaceAll("ي", "ی")
        .replaceAll("ك", "ک");
      return haystack.includes(normalizedSearch);
    });
  }, [participants, filter, search]);

  function setAttendanceUrl(
    section: AttendanceSection,
    context?: {
      type: AttendanceContextType;
      id: string;
    },
  ) {
    const params = new URLSearchParams();
    params.set("section", section);
    if (context) {
      params.set("contextType", context.type);
      params.set("contextId", context.id);
    }
    navigate(`/admin/attendance?${params.toString()}`);
  }

  function chooseAttendanceType(type: AttendanceSection) {
    if (type === chosenType) return;
    discard.request(() => {
      setChosenType(type);
      setGroupClassId("");
      if (type !== "sessions" && type !== "pool") setContextType(type);
      setContextId("");
      setNotice(null);
      setAttendanceUrl(type);
    });
  }
  function chooseContext(type: AttendanceContextType, id: string) {
    if (type === contextType && id === contextId) return;
    discard.request(() => {
      setContextType(type);
      setContextId(id);
      setNotice(null);
      setAttendanceUrl(chosenType, { type, id });
    });
  }
  function closeRoster() {
    discard.request(() => {
      setContextId("");
      setReviewOpen(false);
      setNotice(null);
      setAttendanceUrl(chosenType);
    });
  }
  function mark(id: string, status: AttendanceStatus) {
    if (!canManage || saving || conflict) return;
    setParticipants((all) =>
      all.map((p) =>
        p.id === id
          ? {
              ...p,
              status: status === "unmarked" ? (baseline.current.get(id) ?? "unmarked") : status,
            }
          : p,
      ),
    );
    setNotice(null);
  }
  async function savePoints() {
    if (!pointTarget || !selected || savingPoints) return;
    const reason = pointReason.trim();
    if (reason.length < 3) return;
    const organizationId = selected.activeOrganizationId ?? auth.context?.activeOrganization?.id;
    if (!organizationId) {
      notify("مدرسه فعال برای ثبت امتیاز مشخص نیست.", "error");
      return;
    }
    setSavingPoints(true);
    try {
      await awardAttendancePoints({
        requestId: crypto.randomUUID(),
        organizationId,
        contextType: selected.contextType,
        contextId: selected.id,
        studentId: pointTarget.id,
        points: pointTarget.points,
        reason,
      });
      notify("امتیاز دانش‌آموز ثبت شد.", "success");
      setPointTarget(null);
      setPointReason("");
    } catch (error) {
      notify(errorText(error, "ثبت امتیاز انجام نشد."), "error");
    } finally {
      setSavingPoints(false);
    }
  }
  function markAllPresent() {
    if (!canManage || saving || conflict) return;
    // Only fills unmarked students so intentional absences/late arrivals remain intact.
    setParticipants((all) =>
      all.map((p) => (p.status === "unmarked" ? { ...p, status: "present" } : p)),
    );
    setNotice(null);
  }
  function resetDraft() {
    discard.request(() => {
      setParticipants((all) =>
        all.map((p) => ({ ...p, status: baseline.current.get(p.id) ?? "unmarked" })),
      );
      setNotice(null);
    });
  }
  async function save() {
    if (!canManage || saving || loadingPeople || conflict) return;
    if (requestedSessionId && selected?.id === requestedId && !linkedSession) {
      setNotice({ kind: "error", text: "ابتدا جلسه درس را بارگذاری کنید." });
      return;
    }
    if (!selected?.activeOrganizationId) {
      setNotice({ kind: "error", text: "مدرسه این گروه مشخص نیست." });
      return;
    }
    const entries = dormAbsenceOnly
      ? participants.map((p) => ({
          studentId: p.id,
          status: (p.status === "absent" ? "absent" : "present") as MarkedStatus,
        }))
      : participants
          .filter(
            (p): p is Participant & { status: MarkedStatus } =>
              p.status !== "unmarked" && p.status !== baseline.current.get(p.id),
          )
          .map((p) => ({ studentId: p.id, status: p.status }));
    // A saved session is absence-first: an empty draft explicitly means
    // everyone in its immutable roster is present.
    if (!entries.length && !linkedSession) {
      setNotice({ kind: "warning", text: "ابتدا وضعیت حداقل یک طلبه را مشخص کنید." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const write = prepareAttendanceWrite(
        pendingWrite.current,
        JSON.stringify({
          user: auth.user?.id,
          role: auth.activeRole,
          organizationId: selected.activeOrganizationId,
          contextType: selected.contextType,
          contextId: selected.id,
          sessionId: linkedSession?.id,
          expectedRevision: linkedSession?.revision,
          entries,
        }),
        () => ({
          organizationId: selected.activeOrganizationId!,
          contextType: selected.contextType,
          contextId: selected.id,
          sessionId: linkedSession?.id,
          expectedRevision: linkedSession?.revision,
          sessionDate: new Date().toISOString(),
          entries,
        }),
      );
      pendingWrite.current = write;
      if (linkedSession) {
        await submitAttendanceAbsences(linkedSession.id, {
          requestId: write.body.requestId!,
          expectedRevision: linkedSession.revision,
          absentStudentIds: participants
            .filter((person) => person.status === "absent")
            .map((person) => person.id),
          lateStudentIds: participants
            .filter((person) => person.status === "late")
            .map((person) => person.id),
        });
      } else {
        await bulkMarkAttendance(write.body);
      }
      if (scopeRef.current !== scopeKey) return;
      pendingWrite.current = null;
      if (linkedSession) setRosterVersion((value) => value + 1);
      setReviewOpen(false);
      setParticipants((all) => all.map((p) => ({ ...p, status: "unmarked" })));
      setNotice({
        kind: "success",
        text: `وضعیت ${entries.length} نفر با موفقیت ذخیره شد.`,
      });
      notify(`حضور و غیاب ${entries.length.toLocaleString("fa-IR")} نفر ثبت شد.`, "success");
      void refreshHistory();
    } catch (error) {
      if (scopeRef.current !== scopeKey) return;
      if (error instanceof ApiError && error.code === "ATTENDANCE_SESSION_STALE") {
        setConflict(true);
        setReviewOpen(false);
      }
      notify(errorText(error, "ثبت حضور و غیاب انجام نشد. دوباره تلاش کنید."), "error");
      setNotice({
        kind: "error",
        text: errorText(error, "ثبت حضور و غیاب انجام نشد. دوباره تلاش کنید."),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section dir={profile.direction} className="mx-auto w-full max-w-7xl space-y-4 pb-8">
      {notice && (
        <div
          role={notice.kind === "error" || notice.kind === "warning" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${notice.kind === "error" ? "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200" : notice.kind === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"}`}
        >
          <AlertCircle className="mt-0.5 shrink-0" size={17} />
          <p className="min-w-0 flex-1 leading-6">{notice.text}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="بستن پیام"
            className="rounded p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div
        className={`${shell} overflow-x-auto rounded-2xl p-1.5`}
        aria-label="مرحله اول: نوع حضور و غیاب"
      >
        <div
          className="grid min-w-0 gap-1"
          style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
        >
          {sections.map((type) => {
            const Icon = contextIcon[type];
            const active = chosenType === type;
            const total = contexts.filter((c) => c.contextType === type).length;
            return (
              <button
                type="button"
                key={type}
                aria-pressed={active}
                aria-label={`${sectionLabels[type]} ${type === "pool" ? "فراخوان زنده" : type === "sessions" ? "سوابق حضور" : `${total} مورد`}`}
                disabled={saving || loadingContexts}
                onClick={() => chooseAttendanceType(type)}
                className={`flex min-h-[5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-center transition-colors motion-reduce:transition-none sm:flex-row sm:justify-center ${active ? "bg-brand text-white shadow-sm" : "text-ink hover:bg-[rgb(var(--surface-muted))]"}`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-[rgb(var(--surface-muted))]"}`}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 text-[11px] font-bold leading-4 sm:text-sm">
                  {sectionLabels[type]}
                  <span
                    className={`block text-[10px] font-normal ${active ? "text-white/80" : muted}`}
                  >
                    {type === "pool"
                      ? "فراخوان زنده"
                      : type === "sessions"
                        ? "سوابق حضور"
                        : `${total} مورد`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {chosenType !== "sessions" && chosenType !== "pool" ? (
        <Card
          id="attendance-targets"
          className="space-y-6 rounded-3xl border border-sky-100 p-4 sm:p-6 dark:border-slate-700"
        >
          {!chosenType ? (
            <div className="rounded-xl bg-[rgb(var(--surface-muted))] px-4 py-5 text-center">
              <p className="font-bold">نوع حضور و غیاب را انتخاب کنید</p>
              <p className={`mt-1 text-xs ${muted}`}>
                در مرحله بعد، کلاس، گروه یا اتاق موردنظر را انتخاب می‌کنید.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="min-w-0 text-sm font-semibold">
                <span className="mb-2 flex items-center gap-3 text-lg font-black">
                  <span className="grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                    <BookOpenCheck size={23} aria-hidden="true" />
                  </span>{" "}
                  انتخاب{" "}
                  {chosenType === "class_group" && !groupClassId
                    ? "کلاس"
                    : contextTargetLabel(contextType)}
                </span>
                <p className="mb-5 text-sm leading-6 text-slate-500">
                  {chosenType === "class_group" && !groupClassId
                    ? "ابتدا کلاس را انتخاب کنید، سپس گروه موردنظر را باز کنید."
                    : "برای مشاهده اعضا و ثبت حضور اکنون، یک مورد را انتخاب کنید."}
                </p>
                {chosenType === "class_group" && groupClassId ? (
                  <button
                    type="button"
                    className={`${buttonBase} ${shell} mb-3`}
                    onClick={() => setGroupClassId("")}
                  >
                    بازگشت به کلاس‌ها
                  </button>
                ) : null}
                {contextType === "dorm" && auth.can("attendance.delegate") ? (
                  <DormDelegateEditor roomId="all" members={[]} scope={scopeKey} />
                ) : null}
                {contextType === "dorm" ? (
                  <div
                    className="max-h-[20rem] space-y-2 overflow-y-auto rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-2"
                    aria-label="ساختمان‌ها، طبقات و اتاق‌ها"
                  >
                    {dormBuildings.map(([building, rooms]) => (
                      <section
                        key={building}
                        className="rounded-xl bg-card p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_4px_14px_rgba(15,23,42,.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_4px_14px_rgba(0,0,0,.2)]"
                      >
                        <p className="px-1 text-xs font-black text-ink">{building}</p>
                        {[...new Set(rooms.map((room) => room.floor ?? 1))]
                          .sort((a, b) => a - b)
                          .map((floor) => (
                            <div key={floor} className="mt-2 flex items-center gap-2">
                              <span className="w-12 shrink-0 text-[11px] text-slate-500">
                                طبقه {floor}
                              </span>
                              <div className="grid flex-1 grid-cols-3 gap-1.5 sm:grid-cols-5">
                                {rooms
                                  .filter((room) => (room.floor ?? 1) === floor)
                                  .map((room) => {
                                    const active = room.id === contextId;
                                    return (
                                      <button
                                        key={room.id}
                                        type="button"
                                        disabled={saving}
                                        onClick={() => chooseContext("dorm", room.id)}
                                        aria-pressed={active}
                                        className={`min-h-14 rounded-lg border px-1.5 text-center text-[11px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${active ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-ink shadow-[0_3px_0_rgba(15,23,42,.12)] hover:-translate-y-0.5"}`}
                                      >
                                        <span className="block truncate">{room.code}</span>
                                        <span
                                          className={`mt-0.5 block text-[10px] font-normal ${active ? "text-blue-700 dark:text-blue-200" : muted}`}
                                        >
                                          {room.total.toLocaleString("fa-IR")} نفر
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          ))}
                      </section>
                    ))}
                    {!dormBuildings.length ? (
                      <p className={`p-4 text-center text-xs ${muted}`}>
                        اتاق فعالی برای حضور و غیاب ندارید.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    aria-label={`انتخاب ${contextTargetLabel(contextType)}`}
                  >
                    {visibleContexts.map((item) => {
                      const active = item.id === contextId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`${item.name} ${item.code} · ${item.total.toLocaleString("fa-IR")} نفر`}
                          disabled={saving}
                          onClick={() => {
                            if (chosenType === "class_group" && !groupClassId) {
                              setGroupClassId(item.id);
                            } else chooseContext(contextType, item.id);
                          }}
                          aria-pressed={active}
                          className={`min-h-32 rounded-2xl border p-5 text-start transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${active ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100" : "border-sky-100 bg-[rgb(var(--surface-muted))] text-ink hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:bg-slate-800"}`}
                        >
                          <span
                            aria-hidden="true"
                            className="float-end grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                          >
                            <UserRoundCheck size={23} />
                          </span>
                          <span className="block truncate text-base font-black">{item.name}</span>
                          <span
                            className={`mt-2 block text-sm ${active ? "text-blue-700 dark:text-blue-200" : muted}`}
                          >
                            {item.code} · {item.total.toLocaleString("fa-IR")} نفر
                          </span>
                        </button>
                      );
                    })}
                    {!visibleContexts.length ? (
                      <p
                        className={`col-span-full rounded-xl bg-[rgb(var(--surface-muted))] p-4 text-center text-xs ${muted}`}
                      >
                        موردی یافت نشد.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
          {loadingContexts ? (
            <p className={`text-sm ${muted}`}>در حال دریافت کلاس‌ها و گروه‌ها…</p>
          ) : contexts.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-sm ${muted}`}>
                هنوز گروه یا کلاسی برای حضور و غیاب تعریف نشده است.
              </p>
              <button
                type="button"
                onClick={() => setLoadVersion((v) => v + 1)}
                className={`${buttonBase} ${shell}`}
              >
                تلاش مجدد
              </button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <ResponsiveDrawer
        open={Boolean(selected)}
        dismissible={!saving}
        onOpenChange={(open) => {
          if (!open) closeRoster();
        }}
        title={reviewOpen ? "مرور نهایی حضور و غیاب" : selected?.name || "ثبت حضور و غیاب"}
        description={
          reviewOpen
            ? "خلاصه وضعیت‌ها و دانش‌آموزان ثبت‌نشده را بررسی کنید و سپس ذخیره را تأیید کنید."
            : selected
              ? `${contextTargetLabel(selected.contextType)}${linkedSession ? ` · ${linkedSession.title}` : " · ثبت برای امروز"} · ${participants.length.toLocaleString("fa-IR")} نفر`
              : "وضعیت اعضا را ثبت کنید؛ پیش از ذخیره، خلاصه تغییرات را مرور خواهید کرد."
        }
        desktopSide="left"
        className="md:w-[min(64rem,96vw)]"
      >
        <div
          dir={profile.direction}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div hidden={reviewOpen} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                {linkedSession
                  ? `${linkedSession.title} · ${linkedSession.status === "cancelled" ? "لغو شده؛ فقط مشاهده تاریخچه" : "حضور همین وقوع درس ثبت می‌شود."}`
                  : "این جلسه با زمان فعلی ثبت می‌شود."}
              </p>
              {linkedSession && sessionWindow?.message ? (
                <p
                  role="status"
                  className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                >
                  {sessionWindow.message}
                </p>
              ) : null}
              {notice && !reviewOpen ? (
                <p role={notice.kind === "error" ? "alert" : "status"} className="text-sm">
                  {notice.text}
                </p>
              ) : null}
              {peopleError ? (
                <button
                  type="button"
                  className={`${buttonBase} ${shell}`}
                  onClick={() => setRosterVersion((v) => v + 1)}
                >
                  تلاش مجدد
                </button>
              ) : null}
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">پیشرفت ثبت حضور</p>
                      <p className={`text-xs ${muted}`}>
                        {marked} از {participants.length} نفر تعیین وضعیت شده‌اند
                      </p>
                    </div>
                    <span className="text-xl font-black tabular-nums">{progress}٪</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="پیشرفت تعیین وضعیت"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  >
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <AttendanceStatusTiles counts={counts} filter={filter} onFilter={setFilter} />
                </>
              ) : null}
              {selected?.contextType === "dorm" && auth.can("attendance.delegate") ? (
                <DormDelegateEditor roomId={selected.id} members={participants} scope={scopeKey} />
              ) : null}
              <AttendanceRosterView
                canManage={canManage}
                absenceFirst={Boolean(linkedSession)}
                absenceOnly={dormAbsenceOnly}
                participants={participants}
                filtered={filtered}
                selected={Boolean(selected)}
                filter={filter}
                search={search}
                loading={loadingPeople}
                saving={saving}
                conflict={conflict}
                unmarkedCount={counts.unmarked}
                onFilterChange={setFilter}
                onSearchChange={setSearch}
                onViewProfile={canViewStaffSessions ? setProfileId : undefined}
                onAdjustPoints={
                  auth.can("attendance.points.adjust")
                    ? (student, points) => {
                        setPointTarget({ id: student.id, name: student.name, points });
                        setPointReason("");
                      }
                    : undefined
                }
                onMark={mark}
                onMarkAllPresent={markAllPresent}
                onClearFilters={() => {
                  setFilter("all");
                  setSearch("");
                }}
              />

              {conflict && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={18} /> به‌روزرسانی هم‌زمان شناسایی شد. ذخیره تا بررسی مجدد
                    متوقف است.
                  </span>
                  <button
                    type="button"
                    className={`${buttonBase} border border-amber-400`}
                    onClick={() => {
                      discard.request(() => {
                        setRosterVersion((value) => value + 1);
                        setReviewOpen(false);
                        setNotice({
                          kind: "info",
                          text: "در حال دریافت آخرین وضعیت ذخیره‌شده…",
                        });
                      });
                    }}
                  >
                    دریافت آخرین وضعیت
                  </button>
                </div>
              )}
            </div>

            {canManage ? (
              <div className="z-10 shrink-0 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:px-5">
                <div className="mx-auto flex max-w-7xl items-center gap-2">
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <p className="text-sm font-bold">
                      {dormAbsenceOnly
                        ? `${counts.absent.toLocaleString("fa-IR")} غایب از ${participants.length.toLocaleString("fa-IR")} نفر`
                        : `${marked.toLocaleString("fa-IR")} از ${participants.length.toLocaleString("fa-IR")} تعیین وضعیت`}
                    </p>
                    <p className={`text-xs ${muted}`}>
                      {dirty ? "تغییرات آمادهٔ مرور" : "هنوز تغییری ثبت نشده"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetDraft}
                    aria-label="پاک‌کردن"
                    disabled={saving || !dirty}
                    className={`${buttonBase} ${shell} px-3 sm:px-4`}
                  >
                    <RotateCcw size={17} />
                    <span className="hidden sm:inline">پاک‌کردن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewOpen(true)}
                    disabled={saving || loadingPeople || !selected || !dirty || conflict}
                    className={`${buttonBase} flex-1 bg-brand text-white hover:brightness-95 sm:flex-none sm:min-w-52`}
                  >
                    {saving ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                    {saving
                      ? "در حال ثبت…"
                      : dormAbsenceOnly
                        ? `بررسی و ثبت اتاق ${counts.absent ? `(${counts.absent} غایب)` : ""}`
                        : `بررسی و ثبت حضور ${marked ? `(${marked})` : ""}`}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          {reviewOpen ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div className={`${shell} rounded-xl p-3`}>
                  <p className="font-bold">{selected?.name}</p>
                  <p className={`mt-1 text-sm ${muted}`}>
                    زمان ثبت: اکنون ·{" "}
                    {dormAbsenceOnly
                      ? `${counts.absent.toLocaleString("fa-IR")} غایب و ${(participants.length - counts.absent).toLocaleString("fa-IR")} حاضر`
                      : `${marked.toLocaleString("fa-IR")} از ${participants.length.toLocaleString("fa-IR")} نفر`}
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {statuses.map((status) => (
                    <div key={status} className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
                      <dt className={`text-xs ${muted}`}>{statusMeta[status].label}</dt>
                      <dd className="mt-1 text-xl font-black">{counts[status]}</dd>
                    </div>
                  ))}
                </dl>
                {dormAbsenceOnly ? (
                  <p
                    role="status"
                    className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                  >
                    فقط غایبان انتخاب شده‌اند.{" "}
                    {(participants.length - counts.absent).toLocaleString("fa-IR")} ساکن دیگر خودکار
                    حاضر ثبت می‌شوند.
                  </p>
                ) : counts.unmarked > 0 ? (
                  <p
                    role="status"
                    className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                  >
                    وضعیت {counts.unmarked} نفر مشخص نشده است. فقط {marked} وضعیت انتخاب‌شده ثبت
                    می‌شود؛ سایر افراد غایب محسوب نمی‌شوند.
                  </p>
                ) : null}
                {notice?.kind === "error" ? (
                  <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
                    {notice.text}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setReviewOpen(false)}
                  className={`${buttonBase} ${shell} w-full sm:w-auto`}
                >
                  بازگشت به فهرست
                </button>
                <button
                  type="button"
                  disabled={saving || conflict || !marked}
                  onClick={() => void save()}
                  className={`${buttonBase} w-full bg-brand text-white sm:w-auto sm:min-w-44`}
                >
                  {saving ? "در حال ثبت…" : "تأیید و ثبت"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </ResponsiveDrawer>
      {(chosenType === "sessions" && canViewStaffSessions) ||
      (chosenType === "pool" && auth.can("attendance.review")) ? (
        <>
          <AttendanceStaffWorkspace
            key={`${scopeKey}:${chosenType}`}
            section={chosenType === "pool" ? "pool" : "sessions"}
            contexts={contexts}
            scope={scopeKey}
            refreshVersion={staffRefreshVersion}
            onNewSession={() =>
              discard.request(() => {
                targetScrollRequested.current = true;
                setChosenType("class");
                setContextType("class");
                setContextId("");
                setGroupClassId("");
                setAttendanceUrl("class");
              })
            }
          />
          {chosenType === "sessions" && auth.can("attendance.review") ? (
            <div className="grid items-start gap-4 xl:grid-cols-2">
              <AttendanceReviewQueue initialRecordId={requestedReviewRecordId} />
              <PendingCorrectionQueue initialCorrectionId={requestedCorrectionId} />
            </div>
          ) : null}
        </>
      ) : null}
      {profileId && canViewStaffSessions ? (
        <AttendanceProfileDialog
          studentId={profileId}
          scope={scopeKey}
          onClose={() => setProfileId(null)}
        />
      ) : null}
      <ResponsiveDrawer
        open={Boolean(pointTarget)}
        dismissible={!savingPoints}
        onOpenChange={(open) => {
          if (!open && !savingPoints) {
            setPointTarget(null);
            setPointReason("");
          }
        }}
        title={pointTarget?.points === 1 ? "افزودن امتیاز" : "کسر امتیاز"}
        description={pointTarget ? `${pointTarget.name} · ${selected?.name ?? ""}` : ""}
        desktopSide="left"
      >
        <div className="space-y-4" dir="rtl">
          <p className="flex items-center gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
            <Trophy size={18} className="shrink-0 text-amber-600" aria-hidden="true" />
            برای ثبت {pointTarget?.points ?? 0} امتیاز، دلیل روشن و قابل پیگیری وارد کنید.
          </p>
          <label className="block text-sm font-bold">
            دلیل
            <textarea
              autoFocus
              value={pointReason}
              onChange={(event) => setPointReason(event.target.value)}
              maxLength={500}
              disabled={savingPoints}
              className="mt-2 min-h-24 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 font-normal text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            />
          </label>
          <button
            type="button"
            disabled={savingPoints || pointReason.trim().length < 3}
            onClick={() => void savePoints()}
            className={`${buttonBase} w-full bg-blue-600 text-white hover:bg-blue-700`}
          >
            {savingPoints ? "در حال ثبت…" : "ثبت امتیاز"}
          </button>
        </div>
      </ResponsiveDrawer>
      {discard.confirmation}
    </section>
  );
}
