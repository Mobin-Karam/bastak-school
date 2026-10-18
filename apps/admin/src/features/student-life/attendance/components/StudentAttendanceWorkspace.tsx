import { attendanceRequestId } from "../model/attendance-request-id";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Radio, Building2 } from "lucide-react";
import type {
  DormAttendanceAssignment,
  DormAttendanceWrite,
  StudentAttendancePool,
} from "@moshaver/api-contract";
import { useAuth } from "../../../identity/auth";
import { api } from "../../../../shared/api/api";
import { Card } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
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
    <ResponsiveModal
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      title={pool.title}
      description="فراخوان حضور مدرسه"
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
    </ResponsiveModal>
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
    status:
      assignment.records.find((record) => record.studentId === member.id)?.status ?? "unmarked",
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
      "present" | "absent" | "late",
  }));
  async function save() {
    if (busy || !assignment.canMark || !entries.length) return;
    setBusy(true);
    setError("");
    try {
      const input = {
        nightDate: assignment.nightDate,
        expectedRevision: editingRevision.current,
        entries,
      };
      const fingerprint = JSON.stringify(input);
      if (pending.current?.fingerprint !== fingerprint)
        pending.current = { fingerprint, body: { ...input, requestId: attendanceRequestId() } };
      await markDelegatedDormAttendance(assignment.id, pending.current.body);
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
      <ResponsiveModal
        open
        onOpenChange={(open) => {
          if (!open) discard.request(onClose);
        }}
        title={assignment.roomName}
        description="مسئولیت شما فقط حضور ساکنان همین اتاق در شب جاری است."
      >
        <div className="space-y-4">
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
      </ResponsiveModal>
      {discard.confirmation}
    </>
  );
}

export function StudentAttendanceWorkspace({ scope }: { scope: string }) {
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
  const selected = assignments.data?.find((item) => item.id === assignmentId);
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
          {assignments.data.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4"
            >
              <p className="font-bold">{assignment.roomName}</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                شب‌های {assignment.startsOn} تا {assignment.endsOn} · فقط ساکنان این اتاق
              </p>
              <button
                type="button"
                disabled={!assignment.canMark}
                onClick={() => setAssignmentId(assignment.id)}
                className="mt-3 min-h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white disabled:opacity-50"
              >
                {assignment.canMark ? "ثبت حضور شب جاری" : "مسئولیت هنوز آغاز نشده است"}
              </button>
            </div>
          ))}
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
          key={`${scope}:${selected.id}:${selected.nightDate}`}
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
