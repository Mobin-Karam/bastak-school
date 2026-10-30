import { attendanceRequestId } from "../model/attendance-request-id";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Check, Radio, Building2 } from "lucide-react";
import type {
  DormAttendanceAssignment,
  DormAttendanceWrite,
  StudentAttendancePool,
} from "@moshaver/api-contract";
import { useAuth } from "../../../identity/auth";
import { api } from "../../../../shared/api/api";
import { Card } from "../../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { notify } from "../../../../shared/ui/notifications";
import { AttendanceRosterView } from "../views/AttendanceRosterView";
import { AttendanceStatusTiles } from "./AttendanceStatusTiles";
import { useAttendanceDiscard } from "./useAttendanceDiscard";
import type {
  AttendanceFilter,
  AttendanceParticipant,
  AttendanceStatus,
} from "../model/attendance-workflow";
import {
  confirmAttendancePool,
  getMyAttendancePools,
  getMyDormAssignments,
  markDelegatedDormAttendance,
} from "../api/attendance-operations.api";

function PoolConfirmation({
  pool,
  onConfirmed,
  onClose,
}: {
  pool: StudentAttendancePool;
  onConfirmed: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await confirmAttendancePool(pool.id);
      notify("حضور شما در فراخوان تأیید شد.", "success");
      onConfirmed();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تأیید حضور انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <ResponsiveDrawer
      open
      dismissible={!busy}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      title={pool.title}
      description="فراخوان حضور مدرسه"
      desktopSide="left"
    >
      <div className="space-y-4 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30">
          <Radio size={30} />
        </span>
        <p className="text-lg font-black">آیا در {pool.place} حضور دارید؟</p>
        <p className="text-sm leading-6 text-slate-500">
          فقط وقتی در محل هستید تأیید کنید. فرصت تأیید تا{" "}
          {new Date(pool.endsAt).toLocaleTimeString("fa-IR", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          است.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className="min-h-14 w-full rounded-2xl bg-blue-600 px-4 font-bold text-white disabled:opacity-50"
        >
          <Check className="me-2 inline" size={20} />
          {busy ? "در حال تأیید…" : "اینجا هستم"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="min-h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] text-sm"
        >
          هنوز در محل نیستم
        </button>
      </div>
    </ResponsiveDrawer>
  );
}

/** Mounted across student routes, so a new gathering appears without opening Attendance. */
export function StudentAttendancePoolPrompt() {
  const auth = useAuth();
  const cache = useQueryClient();
  const enabled = auth.can("attendance.self.read");
  const scope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ["my-attendance-pools", scope],
    queryFn: getMyAttendancePools,
    enabled,
    refetchInterval: enabled ? 10000 : false,
  });
  useEffect(() => {
    setDismissed([]);
  }, [scope]);
  useEffect(() => {
    if (!enabled) return;
    const events = api.openEvents((type) => {
      if (type === "attendance.updated")
        void cache.invalidateQueries({ queryKey: ["my-attendance-pools", scope] });
    });
    return () => events.close();
  }, [cache, enabled, scope]);
  const pool = enabled ? query.data?.find((item) => !dismissed.includes(item.id)) : undefined;
  return pool ? (
    <PoolConfirmation
      key={`${scope}:${pool.id}`}
      pool={pool}
      onClose={() => setDismissed((all) => [...all, pool.id])}
      onConfirmed={() => {
        setDismissed((all) => [...all, pool.id]);
        void query.refetch();
      }}
    />
  ) : null;
}

function DormAttendanceEditor({
  assignment,
  scope,
  onSaved,
  onClose,
}: {
  assignment: DormAttendanceAssignment;
  scope: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const initial = assignment.roster.map((member) => ({
    ...member,
    studentNumber: "",
    status: member.approvedLeave
      ? "excused"
      : (assignment.records.find((record) => record.studentId === member.id)?.status ?? "present"),
  })) as AttendanceParticipant[];
  const baseline = useRef(initial);
  const editingRevision = useRef(assignment.revision);
  const [participants, setParticipants] = useState(initial);
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{ fingerprint: string; body: DormAttendanceWrite } | null>(null);
  const dirty = participants.some(
    (member, index) => member.status !== baseline.current[index]?.status,
  );
  const discard = useAttendanceDiscard(dirty, busy, scope);
  const counts = useMemo(
    () =>
      participants.reduce(
        (all, member) => {
          all[member.status]++;
          return all;
        },
        { unmarked: 0, present: 0, absent: 0, late: 0, excused: 0 } as Record<
          AttendanceStatus,
          number
        >,
      ),
    [participants],
  );
  const filtered = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("fa-IR")
      .replaceAll("ي", "ی")
      .replaceAll("ك", "ک");
    return participants.filter((member) => {
      if (filter !== "all" && member.status !== filter) return false;
      if (!normalizedSearch) return true;
      return `${member.name} ${member.studentNumber}`
        .toLocaleLowerCase("fa-IR")
        .replaceAll("ي", "ی")
        .replaceAll("ك", "ک")
        .includes(normalizedSearch);
    });
  }, [filter, participants, search]);
  // The editor deliberately keeps untouched residents unmarked.  Only the final,
  // idempotent submission turns them into present records, matching lesson attendance.
  const entries = participants.map((member) => ({
    studentId: member.id,
    status: (member.status === "unmarked" ? "present" : member.status) as
      "present" | "absent" | "late" | "excused",
  }));
  async function save() {
    if (busy || !assignment.canMark || !entries.length) return;
    setBusy(true);
    setError("");
    try {
      const input = {
        nightDate: assignment.nightDate,
        attendancePeriod: assignment.attendancePeriod,
        expectedRevision: editingRevision.current,
        entries,
      };
      const fingerprint = JSON.stringify(input);
      if (pending.current?.fingerprint !== fingerprint)
        pending.current = { fingerprint, body: { ...input, requestId: attendanceRequestId() } };
      const request = pending.current;
      if (!request) throw new Error("درخواست حضور آماده نشد.");
      await markDelegatedDormAttendance(assignment.id, request.body);
      pending.current = null;
      notify("حضور اتاق ثبت شد.", "success");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت حضور انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ResponsiveDrawer
        open
        dismissible={!busy}
        onOpenChange={(open) => {
          if (!open) discard.request(onClose);
        }}
        title={assignment.roomName}
        description="مسئولیت شما فقط حضور ساکنان همین اتاق در شب جاری است."
      >
        <div className="space-y-4">
          <Card className="grid gap-3 border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                <Building2 size={23} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-200">
                  اتاق محل مسئولیت
                </p>
                <h2 className="mt-0.5 truncate text-lg font-black text-ink">
                  {assignment.roomName}
                </h2>
              </div>
              <span className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-ink dark:bg-slate-900">
                شب{" "}
                {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                  timeZone: "Asia/Tehran",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(`${assignment.nightDate}T12:00:00`))}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/80 p-2 dark:bg-slate-900/80">
                <p className="text-[10px] text-slate-500">ساکن</p>
                <p className="text-lg font-black text-ink">
                  {participants.length.toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-2 dark:bg-slate-900/80">
                <p className="text-[10px] text-slate-500">غایب</p>
                <p className="text-lg font-black text-rose-700 dark:text-rose-300">
                  {counts.absent.toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 p-2 dark:bg-slate-900/80">
                <p className="text-[10px] text-slate-500">وضعیت‌نداده</p>
                <p className="text-lg font-black text-ink">
                  {counts.unmarked.toLocaleString("fa-IR")}
                </p>
              </div>
            </div>
          </Card>
          <p className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            حضور با زمان فعلی ثبت می‌شود. اجازه شما از شب {assignment.startsOn} تا شب{" "}
            {assignment.endsOn} است.
          </p>
          {error ? (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          ) : null}
          <AttendanceStatusTiles counts={counts} filter={filter} onFilter={setFilter} />
          {review ? (
            <div className="space-y-4">
              <p className="text-sm leading-6">
                {counts.absent || counts.late
                  ? `${counts.absent + counts.late} وضعیت استثنایی انتخاب شده است؛ ${counts.unmarked} نفر انتخاب‌نشده در ثبت نهایی حاضر می‌شوند.`
                  : "هیچ غایب یا تأخیری انتخاب نشده است؛ با تأیید، حضور همه ساکنان ثبت می‌شود."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-12 flex-1 rounded-xl border border-[rgb(var(--border-subtle))]"
                  onClick={() => setReview(false)}
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save()}
                  className="min-h-12 flex-1 rounded-xl bg-blue-600 font-bold text-white disabled:opacity-50"
                >
                  {busy ? "در حال ثبت…" : "تأیید و ثبت حضور اتاق"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <AttendanceRosterView
                canManage={assignment.canMark}
                dormReviewMode
                participants={participants}
                filtered={filtered}
                selected
                filter={filter}
                search={search}
                loading={false}
                saving={busy}
                conflict={false}
                unmarkedCount={counts.unmarked}
                onFilterChange={setFilter}
                onSearchChange={setSearch}
                onClearFilters={() => {
                  setFilter("all");
                  setSearch("");
                }}
                onMark={(id, status) =>
                  setParticipants((all) =>
                    all.map((member) => (member.id === id ? { ...member, status } : member)),
                  )
                }
                onMarkAllPresent={() =>
                  setParticipants((all) =>
                    all.map((member) =>
                      member.status === "unmarked" ? { ...member, status: "present" } : member,
                    ),
                  )
                }
              />
              <button
                type="button"
                disabled={busy || !entries.length || !assignment.canMark}
                onClick={() => setReview(true)}
                className="sticky bottom-0 min-h-14 w-full rounded-2xl bg-blue-600 font-bold text-white disabled:opacity-50"
              >
                {counts.unmarked === participants.length
                  ? "تأیید حضور همه ساکنان"
                  : "بررسی و ثبت حضور اتاق"}
              </button>
            </>
          )}
        </div>
      </ResponsiveDrawer>
      {discard.confirmation}
    </>
  );
}

export function StudentAttendanceWorkspace({ scope }: { scope: string }) {
  const [searchParams] = useSearchParams();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [pool, setPool] = useState<StudentAttendancePool | null>(null);
  const assignments = useQuery({
    queryKey: ["my-dorm-attendance", scope],
    queryFn: getMyDormAssignments,
    refetchInterval: 30000,
  });
  const pools = useQuery({
    queryKey: ["my-attendance-pools", scope],
    queryFn: getMyAttendancePools,
    refetchInterval: 10000,
  });
  useEffect(() => {
    setAssignmentId(null);
    setPool(null);
  }, [scope]);
  useEffect(() => {
    const roomId = searchParams.get("roomId");
    const date = searchParams.get("date");
    const period = searchParams.get("period");
    if (!roomId || !date || (period !== "day" && period !== "night") || !assignments.data) return;
    const target = assignments.data.find(
      (item) =>
        item.roomId === roomId && item.nightDate === date && item.attendancePeriod === period,
    );
    if (target?.canMark) setAssignmentId(target.occurrenceId);
  }, [assignments.data, searchParams]);
  const selected = assignments.data?.find((item) => item.occurrenceId === assignmentId);
  const roomGroups = new Map<string, DormAttendanceAssignment[]>();
  for (const assignment of assignments.data ?? []) {
    const group = roomGroups.get(assignment.roomName) ?? [];
    group.push(assignment);
    roomGroups.set(assignment.roomName, group);
  }
  const orderedRoomGroups = [...roomGroups.entries()].sort(([left], [right]) => {
    const number = (value: string) => Number(value.match(/\d+/)?.[0]);
    const a = number(left);
    const b = number(right);
    return Number.isFinite(a) && Number.isFinite(b) && a !== b
      ? a - b
      : left.localeCompare(right, "fa", { numeric: true, sensitivity: "base" });
  });
  for (const [, slots] of orderedRoomGroups)
    slots.sort(
      (a, b) => a.nightDate.localeCompare(b.nightDate) || (a.attendancePeriod === "day" ? -1 : 1),
    );
  return (
    <>
      {assignments.isError ? (
        <p role="alert">
          مسئولیت‌های اتاق دریافت نشد.{" "}
          <button type="button" onClick={() => void assignments.refetch()}>
            تلاش مجدد
          </button>
        </p>
      ) : null}
      {assignments.data?.length ? (
        <Card className="space-y-3 rounded-3xl p-4">
          <h2 className="flex items-center gap-2 font-black">
            <Building2 size={20} /> مسئولیت حضور اتاق
          </h2>
          <p className="text-xs leading-5 text-slate-500">
            اتاق مسئولیت‌دار را انتخاب کنید؛ حضور فقط برای ساکنان همان اتاق ثبت می‌شود.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {orderedRoomGroups.map(([roomName, slots], roomIndex) => (
              <section
                key={roomName}
                className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3"
              >
                <h3 className="mb-2 flex items-center gap-2 text-base font-black text-ink">
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                    {(roomIndex + 1).toLocaleString("fa-IR")}
                  </span>
                  اتاق {roomName}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((assignment) => (
                    <button
                      key={assignment.occurrenceId}
                      type="button"
                      disabled={!assignment.canMark}
                      onClick={() => setAssignmentId(assignment.occurrenceId)}
                      className="min-h-24 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-2.5 text-right transition hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                    >
                      <span
                        className={`block text-xs font-black ${assignment.attendancePeriod === "night" ? "text-indigo-700 dark:text-indigo-300" : "text-amber-700 dark:text-amber-300"}`}
                      >
                        {assignment.attendancePeriod === "night" ? "شب · اصلی" : "روز"}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-ink">
                        {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                          timeZone: "Asia/Tehran",
                          weekday: "short",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(new Date(`${assignment.nightDate}T12:00:00`))}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {assignment.academicYearName} · {assignment.termName}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold text-brand">
                        {assignment.canMark
                          ? assignment.records.length
                            ? "ویرایش حضور"
                            : "ثبت حضور"
                          : assignment.sessionStatus === "submitted"
                            ? "در انتظار بازبینی ناظر"
                            : assignment.sessionStatus === "finalized"
                              ? "نهایی و بایگانی‌شده"
                              : assignment.sessionStatus === "cancelled"
                                ? "لغو شده"
                                : "بازه بسته است"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
      ) : null}
      {pools.isError ? (
        <p role="alert">
          فراخوان‌ها دریافت نشد.{" "}
          <button type="button" onClick={() => void pools.refetch()}>
            تلاش مجدد
          </button>
        </p>
      ) : null}
      {pools.data?.length ? (
        <Card className="space-y-3 rounded-3xl p-4">
          <h2 className="font-black">فراخوان‌های حضور فعال</h2>
          {pools.data.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setPool(item)}
              className="min-h-14 w-full rounded-2xl border border-blue-200 p-3 text-start"
            >
              <span className="block text-sm font-bold">{item.title}</span>
              <span className="mt-1 block text-xs text-slate-500">{item.place} · تأیید حضور</span>
            </button>
          ))}
        </Card>
      ) : null}
      {selected?.canMark ? (
        <DormAttendanceEditor
          key={`${scope}:${selected.occurrenceId}`}
          assignment={selected}
          scope={scope}
          onClose={() => setAssignmentId(null)}
          onSaved={() => {
            setAssignmentId(null);
            void assignments.refetch();
          }}
        />
      ) : null}
      {pool ? (
        <PoolConfirmation
          key={pool.id}
          pool={pool}
          onClose={() => setPool(null)}
          onConfirmed={() => {
            setPool(null);
            void pools.refetch();
          }}
        />
      ) : null}
    </>
  );
}
