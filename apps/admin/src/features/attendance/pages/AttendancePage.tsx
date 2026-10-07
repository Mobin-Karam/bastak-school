import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Building2, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button, Card } from "../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import {
  bulkMarkAttendance,
  contextLabelMap,
  getAttendanceParticipants,
  listAttendanceContexts,
  listAttendanceSessions,
  type AttendanceContextOption,
  type AttendanceContextType,
} from "../api/attendance.api";

type MarkedStatus = "present" | "absent" | "late" | "excused";
type AttendanceStatus = "unmarked" | MarkedStatus;
type Participant = { id: string; name: string; studentNumber: string; status: AttendanceStatus };

const contextOrder: AttendanceContextType[] = ["class", "class_group", "dorm"];
const contextIcon = { class: BookOpenCheck, class_group: UserRoundCheck, dorm: Building2 } as const;
const statusMeta: Record<MarkedStatus, { label: string; className: string }> = {
  present: { label: "حاضر", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  absent: { label: "غایب", className: "border-rose-300 bg-rose-50 text-rose-700" },
  late: { label: "دیر", className: "border-amber-300 bg-amber-50 text-amber-700" },
  excused: { label: "موجه", className: "border-sky-300 bg-sky-50 text-sky-700" },
};
const markableStatuses = Object.keys(statusMeta) as MarkedStatus[];

export function AttendancePage() {
  const [searchParams] = useSearchParams();
  const [contexts, setContexts] = useState<AttendanceContextOption[]>([]);
  const [contextType, setContextType] = useState<AttendanceContextType>("class");
  const [contextId, setContextId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof listAttendanceSessions>>>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const requestedContextId = searchParams.get("contextId");
  const requestedContextType = searchParams.get("contextType") as AttendanceContextType | null;

  useEffect(() => {
    Promise.all([listAttendanceContexts(), listAttendanceSessions()])
      .then(([available, history]) => {
        setContexts(available);
        setSessions(history);
        const first =
          available.find(
            (item) =>
              item.id === requestedContextId &&
              (!requestedContextType || item.contextType === requestedContextType),
          ) ??
          available.find((item) => item.contextType === "class") ??
          available[0];
        if (first) {
          setContextType(first.contextType);
          setContextId(first.id);
        }
      })
      .catch(() => setMessage("دریافت اطلاعات حضور و غیاب انجام نشد."));
  }, [requestedContextId, requestedContextType]);

  const visibleContexts = useMemo(
    () => contexts.filter((item) => item.contextType === contextType),
    [contexts, contextType],
  );
  const selected = useMemo(
    () => visibleContexts.find((item) => item.id === contextId) ?? visibleContexts[0] ?? null,
    [contextId, visibleContexts],
  );

  useEffect(() => {
    if (!selected) {
      setParticipants([]);
      return;
    }
    if (selected.id !== contextId) setContextId(selected.id);
    getAttendanceParticipants(selected.contextType, selected.id)
      .then((rows) =>
        setParticipants(
          rows.map((row, index) => ({
            id: row.id,
            name: row.name,
            studentNumber: row.nationalCode || `#${index + 1}`,
            status: "unmarked",
          })),
        ),
      )
      .catch(() => {
        setParticipants([]);
        setMessage("فهرست طلبه‌ها دریافت نشد.");
      });
  }, [contextId, selected]);

  const counts = useMemo(
    () =>
      participants.reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        { unmarked: 0, present: 0, absent: 0, late: 0, excused: 0 } as Record<
          AttendanceStatus,
          number
        >,
      ),
    [participants],
  );

  async function save() {
    if (!selected?.activeOrganizationId) {
      setMessage("مدرسه این گروه مشخص نیست.");
      return;
    }
    const entries = participants
      .filter((item): item is Participant & { status: MarkedStatus } => item.status !== "unmarked")
      .map((item) => ({ studentId: item.id, status: item.status }));
    if (!entries.length) {
      setMessage("ابتدا حداقل یک وضعیت حضور ثبت کنید.");
      return;
    }
    setSaving(true);
    try {
      await bulkMarkAttendance({
        organizationId: selected.activeOrganizationId,
        contextType: selected.contextType,
        contextId: selected.id,
        sessionDate: new Date().toISOString(),
        entries,
      });
      setMessage(`حضور ${entries.length} نفر ثبت شد.`);
      setSessions(await listAttendanceSessions());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ثبت حضور انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4" dir="rtl">
      <ManagementPageHeader
        eyebrow="MVP"
        title="حضور و غیاب"
        description="حضور کلاس، گروه کلاس و اتاق خوابگاه. هیچ وضعیت فرضی ثبت نمی‌شود؛ وضعیت‌ها باید صریحاً انتخاب شوند."
      />
      {message ? <p className="rounded-lg bg-brand/5 p-3 text-sm text-brand">{message}</p> : null}

      <div className="grid gap-2 sm:grid-cols-3">
        {contextOrder.map((type) => {
          const Icon = contextIcon[type];
          const count = contexts.filter((item) => item.contextType === type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setContextType(type);
                const first = contexts.find((item) => item.contextType === type);
                setContextId(first?.id ?? "");
              }}
              className={`rounded-xl border p-3 text-right ${contextType === type ? "border-brand bg-brand/5" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]"}`}
            >
              <div className="flex items-center justify-between">
                <b>{contextLabelMap[type]}</b>
                <Icon size={17} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{count} مورد فعال</p>
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="grid min-w-56 gap-1 text-sm font-bold">
            {contextLabelMap[contextType]}
            <select
              className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
              value={selected?.id ?? ""}
              onChange={(e) => setContextId(e.target.value)}
            >
              {visibleContexts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="soft"
              disabled={!participants.length}
              onClick={() =>
                setParticipants((all) => all.map((item) => ({ ...item, status: "present" })))
              }
            >
              همه حاضر
            </Button>
            <Button disabled={saving || !selected} onClick={() => void save()}>
              {saving ? "در حال ذخیره…" : "ثبت حضور"}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
          <div className="rounded-lg bg-slate-100 p-2">
            ثبت‌نشده: <b>{counts.unmarked}</b>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2">
            حاضر: <b>{counts.present}</b>
          </div>
          <div className="rounded-lg bg-rose-50 p-2">
            غایب: <b>{counts.absent}</b>
          </div>
          <div className="rounded-lg bg-amber-50 p-2">
            دیر: <b>{counts.late}</b>
          </div>
          <div className="rounded-lg bg-sky-50 p-2">
            موجه: <b>{counts.excused}</b>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y divide-[rgb(var(--border-subtle))]">
          {participants.map((student) => (
            <div
              key={student.id}
              className="grid gap-3 p-3 md:grid-cols-[minmax(180px,1fr)_auto] md:items-center"
            >
              <div>
                <p className="font-bold text-ink">{student.name}</p>
                <p className="text-xs text-slate-500">{student.studentNumber}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {markableStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setParticipants((all) =>
                        all.map((item) => (item.id === student.id ? { ...item, status } : item)),
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-bold ${student.status === status ? statusMeta[status].className : "border-[rgb(var(--border-subtle))] bg-transparent text-slate-500"}`}
                  >
                    {statusMeta[status].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!participants.length ? (
            <p className="p-6 text-center text-sm text-slate-500">
              برای این مورد طلبه‌ای پیدا نشد.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-black text-ink">آخرین جلسات</h2>
        <div className="mt-3 grid gap-2">
          {sessions.slice(0, 8).map((session) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgb(var(--border-subtle))] py-2 text-sm"
            >
              <span>
                {contextLabelMap[session.contextType]} · {session.contextLabel || session.contextId}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(session.sessionDate).toLocaleString("fa-IR")}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
