import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Check,
  Clock3,
  History,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../../../shared/ui/ui";
import { api } from "../../../shared/api/api";
import { notify } from "../../../shared/ui/notifications";
import { DatePicker } from "../../../shared/ui/date-picker";
import { useAuth } from "../../auth";
import { AttendanceReviewQueue } from "../components/AttendanceReviewQueue";
import { AttendanceRosterView } from "../views/AttendanceRosterView";
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
  contextLabelMap,
  getAttendanceParticipants,
  listAttendanceContexts,
  listAttendanceSessions,
  type AttendanceContextOption,
  type AttendanceContextType,
} from "../api/attendance.api";

type MarkedStatus = MarkedAttendanceStatus;
type Participant = AttendanceParticipant;
type Filter = AttendanceFilter;
type Notice = { kind: "success" | "warning" | "error" | "info"; text: string };

const contextOrder: AttendanceContextType[] = ["class", "class_group", "dorm"];
const contextIcon = { class: BookOpenCheck, class_group: UserRoundCheck, dorm: Building2 } as const;
const shell = "border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]";
const muted = "text-slate-500 dark:text-slate-400";
const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

function contextTargetLabel(type: AttendanceContextType) {
  if (type === "dorm") return "اتاق خوابگاه";
  if (type === "class_group") return "گروه کلاس";
  return "کلاس";
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function sessionTimestamp(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  // Today uses current instant; previous dates use local noon to avoid UTC-day shifts.
  if (date === localDate()) return new Date().toISOString();
  return new Date(year, month - 1, day, 12).toISOString();
}
function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AttendancePage() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("contextId");
  const requestedType = searchParams.get("contextType");
  const [contexts, setContexts] = useState<AttendanceContextOption[]>([]);
  const [contextType, setContextType] = useState<AttendanceContextType>("class");
  const [chosenType, setChosenType] = useState<AttendanceContextType | null>(null);
  const [contextId, setContextId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listAttendanceSessions>>>([]);
  const [date, setDate] = useState(localDate);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loadingContexts, setLoadingContexts] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [conflict, setConflict] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const requestId = useRef(0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const selected = useMemo(
    () => contexts.find((c) => c.id === contextId && c.contextType === contextType) ?? null,
    [contexts, contextId, contextType],
  );
  const visibleContexts = useMemo(
    () => (chosenType ? contexts.filter((c) => c.contextType === chosenType) : []),
    [contexts, chosenType],
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
  const dirty = participants.some((p) => p.status !== "unmarked");
  dirtyRef.current = dirty;
  savingRef.current = saving;

  const refreshHistory = useCallback(async () => {
    try {
      setSessions(await listAttendanceSessions());
    } catch {
      /* Non-critical history failure */
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingContexts(true);
    void Promise.all([listAttendanceContexts(), listAttendanceSessions()])
      .then(([available, history]) => {
        if (!active) return;
        setContexts(available);
        setSessions(history);
        const requested = available.find(
          (c) => c.id === requestedId && (!requestedType || c.contextType === requestedType),
        );
        if (requested) {
          setContextType(requested.contextType);
          setChosenType(requested.contextType);
          setContextId(requested.id);
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
  }, [loadVersion]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setParticipants([]);
    setConflict(false);
    setSearch("");
    setFilter("all");
    if (!selected) {
      setLoadingPeople(false);
      return;
    }
    setLoadingPeople(true);
    void getAttendanceParticipants(selected.contextType, selected.id)
      .then((rows) => {
        if (requestId.current !== currentRequest) return;
        setParticipants(
          rows.map((row, index) => ({
            id: row.id,
            name: row.name,
            studentNumber: row.nationalCode || `#${index + 1}`,
            status: "unmarked" as const,
          })),
        );
      })
      .catch((error) => {
        if (requestId.current === currentRequest) {
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
  }, [selected]);

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
      if (eventType !== "attendance.updated" || payload.contextId !== selected.id) return;
      void refreshHistory();
      if (dirtyRef.current || savingRef.current) {
        setConflict(true);
        setNotice({
          kind: "warning",
          text: "اطلاعات این گروه در جای دیگری تغییر کرده است. پیش از ثبت، تغییرات را بررسی کنید.",
        });
      } else {
        setNotice({
          kind: "info",
          text: "حضور و غیاب این گروه در جای دیگری تغییر کرده است. برای مشاهده وضعیت ذخیره‌شده به تاریخچه مراجعه کنید.",
        });
      }
    });
    return () => stream.close();
  }, [selected, refreshHistory]);

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
  const filtered = useMemo(
    () =>
      participants.filter((p) => {
        const term = search.trim().toLocaleLowerCase("fa-IR");
        return (
          (filter === "all" || p.status === filter) &&
          (!term || `${p.name} ${p.studentNumber}`.toLocaleLowerCase("fa-IR").includes(term))
        );
      }),
    [participants, search, filter],
  );

  function canDiscard() {
    return !dirtyRef.current || window.confirm("وضعیت‌های ثبت‌نشده پاک شوند؟");
  }
  function chooseAttendanceType(type: AttendanceContextType) {
    if (type === chosenType) return;
    if (saving || !canDiscard()) return;
    setChosenType(type);
    setContextType(type);
    setContextId("");
    setNotice(null);
  }
  function chooseContext(type: AttendanceContextType, id: string) {
    const targetId = id;
    if (type === contextType && targetId === contextId) return;
    if (saving || !canDiscard()) return;
    setContextType(type);
    setContextId(targetId);
    setNotice(null);
  }
  function chooseDate(next: string) {
    if (next === date || saving || !canDiscard()) return;
    setDate(next);
    setParticipants((all) => all.map((p) => ({ ...p, status: "unmarked" })));
    setConflict(false);
    setNotice(null);
  }
  function mark(id: string, status: AttendanceStatus) {
    if (saving || conflict) return;
    setParticipants((all) => all.map((p) => (p.id === id ? { ...p, status } : p)));
    setNotice(null);
  }
  function markAllPresent() {
    if (saving || conflict) return;
    // Only fills unmarked students so intentional absences/late arrivals remain intact.
    setParticipants((all) =>
      all.map((p) => (p.status === "unmarked" ? { ...p, status: "present" } : p)),
    );
    setNotice(null);
  }
  function resetDraft() {
    if (saving || !canDiscard()) return;
    setParticipants((all) => all.map((p) => ({ ...p, status: "unmarked" })));
    setConflict(false);
    setNotice(null);
  }
  async function save() {
    if (saving || loadingPeople || conflict) return;
    if (!selected?.activeOrganizationId) {
      setNotice({ kind: "error", text: "مدرسه این گروه مشخص نیست." });
      return;
    }
    const entries = participants
      .filter((p): p is Participant & { status: MarkedStatus } => p.status !== "unmarked")
      .map((p) => ({ studentId: p.id, status: p.status }));
    if (!entries.length) {
      setNotice({ kind: "warning", text: "ابتدا وضعیت حداقل یک طلبه را مشخص کنید." });
      return;
    }
    if (
      counts.unmarked > 0 &&
      !window.confirm(
        `وضعیت ${counts.unmarked} نفر هنوز مشخص نشده است. فقط ${entries.length} وضعیت ثبت شود؟`,
      )
    )
      return;
    setSaving(true);
    setNotice(null);
    try {
      await bulkMarkAttendance({
        organizationId: selected.activeOrganizationId,
        contextType: selected.contextType,
        contextId: selected.id,
        sessionDate: sessionTimestamp(date),
        entries,
      });
      setParticipants((all) => all.map((p) => ({ ...p, status: "unmarked" })));
      setNotice({
        kind: "success",
        text: `وضعیت ${entries.length} نفر با موفقیت ذخیره شد. برای ویرایش سوابق، امکان دریافت وضعیت ذخیره‌شده از API لازم است.`,
      });
      notify(`حضور و غیاب ${entries.length.toLocaleString("fa-IR")} نفر ثبت شد.`, "success");
      void refreshHistory();
    } catch (error) {
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
    <section
      dir="rtl"
      className="mx-auto w-full max-w-7xl space-y-4 pb-[calc(11.5rem+env(safe-area-inset-bottom))] lg:pb-8"
    >
      {auth.can("attendance.review") ? <AttendanceReviewQueue /> : null}
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

      <div className={`${shell} rounded-2xl p-1.5`} aria-label="مرحله اول: نوع حضور و غیاب">
        <div className="mb-1.5 flex items-center justify-between px-2 pt-1 text-[11px] font-bold text-slate-500">
          <span>مرحله ۱ از ۳</span>
          <span>نوع حضور و غیاب</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {contextOrder.map((type) => {
            const Icon = contextIcon[type];
            const active = chosenType === type;
            const total = contexts.filter((c) => c.contextType === type).length;
            return (
              <button
                type="button"
                key={type}
                aria-pressed={active}
                disabled={saving || loadingContexts}
                onClick={() => chooseAttendanceType(type)}
                className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center transition-colors motion-reduce:transition-none sm:flex-row sm:justify-center ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-slate-100 dark:bg-slate-800"}`}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 text-[11px] font-bold leading-4 sm:text-sm">
                  {contextLabelMap[type]}
                  <span
                    className={`block text-[10px] font-normal ${active ? "text-white/75" : muted}`}
                  >
                    {total} مورد
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="space-y-4 p-3 sm:p-5">
        {!chosenType ? (
          <div className="rounded-xl bg-[rgb(var(--surface-muted))] px-4 py-5 text-center">
            <p className="font-bold">نوع حضور و غیاب را انتخاب کنید</p>
            <p className={`mt-1 text-xs ${muted}`}>
              در مرحله بعد، کلاس، گروه یا اتاق موردنظر را انتخاب می‌کنید.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,220px)]">
            <div className="min-w-0 text-sm font-semibold">
              <span className="mb-1.5 block">
                مرحله ۲: انتخاب {contextTargetLabel(contextType)}
              </span>
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
                                      className={`min-h-14 rounded-lg border px-1.5 text-center text-[11px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${active ? "border-blue-500 bg-blue-600 text-white shadow-[0_5px_0_rgb(29,78,216)] translate-y-[-1px]" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-ink shadow-[0_3px_0_rgba(15,23,42,.12)] hover:-translate-y-0.5"}`}
                                    >
                                      <span className="block truncate">{room.code}</span>
                                      <span
                                        className={`mt-0.5 block text-[10px] font-normal ${active ? "text-white/75" : muted}`}
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
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  aria-label={`انتخاب ${contextTargetLabel(contextType)}`}
                >
                  {visibleContexts.map((item) => {
                    const active = item.id === contextId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={saving}
                        onClick={() => chooseContext(contextType, item.id)}
                        aria-pressed={active}
                        className={`min-h-[4.5rem] rounded-xl border p-2 text-right transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${active ? "border-blue-500 bg-blue-600 text-white shadow-[0_5px_0_rgb(29,78,216)] translate-y-[-1px]" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-ink shadow-[0_3px_0_rgba(15,23,42,.10)] hover:-translate-y-0.5"}`}
                      >
                        <span className="block truncate text-xs font-black">{item.name}</span>
                        <span
                          className={`mt-1 block text-[10px] ${active ? "text-white/75" : muted}`}
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
            <div className="block text-sm font-semibold">
              <span className="mb-1.5 block">تاریخ جلسه</span>
              <DatePicker
                value={date}
                max={localDate()}
                disabled={saving}
                onChange={chooseDate}
                className="w-full"
              />
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
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(["unmarked", ...statuses] as AttendanceStatus[]).map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFilter((f) => (f === status ? "all" : status))}
                  aria-pressed={filter === status}
                  className={`rounded-xl border px-2 py-3 text-center transition-colors ${filter === status ? "border-blue-500 ring-1 ring-blue-500" : "border-[rgb(var(--border-subtle))]"}`}
                >
                  <span className="block text-lg font-black tabular-nums">{counts[status]}</span>
                  <span className={`text-[11px] ${muted}`}>
                    {status === "unmarked" ? "نامشخص" : statusMeta[status].label}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </Card>

      <AttendanceRosterView
        participants={participants}
        filtered={filtered}
        selected={Boolean(selected)}
        search={search}
        filter={filter}
        loading={loadingPeople}
        saving={saving}
        conflict={conflict}
        unmarkedCount={counts.unmarked}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onMark={mark}
        onMarkAllPresent={markAllPresent}
        onClearFilters={() => {
          setSearch("");
          setFilter("all");
        }}
      />

      {conflict && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <span className="flex items-center gap-2">
            <ShieldAlert size={18} /> به‌روزرسانی هم‌زمان شناسایی شد. ذخیره تا بررسی مجدد متوقف است.
          </span>
          <button
            type="button"
            className={`${buttonBase} border border-amber-400`}
            onClick={() => {
              if (!canDiscard()) return;
              setParticipants((all) => all.map((p) => ({ ...p, status: "unmarked" })));
              setConflict(false);
              setNotice({
                kind: "info",
                text: "پیش‌نویس پاک شد. برای مشاهده داده‌های ثبت‌شده نیاز به API خواندن حضور است.",
              });
            }}
          >
            پاک‌کردن پیش‌نویس
          </button>
        </div>
      )}

      <Card className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-black">
            <History size={18} /> آخرین جلسات
          </h2>
          <button
            type="button"
            className="text-xs font-bold text-blue-600"
            onClick={() => void refreshHistory()}
          >
            به‌روزرسانی
          </button>
        </div>
        {sessions.length ? (
          <div className="divide-y divide-[rgb(var(--border-subtle))]">
            {sessions.slice(0, 6).map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="font-semibold">
                  {contextLabelMap[session.contextType]} ·{" "}
                  {session.contextLabel || session.contextId}
                </span>
                <span className={`flex items-center gap-1 text-xs ${muted}`}>
                  <Clock3 size={14} />
                  {new Date(session.sessionDate).toLocaleString("fa-IR")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${muted}`}>هنوز جلسه‌ای در تاریخچه نمایش داده نشده است.</p>
        )}
      </Card>

      <div
        className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-30 rounded-2xl border ${shell} p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] lg:sticky lg:inset-x-auto lg:bottom-4 lg:p-3`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="text-sm font-bold">
              {marked} از {participants.length} نفر
            </p>
            <p className={`text-xs ${muted}`}>
              {dirty ? "پیش‌نویس ذخیره نشده" : "وضعیتی برای ثبت انتخاب نشده"}
            </p>
          </div>
          <button
            type="button"
            onClick={resetDraft}
            disabled={saving || !dirty}
            className={`${buttonBase} ${shell} px-3 sm:px-4`}
          >
            <RotateCcw size={17} />
            <span className="hidden sm:inline">پاک‌کردن</span>
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loadingPeople || !selected || !dirty || conflict}
            className={`${buttonBase} flex-1 bg-blue-600 text-white hover:bg-blue-700 sm:flex-none sm:min-w-48`}
          >
            {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Check size={18} />}
            {saving ? "در حال ثبت…" : `ثبت حضور ${marked ? `(${marked})` : ""}`}
          </button>
        </div>
      </div>
    </section>
  );
}
