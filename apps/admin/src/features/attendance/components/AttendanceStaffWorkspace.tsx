import { attendanceRequestId } from "../model/attendance-request-id";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, MapPin, UsersRound } from "lucide-react";
import { useAuth } from "../../auth";
import { Card } from "../../../shared/ui/ui";
import { ResponsiveModal } from "../../../shared/ui/responsive-modal";
import { notify } from "../../../shared/ui/notifications";
import { api } from "../../../shared/api/api";
import type { AttendanceContextOption } from "../api/attendance.api";
import { contextLabelMap } from "../api/attendance.api";
import {
  closeAttendancePool,
  createAttendancePool,
  getAttendanceOverview,
  getAttendancePools,
  getAttendanceProfile,
  getSavedAttendanceSession,
  getAttendanceSessionHistory,
  getStaffAttendanceSessions,
} from "../api/attendance-operations.api";
import type { AttendancePoolDraft, StaffAttendanceSession } from "@moshaver/api-contract";

const field =
  "min-h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card px-3 text-sm";
const action =
  "min-h-12 rounded-xl px-4 text-sm font-bold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500";
const labels = { ...contextLabelMap, pool: "پول / فراخوان", night: "حضور شب" };
const statuses = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
  excused: "موجه",
  unmarked: "نامشخص",
};

export function AttendanceProfileDialog({
  studentId,
  scope,
  onClose,
}: {
  studentId: string;
  scope: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["attendance-profile", scope, studentId],
    queryFn: () => getAttendanceProfile(studentId),
  });
  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={query.data?.name || "پرونده حضور طلبه"}
      description="پرونده کامل فقط برای مدیر و ناظر مدرسه قابل مشاهده است."
    >
      {query.isLoading ? (
        <p role="status">در حال دریافت پرونده…</p>
      ) : query.isError ? (
        <p role="alert">
          پرونده دریافت نشد.{" "}
          <button type="button" onClick={() => void query.refetch()}>
            تلاش مجدد
          </button>
        </p>
      ) : query.data ? (
        <div className="space-y-4">
          <dl className="grid grid-cols-4 gap-2">
            {Object.entries(query.data.counts).map(([key, count]) => (
              <div key={key} className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-center">
                <dt className="text-xs">{statuses[key as keyof typeof statuses]}</dt>
                <dd className="mt-1 text-xl font-black">{count.toLocaleString("fa-IR")}</dd>
              </div>
            ))}
          </dl>
          <ul className="space-y-2">
            {query.data.records.map((record) => (
              <li
                key={record.id}
                className="rounded-xl border border-[rgb(var(--border-subtle))] p-3 text-sm"
              >
                <p className="font-bold">
                  {labels[record.contextType]} · {record.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(record.sessionDate).toLocaleString("fa-IR", {
                    timeZone: "Asia/Tehran",
                  })}{" "}
                  · {statuses[record.status]}
                </p>
                {record.note ? <p className="mt-2 leading-6">{record.note}</p> : null}
              </li>
            ))}
          </ul>
          {!query.data.records.length ? (
            <p className="text-sm text-slate-500">هنوز حضوری ثبت نشده است.</p>
          ) : null}
        </div>
      ) : null}
    </ResponsiveModal>
  );
}

function SavedSessionDialog({
  id,
  scope,
  onClose,
}: {
  id: string;
  scope: string;
  onClose: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useQuery({
    queryKey: ["attendance-history", scope, id],
    queryFn: () => getAttendanceSessionHistory(id),
    enabled: historyOpen,
  });
  const [filter, setFilter] = useState("missing");
  const [profileId, setProfileId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["attendance-detail", scope, id],
    queryFn: () => getSavedAttendanceSession(id),
    refetchInterval: 15000,
  });
  const data = query.data;
  const roster = data?.roster ?? [];
  const members = roster.map((member) => ({
    ...member,
    status:
      data?.records.find((record) => record.studentId === member.id)?.legacyStatus ??
      ("unmarked" as const),
  }));
  const visible = members.filter(
    (member) =>
      filter === "all" ||
      (filter === "missing"
        ? member.status === "absent" || member.status === "excused" || member.status === "unmarked"
        : member.status === filter),
  );
  return (
    <>
      <ResponsiveModal
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={data?.title || "جزئیات جلسه"}
        description="غایبان و افرادی که حضورشان تأیید نشده جدا از حاضران نمایش داده می‌شوند."
      >
        {query.isLoading ? (
          <p role="status">در حال دریافت جلسه…</p>
        ) : query.isError ? (
          <p role="alert">
            جلسه دریافت نشد.{" "}
            <button type="button" onClick={() => void query.refetch()}>
              تلاش مجدد
            </button>
          </p>
        ) : data ? (
          <div className="space-y-4">
            <details
              className="rounded-xl border border-[rgb(var(--border-subtle))] p-3"
              onToggle={(event) => setHistoryOpen(event.currentTarget.open)}
            >
              <summary className="min-h-11 cursor-pointer text-sm font-bold">
                آخرین تغییرهای جلسه
              </summary>
              {historyOpen ? (
                history.isLoading ? (
                  <p role="status">در حال دریافت تغییرها…</p>
                ) : history.isError ? (
                  <p role="alert">
                    تغییرها دریافت نشد.{" "}
                    <button type="button" onClick={() => void history.refetch()}>
                      تلاش مجدد
                    </button>
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-500">
                    {history.data?.map((row) => (
                      <li key={row.id}>
                        به‌روزرسانی حضور ·{" "}
                        {new Date(row.createdAt).toLocaleString("fa-IR", {
                          timeZone: "Asia/Tehran",
                        })}
                      </li>
                    ))}
                    {!history.data?.length ? <li>تغییری برای این جلسه ثبت نشده است.</li> : null}
                  </ul>
                )
              ) : null}
            </details>
            <p className="text-sm text-slate-500">
              {new Date(data.sessionDate).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })} ·{" "}
              {data.marked.toLocaleString("fa-IR")} وضعیت ثبت‌شده
            </p>
            <select
              aria-label="فیلتر اعضای جلسه"
              className={field}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="missing">غایب یا حضور تأییدنشده</option>
              <option value="all">همه اعضا</option>
              <option value="absent">غایب</option>
              <option value="unmarked">حضور تأییدنشده</option>
              <option value="present">حاضر</option>
              <option value="late">تأخیر</option>
            </select>
            {!data.rosterComplete ? (
              <p
                role="status"
                className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
              >
                فهرست کامل این جلسه قدیمی ثبت نشده؛ تعداد افراد با وضعیت نامشخص قابل محاسبه نیست.
              </p>
            ) : null}
            <ul className="space-y-2">
              {visible.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
                >
                  <div>
                    <p className="text-sm font-bold">{member.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {member.status === "unmarked" ? "حضور تأیید نشده" : statuses[member.status]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileId(member.id)}
                    className={`${action} border border-[rgb(var(--border-subtle))]`}
                  >
                    پرونده حضور
                  </button>
                </li>
              ))}
            </ul>
            {data.rosterComplete && !visible.length ? (
              <p className="py-4 text-center text-sm text-slate-500">
                عضوی با این وضعیت وجود ندارد.
              </p>
            ) : null}
            {!data.rosterComplete ? (
              <ul className="space-y-2">
                {data.records
                  .filter(
                    (record) =>
                      filter === "all" ||
                      (filter === "missing"
                        ? ["absent", "excused"].includes(record.legacyStatus)
                        : record.legacyStatus === filter),
                  )
                  .map((record, index) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[rgb(var(--border-subtle))] p-3 text-sm"
                    >
                      <span>
                        عضو ثبت‌شده {index + 1} · {statuses[record.legacyStatus]}
                      </span>
                      <button
                        type="button"
                        className={action}
                        onClick={() => setProfileId(record.studentId)}
                      >
                        پرونده حضور
                      </button>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </ResponsiveModal>
      {profileId ? (
        <AttendanceProfileDialog
          studentId={profileId}
          scope={scope}
          onClose={() => setProfileId(null)}
        />
      ) : null}
    </>
  );
}

export function AttendanceStaffWorkspace({
  contexts,
  scope,
  refreshVersion,
  onNewSession,
  section,
}: {
  contexts: AttendanceContextOption[];
  scope: string;
  refreshVersion: number;
  onNewSession?: () => void;
  section: "sessions" | "pool";
}) {
  const auth = useAuth();
  const cache = useQueryClient();
  const [category, setCategory] = useState<StaffAttendanceSession["contextType"]>("class");
  const [contextFilter, setContextFilter] = useState("");
  const [poolContextFilter, setPoolContextFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const pending = useRef<{ fingerprint: string; body: AttendancePoolDraft } | null>(null);
  const overview = useQuery({
    queryKey: ["attendance-overview", scope],
    queryFn: getAttendanceOverview,
    refetchInterval: (query) =>
      Math.min(
        60000,
        Math.max(
          100,
          query.state.data
            ? new Date(query.state.data.resetsAt).getTime() - Date.now() + 50
            : 60000,
        ),
      ),
  });
  const sessions = useQuery({
    queryKey: ["attendance-staff-sessions", scope, refreshVersion],
    queryFn: getStaffAttendanceSessions,
    refetchInterval: 15000,
  });
  const pools = useQuery({
    queryKey: ["attendance-pools", scope],
    queryFn: getAttendancePools,
    enabled: section === "pool",
    refetchInterval: 10000,
  });
  useEffect(() => {
    setSelectedId(null);
    setTarget("");
    setTitle("");
    setPlace("");
    pending.current = null;
  }, [scope]);
  useEffect(() => {
    const events = api.openEvents((type) => {
      if (type === "attendance.updated") {
        void cache.invalidateQueries({ queryKey: ["attendance-overview", scope] });
        void cache.invalidateQueries({ queryKey: ["attendance-staff-sessions", scope] });
      }
    });
    return () => events.close();
  }, [cache, scope]);
  async function createPool(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const context = contexts.find((item) => `${item.contextType}:${item.id}` === target);
    if (!context?.activeOrganizationId) {
      setFormError("کلاس، گروه یا اتاقی از مدرسه فعال انتخاب کنید.");
      return;
    }
    setFormError("");
    setBusy(true);
    try {
      const input = {
        organizationId: context.activeOrganizationId,
        contextType: context.contextType,
        contextId: context.id,
        title,
        place,
        durationMinutes: minutes,
      };
      const fingerprint = JSON.stringify(input);
      if (pending.current?.fingerprint !== fingerprint)
        pending.current = { fingerprint, body: { ...input, requestId: attendanceRequestId() } };
      await createAttendancePool(pending.current.body);
      pending.current = null;
      setTitle("");
      setPlace("");
      await pools.refetch();
      await sessions.refetch();
      notify("فراخوان حضور برای حساب اعضا فعال شد.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "فراخوان ایجاد نشد.";
      setFormError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function close(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await closeAttendancePool(id);
      await pools.refetch();
      notify("فراخوان بسته شد؛ سوابق حفظ شدند.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "بستن فراخوان انجام نشد.", "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="space-y-5 rounded-3xl border border-sky-100 p-4 sm:p-6 dark:border-slate-700">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black">
          <CalendarCheck2 className="text-blue-600" size={22} />{" "}
          {section === "pool" ? "پول / فراخوان حضور" : "جلسات حضور"}
        </h2>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          خلاصه روزانه ساعت ۱۶ به وقت تهران از نو آغاز می‌شود. همه جلسات و پرونده‌ها در سوابق باقی
          می‌مانند.
        </p>
      </div>
      {overview.isLoading ? (
        <p role="status">در حال دریافت خلاصه…</p>
      ) : overview.isError ? (
        <p role="alert">
          خلاصه دریافت نشد.{" "}
          <button type="button" onClick={() => void overview.refetch()}>
            تلاش مجدد
          </button>
        </p>
      ) : overview.data ? (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ["جلسه", overview.data.sessions],
            ["حاضر", overview.data.present],
            ["غایب", overview.data.absent],
            ["تأخیر", overview.data.late],
            ["نامشخص", overview.data.unmarked],
          ].map(([label, count]) => (
            <div key={label} className="rounded-2xl bg-[rgb(var(--surface-muted))] p-3 text-center">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-1 text-xl font-black">{Number(count).toLocaleString("fa-IR")}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {section === "sessions" ? (
        <div className="space-y-3">
          {onNewSession && auth.can("attendance.manage") ? (
            <button
              type="button"
              onClick={onNewSession}
              className={`${action} w-full bg-blue-600 text-white`}
            >
              ثبت جلسه تازه اکنون
            </button>
          ) : null}
          <select
            aria-label="نوع جلسات حضور"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as typeof category);
              setContextFilter("");
            }}
            className={field}
          >
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="کلاس یا اتاق جلسات"
            className={field}
            value={contextFilter}
            onChange={(event) => setContextFilter(event.target.value)}
          >
            <option value="">همه کلاس‌ها و اتاق‌ها</option>
            {Array.from(
              new Map(
                (sessions.data ?? [])
                  .filter((session) => session.contextType === category)
                  .map((session) => [
                    session.contextId,
                    contexts.find((context) => context.id === session.contextId)?.name ||
                      session.title,
                  ]),
              ).entries(),
            ).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          {sessions.isLoading ? (
            <p role="status">در حال دریافت جلسات…</p>
          ) : sessions.isError ? (
            <p role="alert">
              جلسات دریافت نشد.{" "}
              <button type="button" onClick={() => void sessions.refetch()}>
                تلاش مجدد
              </button>
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.data
                ?.filter(
                  (session) =>
                    session.contextType === category &&
                    (!contextFilter || session.contextId === contextFilter),
                )
                .map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-[rgb(var(--border-subtle))] p-4 text-start hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setSelectedId(session.id)}
                    >
                      <p className="font-bold">{session.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(session.sessionDate).toLocaleString("fa-IR", {
                          timeZone: "Asia/Tehran",
                        })}
                      </p>
                      <p className="mt-2 text-xs">
                        {session.present} حاضر · {session.absent} غایب ·{" "}
                        {session.unmarked ?? "نامعلوم"} نامشخص
                      </p>
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {sessions.data && !sessions.data.some((session) => session.contextType === category) ? (
            <p className="py-4 text-center text-sm text-slate-500">
              جلسه‌ای در این بخش ثبت نشده است.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-500">
            برای جمع‌شدن اعضا در یک محل، فراخوان را فعال کنید. اعضای انتخاب‌شده در حساب خود «اینجا
            هستم» را تأیید می‌کنند. این تأیید، اعلام شخصی حضور است.
          </p>
          {formError ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
            >
              {formError}
            </p>
          ) : null}
          {auth.can("attendance.manage") ? (
            <form
              onSubmit={(event) => void createPool(event)}
              className="grid gap-3 rounded-2xl bg-[rgb(var(--surface-muted))] p-4 sm:grid-cols-2"
            >
              <label className="text-xs font-bold">
                اعضای فراخوان
                <select
                  className={`${field} mt-1`}
                  required
                  value={target}
                  disabled={busy}
                  onChange={(event) => setTarget(event.target.value)}
                >
                  <option value="">انتخاب کلاس، گروه یا اتاق</option>
                  {contexts.map((context) => (
                    <option
                      key={`${context.contextType}:${context.id}`}
                      value={`${context.contextType}:${context.id}`}
                    >
                      {contextLabelMap[context.contextType]} · {context.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                عنوان
                <input
                  className={`${field} mt-1`}
                  required
                  minLength={2}
                  maxLength={160}
                  value={title}
                  disabled={busy}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="text-xs font-bold">
                محل گردهمایی
                <input
                  className={`${field} mt-1`}
                  required
                  minLength={2}
                  maxLength={160}
                  value={place}
                  disabled={busy}
                  onChange={(event) => setPlace(event.target.value)}
                />
              </label>
              <label className="text-xs font-bold">
                مهلت تأیید (دقیقه)
                <input
                  type="number"
                  className={`${field} mt-1`}
                  required
                  min={1}
                  max={240}
                  value={minutes}
                  disabled={busy}
                  onChange={(event) => setMinutes(Number(event.target.value))}
                />
              </label>
              <button
                type="submit"
                disabled={busy || !target}
                className={`${action} bg-blue-600 text-white sm:col-span-2`}
              >
                {busy ? "در حال ایجاد…" : "فعال‌کردن فراخوان اکنون"}
              </button>
            </form>
          ) : null}
          <select
            aria-label="کلاس یا اتاق فراخوان‌ها"
            className={field}
            value={poolContextFilter}
            onChange={(event) => setPoolContextFilter(event.target.value)}
          >
            <option value="">همه کلاس‌ها و اتاق‌ها</option>
            {contexts.map((context) => (
              <option key={`${context.contextType}:${context.id}`} value={context.id}>
                {contextLabelMap[context.contextType]} · {context.name}
              </option>
            ))}
          </select>
          {pools.isLoading ? (
            <p role="status">در حال دریافت فراخوان‌ها…</p>
          ) : pools.isError ? (
            <p role="alert">
              فراخوان‌ها دریافت نشد.{" "}
              <button type="button" onClick={() => void pools.refetch()}>
                تلاش مجدد
              </button>
            </p>
          ) : (
            <ul className="space-y-3">
              {pools.data
                ?.filter((pool) => !poolContextFilter || pool.contextId === poolContextFilter)
                .map((pool) => (
                  <li
                    key={pool.id}
                    className="space-y-3 rounded-2xl border border-[rgb(var(--border-subtle))] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold">{pool.title}</h3>
                      <span
                        className={`text-xs font-bold ${pool.closed ? "text-slate-500" : "text-emerald-600"}`}
                      >
                        {pool.closed ? "بسته / پایان‌یافته" : "فعال"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600">
                      {contexts.find((context) => context.id === pool.contextId)?.name ||
                        "گروه ثبت‌شده"}
                    </p>
                    <p className="text-xs text-slate-500">
                      <MapPin className="me-1 inline" size={14} />
                      {pool.place} · پایان{" "}
                      {new Date(pool.endsAt).toLocaleTimeString("fa-IR", {
                        timeZone: "Asia/Tehran",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm">
                      <UsersRound className="me-1 inline" size={16} />
                      {pool.present} تأییدشده از {pool.expected} نفر · {pool.remaining} تأییدنشده
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(pool.sessionId)}
                        className={`${action} flex-1 border border-[rgb(var(--border-subtle))]`}
                      >
                        مشاهده اعضا و تأییدنشده‌ها
                      </button>
                      {!pool.closed && auth.can("attendance.manage") ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void close(pool.id)}
                          className={`${action} border border-rose-200 text-rose-700`}
                        >
                          پایان فراخوان
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
      {selectedId ? (
        <SavedSessionDialog id={selectedId} scope={scope} onClose={() => setSelectedId(null)} />
      ) : null}
    </Card>
  );
}
