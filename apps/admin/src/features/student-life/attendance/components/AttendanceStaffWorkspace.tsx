import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { attendanceRequestId } from "../model/attendance-request-id";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { CalendarCheck2, CircleUserRound, MapPin, UsersRound } from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { Card } from "../../../../shared/ui/ui";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { AttendanceSelect } from "./AttendanceSelect";
import { notify } from "../../../../shared/ui/notifications";
import { api } from "../../../../shared/api/api";
import type { AttendanceContextOption } from "../api/attendance.api";
import { contextLabelMap } from "../api/attendance.api";
import { listLegacyAcademicCycles } from "../../../academics/schedule/api/schedule.api";
import {
  closeAttendancePool,
  createAttendancePool,
  getAttendanceOverview,
  getAttendancePolicy,
  getAttendanceReportSummary,
  getAttendanceHistorySessions,
  getHistoricalAttendanceCandidates,
  importLegacyScheduleOccurrence,
  getAttendancePools,
  getAttendanceProfile,
  getSavedAttendanceSession,
  getAttendanceSessionHistory,
  updateAttendancePolicy,
  finalizeAttendanceSession,
  cancelAttendanceSession,
  correctAttendanceRecord,
} from "../api/attendance-operations.api";
import type { AttendancePoolDraft } from "@moshaver/api-contract";

const field =
  "min-h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card px-3 text-sm";
const action =
  "min-h-12 rounded-xl px-4 text-sm font-bold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500";
const labels = { ...contextLabelMap, pool: "حوضچه / فراخوان", night: "حضور شب" };
const statuses = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
  excused: "موجه",
  unmarked: "نامشخص",
};

function percent(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("fa-IR")}٪`;
}

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
    <ResponsiveDrawer
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={query.data?.name || "پرونده حضور طلبه"}
      description="خلاصه حضور بر پایه جلسات مجازِ همین کاربر نمایش داده می‌شود."
      desktopSide="left"
      className="md:w-[min(44rem,94vw)]"
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
        <div className="space-y-4" dir="rtl">
          <header
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-4"
            dir="ltr"
          >
            <span
              className="grid size-16 place-items-center rounded-full bg-brand/10 text-brand ring-4 ring-card"
              aria-label="تصویر پیش‌فرض دانش‌آموز"
            >
              <CircleUserRound size={38} aria-hidden="true" />
            </span>
            <div className="min-w-0 text-right" dir="rtl">
              <h3 className="truncate text-base font-black text-ink">{query.data.name}</h3>
              <p className="mt-1 truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                {query.data.classNames.length ? query.data.classNames.join(" · ") : "کلاس ثبت نشده"}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {query.data.schoolName}
              </p>
            </div>
          </header>

          <dl className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <dt className="flex items-center gap-1.5 text-xs font-bold">
                <AttendanceCoin className="size-4 object-contain" /> سکه‌ها
              </dt>
              <dd className="mt-2 text-2xl font-black">
                {query.data.points.toLocaleString("fa-IR")}
              </dd>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
              <dt className="text-xs font-bold">درصد حضور</dt>
              <dd className="mt-2 text-2xl font-black">{percent(query.data.attendanceRate)}</dd>
              <p className="mt-1 text-[11px]">
                از {query.data.totalSessions.toLocaleString("fa-IR")} ثبت حضور
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
              <dt className="text-xs font-bold">تکمیل ثبت همه جلسه‌ها</dt>
              <dd className="mt-2 text-2xl font-black">{percent(query.data.attendanceCoverage)}</dd>
              <p className="mt-1 text-[11px]">جلسه‌های دارای ثبت وضعیت</p>
            </div>
          </dl>
          {query.data.scopedToTeacherClasses ? (
            <p className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-100">
              این آمار فقط برای کلاس‌های واگذارشده به شما محاسبه شده است.
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(query.data.counts).map(([key, count]) => (
              <div key={key} className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-center">
                <dt className="text-xs">{statuses[key as keyof typeof statuses]}</dt>
                <dd className="mt-1 text-xl font-black">{count.toLocaleString("fa-IR")}</dd>
              </div>
            ))}
          </dl>
          {query.data.totalSessions ? (
            <section className="grid gap-3 sm:grid-cols-2" aria-label="تحلیل رفتار حضور دانش‌آموز">
              <article className="min-w-0 rounded-2xl border border-[rgb(var(--border-subtle))] p-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  تحلیل شاخص‌های حضور
                </h3>
                <div className="mt-2 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={[
                        { metric: "حضور", value: query.data.attendanceRate ?? 0 },
                        { metric: "تکمیل ثبت", value: query.data.attendanceCoverage ?? 0 },
                        {
                          metric: "بدون غیبت",
                          value: Math.round(
                            ((query.data.totalSessions - query.data.counts.absent) /
                              query.data.totalSessions) *
                              100,
                          ),
                        },
                        {
                          metric: "به‌موقع",
                          value: Math.round(
                            (query.data.counts.present / query.data.totalSessions) * 100,
                          ),
                        },
                      ]}
                      outerRadius="72%"
                    >
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 11 }} />
                      <Radar
                        dataKey="value"
                        name="درصد"
                        stroke="#0f766e"
                        fill="#14b8a6"
                        fillOpacity={0.28}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="min-w-0 rounded-2xl border border-[rgb(var(--border-subtle))] p-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  گیج حضور مؤثر
                </h3>
                <div className="mx-auto mt-2 h-48 w-full max-w-xs">
                  <svg
                    viewBox="0 0 240 150"
                    className="h-full w-full"
                    role="img"
                    aria-label={`درصد حضور: ${query.data.attendanceRate ?? 0}٪`}
                  >
                    <path
                      d="M 30 125 A 90 90 0 0 1 210 125"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="18"
                      strokeLinecap="round"
                      pathLength="100"
                    />
                    <path
                      d="M 30 125 A 90 90 0 0 1 210 125"
                      fill="none"
                      stroke={
                        (query.data.attendanceRate ?? 0) >= 85
                          ? "#0f766e"
                          : (query.data.attendanceRate ?? 0) >= 65
                            ? "#d97706"
                            : "#e11d48"
                      }
                      strokeWidth="18"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray={`${query.data.attendanceRate ?? 0} 100`}
                    />
                    <text
                      x="120"
                      y="105"
                      textAnchor="middle"
                      className="fill-slate-900 text-[28px] font-black dark:fill-slate-100"
                    >
                      {percent(query.data.attendanceRate)}
                    </text>
                    <text
                      x="120"
                      y="129"
                      textAnchor="middle"
                      className="fill-slate-600 text-[11px] dark:fill-slate-300"
                    >
                      حاضر یا با تأخیر
                    </text>
                  </svg>
                </div>
              </article>
            </section>
          ) : null}
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
    </ResponsiveDrawer>
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
  const auth = useAuth();
  const cache = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [correction, setCorrection] = useState<{
    id: string;
    revision: number;
    status: "present" | "absent" | "late";
  } | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correcting, setCorrecting] = useState(false);
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
  async function finalize() {
    if (!data || finalizing) return;
    setFinalizing(true);
    try {
      await finalizeAttendanceSession(data.id, {
        requestId: attendanceRequestId(),
        expectedRevision: data.revision,
      });
      await query.refetch();
      void cache.invalidateQueries({ queryKey: ["attendance-staff-sessions", scope] });
      void cache.invalidateQueries({ queryKey: ["attendance-overview", scope] });
      notify("جلسه نهایی شد؛ اصلاح بعدی فقط با مسیر مستند انجام می‌شود.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "نهایی‌سازی جلسه انجام نشد.", "error");
    } finally {
      setFinalizing(false);
    }
  }
  async function cancel() {
    if (!data || cancelling || cancellationReason.trim().length < 3) return;
    setCancelling(true);
    try {
      await cancelAttendanceSession(data.id, {
        requestId: attendanceRequestId(),
        expectedRevision: data.revision,
        reason: cancellationReason.trim(),
      });
      setCancellationOpen(false);
      setCancellationReason("");
      await query.refetch();
      void history.refetch();
      void cache.invalidateQueries({ queryKey: ["attendance-staff-sessions", scope] });
      void cache.invalidateQueries({ queryKey: ["attendance-overview", scope] });
      notify("جلسه لغو شد و هیچ حضور یا غیبتی برای آن ثبت نمی‌شود.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "لغو جلسه انجام نشد.", "error");
    } finally {
      setCancelling(false);
    }
  }
  async function correct() {
    if (!correction || !data || correcting || correctionReason.trim().length < 3) return;
    setCorrecting(true);
    try {
      const result = await correctAttendanceRecord(correction.id, {
        requestId: attendanceRequestId(),
        expectedRevision: correction.revision,
        status: correction.status,
        reason: correctionReason.trim(),
      });
      setCorrection(null);
      setCorrectionReason("");
      await query.refetch();
      void cache.invalidateQueries({ queryKey: ["attendance-staff-sessions", scope] });
      notify(
        result.pendingReview
          ? "درخواست اصلاح ثبت شد و تا تأیید ناظر، حضور تغییر نمی‌کند."
          : "اصلاح با دلیل و سابقه قابل پیگیری ثبت شد.",
        "success",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "اصلاح حضور انجام نشد.", "error");
    } finally {
      setCorrecting(false);
    }
  }
  return (
    <>
      <ResponsiveDrawer
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={data?.title || "جزئیات جلسه"}
        description="غایبان و افرادی که حضورشان تأیید نشده جدا از حاضران نمایش داده می‌شوند."
        desktopSide="left"
        className="md:w-[min(56rem,96vw)]"
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
            {data.academicYearName || data.termName || data.subjectName ? (
              <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
                {[data.academicYearName, data.termName, data.subjectName]
                  .filter((value): value is string => Boolean(value))
                  .join(" · ")}
              </p>
            ) : null}
            {data.status === "submitted" && auth.can("attendance.review") ? (
              <button
                type="button"
                className={`${action} w-full bg-blue-600 text-white`}
                disabled={finalizing}
                onClick={() => void finalize()}
              >
                {finalizing ? "در حال نهایی‌سازی…" : "نهایی‌سازی جلسه"}
              </button>
            ) : data.status === "finalized" ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                این جلسه نهایی و قفل عملیاتی است.
              </p>
            ) : null}
            {auth.can("attendance.review") &&
            (data.status === "scheduled" || data.status === "open" || data.status === "draft") ? (
              cancellationOpen ? (
                <div className="space-y-3 rounded-xl border border-rose-300 bg-rose-50 p-3 dark:bg-rose-950/20">
                  <p className="text-sm font-bold">لغو جلسه</p>
                  <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                    جلسه و دلیل لغو در تاریخچه باقی می‌ماند؛ بعد از لغو ثبت حضور ممکن نیست.
                  </p>
                  <textarea
                    aria-label="دلیل لغو جلسه"
                    className="min-h-20 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 text-sm"
                    maxLength={500}
                    value={cancellationReason}
                    disabled={cancelling}
                    onChange={(event) => setCancellationReason(event.target.value)}
                    placeholder="دلیل لغو (حداقل ۳ حرف)"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`${action} flex-1 border border-[rgb(var(--border-subtle))]`}
                      disabled={cancelling}
                      onClick={() => {
                        setCancellationOpen(false);
                        setCancellationReason("");
                      }}
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      className={`${action} flex-1 bg-rose-700 text-white`}
                      disabled={cancelling || cancellationReason.trim().length < 3}
                      onClick={() => void cancel()}
                    >
                      {cancelling ? "در حال لغو…" : "تأیید لغو جلسه"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${action} w-full border border-rose-300 text-rose-800 dark:text-rose-200`}
                  onClick={() => setCancellationOpen(true)}
                >
                  لغو جلسه
                </button>
              )
            ) : data.status === "cancelled" ? (
              <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
                این جلسه لغو شده است و در گزارش حضور محاسبه نمی‌شود.
              </p>
            ) : null}
            {correction ? (
              <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/20">
                <p className="text-sm font-bold">اصلاح ثبت حضور</p>
                <AdaptiveSelect
                  aria-label="وضعیت جدید حضور"
                  className={field}
                  value={correction.status}
                  disabled={correcting}
                  onChange={(event) =>
                    setCorrection((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.value as "present" | "absent" | "late",
                          }
                        : null,
                    )
                  }
                >
                  <option value="present">حاضر</option>
                  <option value="absent">غایب</option>
                  <option value="late">تأخیر</option>
                </AdaptiveSelect>
                <textarea
                  aria-label="دلیل اصلاح حضور"
                  className="min-h-20 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 text-sm"
                  maxLength={500}
                  value={correctionReason}
                  disabled={correcting}
                  onChange={(event) => setCorrectionReason(event.target.value)}
                  placeholder="دلیل اصلاح (حداقل ۳ حرف)"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`${action} flex-1 border border-[rgb(var(--border-subtle))]`}
                    disabled={correcting}
                    onClick={() => {
                      setCorrection(null);
                      setCorrectionReason("");
                    }}
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    className={`${action} flex-1 bg-amber-600 text-white`}
                    disabled={correcting || correctionReason.trim().length < 3}
                    onClick={() => void correct()}
                  >
                    {correcting ? "در حال ثبت…" : "ثبت اصلاح"}
                  </button>
                </div>
              </div>
            ) : null}
            <AttendanceSelect
              label="فیلتر اعضای جلسه"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "missing", label: "غایب یا حضور تأییدنشده" },
                { value: "all", label: "همه اعضا" },
                { value: "absent", label: "غایب" },
                { value: "unmarked", label: "حضور تأییدنشده" },
                { value: "present", label: "حاضر" },
                { value: "late", label: "تأخیر" },
              ]}
            />
            {!data.rosterComplete ? (
              <p
                role="status"
                className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
              >
                فهرست کامل این جلسه قدیمی ثبت نشده؛ تعداد افراد با وضعیت نامشخص قابل محاسبه نیست.
              </p>
            ) : null}
            <div
              className="overflow-x-auto rounded-xl border border-[rgb(var(--border-subtle))]"
              role="region"
              aria-label="اعضای جلسه"
              tabIndex={0}
            >
              <table className="min-w-[620px] w-full text-start text-sm">
                <thead className="bg-[rgb(var(--surface-muted))] text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-start font-bold">دانش‌آموز</th>
                    <th className="px-3 py-2 text-start font-bold">وضعیت</th>
                    <th className="px-3 py-2 text-end font-bold">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-subtle))]">
                  {visible.map((member) => {
                    const record = data.records.find((item) => item.studentId === member.id);
                    return (
                      <tr key={member.id}>
                        <td className="px-3 py-3 font-bold">{member.name}</td>
                        <td className="px-3 py-3 text-xs text-slate-500">
                          {member.status === "unmarked"
                            ? "حضور تأیید نشده"
                            : statuses[member.status]}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setProfileId(member.id)}
                              className={`${action} min-h-9 border border-[rgb(var(--border-subtle))] px-3 text-xs`}
                            >
                              پرونده حضور
                            </button>
                            {auth.can("attendance.correct") && record ? (
                              <button
                                type="button"
                                className={`${action} min-h-9 border border-amber-300 px-3 text-xs text-amber-800 dark:text-amber-200`}
                                onClick={() => {
                                  setCorrection({
                                    id: record.id,
                                    revision: record.revision,
                                    status:
                                      record.physicalStatus === "late" ||
                                      record.physicalStatus === "absent"
                                        ? record.physicalStatus
                                        : "present",
                                  });
                                  setCorrectionReason("");
                                }}
                              >
                                اصلاح
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
      </ResponsiveDrawer>
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
  const [category, setCategory] = useState<"class" | "class_group" | "dorm">("class");
  const [officeTab, setOfficeTab] = useState<"teacher" | "groups" | "history" | "reports">("teacher");
  const [contextFilter, setContextFilter] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [poolContextFilter, setPoolContextFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [policySaving, setPolicySaving] = useState(false);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
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
  const report = useQuery({
    queryKey: [
      "attendance-report-summary",
      scope,
      reportFrom,
      reportTo,
      academicYearId,
      termId,
    ],
    queryFn: () =>
      getAttendanceReportSummary({
        from: reportFrom,
        to: reportTo,
        academicYearId: academicYearId || undefined,
        termId: termId || undefined,
      }),
    enabled: section === "sessions" && auth.can("attendance.reports.read"),
    refetchInterval: 60000,
  });
  const policy = useQuery({
    queryKey: ["attendance-policy", scope],
    queryFn: getAttendancePolicy,
    enabled: section === "sessions" && auth.can("attendance.settings.manage"),
  });
  const organizationId = auth.context?.activeOrganization?.id;
  const academicCycles = useQuery({
    queryKey: ["legacy-academic-cycles", organizationId],
    queryFn: () => listLegacyAcademicCycles(organizationId!),
    enabled: section === "sessions" && Boolean(organizationId),
  });
  const history = useQuery({
    queryKey: [
      "attendance-session-history",
      scope,
      sessionsPage,
      category,
      contextFilter,
      academicYearId,
      termId,
    ],
    queryFn: () =>
      getAttendanceHistorySessions({
        page: sessionsPage,
        contextType: category,
        contextId: contextFilter || undefined,
        academicYearId: academicYearId || undefined,
        termId: termId || undefined,
      }),
    enabled: section === "sessions" && auth.can("attendance.read"),
  });
  const sessionItems = history.data?.items ?? [];
  const currentTerms = (academicCycles.data?.terms ?? []).filter(
    (term) => !academicYearId || term.academicYearId === academicYearId,
  );
  const selectOfficeTab = (tab: "teacher" | "groups" | "history" | "reports") => {
    setOfficeTab(tab);
    setCategory(tab === "groups" ? "class_group" : "class");
    setContextFilter("");
    setSessionsPage(1);
  };
  const canReconcileHistoricalAttendance = [
    "PRINCIPAL",
    "RELIGIOUS_EDUCATION_MANAGER",
    "ORGANIZATION_ADMIN",
    "PLATFORM_ADMIN",
  ].includes(auth.activeRole ?? "");
  const historicalCandidates = useQuery({
    queryKey: [
      "attendance-historical-candidates",
      organizationId,
      academicYearId,
      termId,
      contextFilter,
    ],
    queryFn: () =>
      getHistoricalAttendanceCandidates({
        organizationId: organizationId!,
        academicYearId,
        termId,
        classroomId: category === "class" ? contextFilter || undefined : undefined,
      }),
    enabled:
      reconciliationOpen &&
      canReconcileHistoricalAttendance &&
      Boolean(organizationId && academicYearId && termId),
  });
  const importHistoricalOccurrence = useMutation({
    mutationFn: importLegacyScheduleOccurrence,
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["attendance-session-history", scope] });
      void cache.invalidateQueries({ queryKey: ["attendance-historical-candidates"] });
      notify("جلسهٔ تاریخی با تأیید شما ایجاد شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ایجاد جلسهٔ تاریخی انجام نشد.", "error"),
  });
  const pools = useQuery({
    queryKey: ["attendance-pools", scope],
    queryFn: getAttendancePools,
    enabled: section === "pool",
    refetchInterval: 10000,
  });
  useEffect(() => {
    setSelectedId(null);
    setSessionsPage(1);
    setTarget("");
    setTitle("");
    setPlace("");
    pending.current = null;
    setReportFrom("");
    setReportTo("");
  }, [scope]);
  useEffect(() => {
    const events = api.openEvents((type) => {
      if (type === "attendance.updated") {
        void cache.invalidateQueries({ queryKey: ["attendance-overview", scope] });
        void cache.invalidateQueries({ queryKey: ["attendance-session-history", scope] });
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
      await history.refetch();
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
  async function savePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!policy.data || policySaving) return;
    const form = new FormData(event.currentTarget);
    setPolicySaving(true);
    try {
      await updateAttendancePolicy({
        ...policy.data,
        dayStartsAt: String(form.get("dayStartsAt") ?? ""),
        allowPartialSubmission: form.get("allowPartialSubmission") === "on",
        lateCountsAsPresent: form.get("lateCountsAsPresent") === "on",
        correctionRequiresReview: form.get("correctionRequiresReview") === "on",
        principalReviewMode: String(form.get("principalReviewMode") ?? "absences_only") as
          "automatic" | "absences_only",
      });
      await policy.refetch();
      notify("قانون حضور و غیاب مدرسه ذخیره شد.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ذخیره قانون انجام نشد.", "error");
    } finally {
      setPolicySaving(false);
    }
  }
  return (
    <Card className="space-y-6 rounded-3xl border border-sky-100 p-4 sm:p-6 dark:border-slate-700">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgb(var(--border-subtle))] pb-4">
        <div>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300">عملیات حضور و غیاب</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-black text-ink">
            <CalendarCheck2 className="text-blue-600" size={22} />
            {section === "pool" ? "حوضچه / فراخوان حضور" : "جلسات حضور"}
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
            خلاصه روزانه ساعت ۱۶ به وقت تهران از نو آغاز می‌شود. همه جلسات و پرونده‌ها در سوابق باقی
            می‌مانند.
          </p>
        </div>
        {section === "sessions" && onNewSession && auth.can("attendance.manage") ? (
          <button
            type="button"
            onClick={onNewSession}
            className={`${action} bg-blue-600 text-white`}
          >
            ثبت جلسه تازه اکنون
          </button>
        ) : null}
      </header>
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
            [
              "جلسه",
              overview.data.sessions,
              "border-blue-200 bg-blue-50/60 text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200",
            ],
            [
              "حاضر",
              overview.data.present,
              "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200",
            ],
            [
              "غایب",
              overview.data.absent,
              "border-rose-200 bg-rose-50/60 text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200",
            ],
            [
              "تأخیر",
              overview.data.late,
              "border-amber-200 bg-amber-50/60 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200",
            ],
            [
              "نامشخص",
              overview.data.unmarked,
              "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
            ],
          ].map(([label, count, tone]) => (
            <div key={label} className={`rounded-2xl border p-3 text-center ${tone}`}>
              <dt className="text-xs font-semibold opacity-75">{label}</dt>
              <dd className="mt-1 text-xl font-black">{Number(count).toLocaleString("fa-IR")}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {auth.can("attendance.reports.read") ? (
        report.isLoading ? (
          <p role="status" className="text-xs text-slate-500">
            در حال محاسبه گزارش نهایی…
          </p>
        ) : report.isError ? (
          <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
            گزارش نهایی دریافت نشد.{" "}
            <button
              type="button"
              onClick={() => void report.refetch()}
              className="font-bold underline"
            >
              تلاش دوباره
            </button>
          </p>
        ) : report.data ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black">گزارش جلسات نهایی‌شده</p>
              {reportFrom || reportTo ? (
                <button
                  type="button"
                  className="min-h-9 rounded-lg px-2 text-xs font-bold text-emerald-800 underline dark:text-emerald-200"
                  onClick={() => {
                    setReportFrom("");
                    setReportTo("");
                  }}
                >
                  حذف بازهٔ تاریخ
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-bold">
                از تاریخ
                <DatePicker
                  ariaLabel="از تاریخ گزارش حضور"
                  value={reportFrom}
                  max={reportTo}
                  onChange={setReportFrom}
                  clearable
                />
              </label>
              <label className="text-xs font-bold">
                تا تاریخ
                <DatePicker
                  ariaLabel="تا تاریخ گزارش حضور"
                  value={reportTo}
                  min={reportFrom}
                  onChange={setReportTo}
                  clearable
                />
              </label>
            </div>
            <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
              {report.data.finalizedSessions.toLocaleString("fa-IR")} جلسه ·{" "}
              {report.data.denominator.toLocaleString("fa-IR")} ثبت قطعی · نرخ حضور{" "}
              {report.data.attendanceRate === null
                ? "نامشخص"
                : `${report.data.attendanceRate.toLocaleString("fa-IR")}٪`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              جلسات لغوشده و وضعیت‌های نامشخص در این نرخ محاسبه نمی‌شوند.
            </p>
          </div>
        ) : null
      ) : null}
      {auth.can("attendance.settings.manage") ? (
        policy.isLoading ? (
          <p role="status" className="text-xs text-slate-500">
            در حال دریافت قوانین حضور…
          </p>
        ) : policy.isError ? (
          <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
            قوانین حضور دریافت نشد.{" "}
            <button
              type="button"
              onClick={() => void policy.refetch()}
              className="font-bold underline"
            >
              تلاش دوباره
            </button>
          </p>
        ) : policy.data ? (
          <form
            onSubmit={(event) => void savePolicy(event)}
            className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <p className="text-sm font-black">قوانین حضور و غیاب</p>
              <p className="mt-1 text-xs text-slate-500">
                این تنظیمات در backend روی ثبت‌های بعدی اعمال می‌شوند.
              </p>
            </div>
            <label className="text-xs font-bold">
              شروع روز آموزشی
              <input
                name="dayStartsAt"
                type="time"
                className={`${field} mt-1`}
                defaultValue={policy.data.dayStartsAt}
                disabled={policySaving}
                required
              />
            </label>
            <div className="grid content-center gap-2 text-xs font-bold">
              <label className="flex items-center gap-2">
                <input
                  name="allowPartialSubmission"
                  type="checkbox"
                  defaultChecked={policy.data.allowPartialSubmission}
                  disabled={policySaving}
                />
                اجازه ثبت ناقص
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="lateCountsAsPresent"
                  type="checkbox"
                  defaultChecked={policy.data.lateCountsAsPresent}
                  disabled={policySaving}
                />
                تأخیر در نرخ حضور محسوب شود
              </label>
              <label className="flex items-center gap-2">
                <input
                  name="correctionRequiresReview"
                  type="checkbox"
                  defaultChecked={policy.data.correctionRequiresReview}
                  disabled={policySaving}
                />
                اصلاح حضور نیازمند تأیید ناظر باشد
              </label>
              <label className="grid gap-1">
                بازبینی روزانهٔ مدیر
                <select
                  name="principalReviewMode"
                  className={field}
                  defaultValue={policy.data.principalReviewMode}
                  disabled={policySaving}
                >
                  <option value="automatic">تکمیل خودکار همهٔ جلسه‌ها</option>
                  <option value="absences_only">فقط جلسه‌های دارای غیبت برای بررسی بیاید</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              className={`${action} bg-slate-900 text-white sm:col-span-2`}
              disabled={policySaving}
            >
              {policySaving ? "در حال ذخیره…" : "ذخیره قوانین حضور"}
            </button>
          </form>
        ) : null
      ) : null}
      {canReconcileHistoricalAttendance ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">تطبیق حضورهای گذشته</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                فقط رخدادهای برنامهٔ legacy که هنوز جلسهٔ حضور ندارند پیشنهاد می‌شوند؛ هیچ موردی بدون تأیید شما ثبت نمی‌شود.
              </p>
            </div>
            <button
              type="button"
              className={`${action} border border-amber-300 bg-white text-amber-900 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-200`}
              disabled={!academicYearId || !termId}
              onClick={() => setReconciliationOpen((open) => !open)}
            >
              {reconciliationOpen ? "بستن صف تطبیق" : "نمایش صف تطبیق"}
            </button>
          </div>
          {reconciliationOpen && !academicYearId ? (
            <p role="alert" className="mt-3 text-xs text-amber-800 dark:text-amber-200">
              ابتدا سال و نیم‌سال را در فیلتر آرشیو انتخاب کنید.
            </p>
          ) : null}
          {reconciliationOpen && academicYearId && termId ? (
            historicalCandidates.isLoading ? (
              <p role="status" className="mt-3 text-xs text-slate-500">در حال پیدا کردن رخدادهای بدون حضور…</p>
            ) : historicalCandidates.isError ? (
              <p role="alert" className="mt-3 text-xs text-rose-700 dark:text-rose-300">
                صف تطبیق دریافت نشد. <button type="button" className="font-bold underline" onClick={() => void historicalCandidates.refetch()}>تلاش دوباره</button>
              </p>
            ) : (
              <ul className="mt-3 grid gap-2" aria-label="رخدادهای پیشنهادی حضور گذشته">
                {(historicalCandidates.data ?? []).slice(0, 20).map((candidate) => (
                  <li key={`${candidate.entryId}:${candidate.date}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-white/80 p-3 text-xs dark:border-amber-900 dark:bg-slate-950/70">
                    <span>
                      <strong className="text-sm">{candidate.title}</strong>
                      <span className="mt-1 block text-slate-500">{candidate.classroomName} · {candidate.teacherName} · {candidate.subjectName || "بدون کتاب"} · {new Date(`${candidate.date}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian")} · {candidate.startTime} تا {candidate.endTime}</span>
                    </span>
                    <button
                      type="button"
                      className={`${action} min-h-10 border border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100`}
                      disabled={importHistoricalOccurrence.isPending}
                      onClick={() => importHistoricalOccurrence.mutate({ entryId: candidate.entryId, date: candidate.date })}
                    >
                      ایجاد جلسه
                    </button>
                  </li>
                ))}
                {!historicalCandidates.data?.length ? <li className="rounded-xl bg-white/70 p-3 text-xs text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">رخداد بدون جلسه‌ای در این بازه پیدا نشد.</li> : null}
              </ul>
            )
          ) : null}
        </section>
      ) : null}
      {section === "sessions" ? (
        <section
          className="space-y-4 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/40 p-3 sm:p-4"
          aria-labelledby="attendance-session-archive"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 id="attendance-session-archive" className="text-base font-black text-ink">
                آرشیو جلسات
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                یک جلسه را برای مرور اعضا، نهایی‌سازی یا اصلاح ثبت‌ها انتخاب کنید.
              </p>
            </div>
            {history.data ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-[rgb(var(--border-subtle))] dark:bg-slate-950 dark:text-slate-300">
                {history.data.total.toLocaleString("fa-IR")} جلسه
              </span>
            ) : null}
          </div>
          <nav
            className="grid grid-cols-2 gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-1 sm:flex"
            aria-label="تب‌های دفتر حضور کلاس"
            role="tablist"
          >
            {[
              ["teacher", "جلسات استاد"],
              ["groups", "حضور گروه‌ها"],
              ["history", "تاریخچه"],
              ["reports", "گزارش‌ها"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={officeTab === tab}
                className={`min-h-10 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  officeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-[rgb(var(--surface-muted))] dark:text-slate-300"
                }`}
                onClick={() => selectOfficeTab(tab as typeof officeTab)}
              >
                {label}
              </button>
            ))}
          </nav>
          {history.isLoading ? (
            <p role="status" className="text-xs text-slate-500">
              در حال دریافت سابقه جامع جلسات…
            </p>
          ) : history.isError ? (
            <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
              سابقه جامع جلسات دریافت نشد.{" "}
              <button
                type="button"
                onClick={() => void history.refetch()}
                className="font-bold underline"
              >
                تلاش دوباره
              </button>
            </p>
          ) : history.data ? (
            <p className="rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
              سابقه جامع: {history.data.total.toLocaleString("fa-IR")} جلسه ثبت‌شده در محدودهٔ
              دسترسی شما
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              نوع زمینه
              <AdaptiveSelect
                aria-label="نوع جلسات حضور"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as typeof category);
                  setContextFilter("");
                  setSessionsPage(1);
                }}
                className={field}
              >
                {Object.entries(labels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </AdaptiveSelect>
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              کلاس یا اتاق
              <AdaptiveSelect
                aria-label="کلاس یا اتاق جلسات"
                className={field}
                value={contextFilter}
                onChange={(event) => setContextFilter(event.target.value)}
              >
                <option value="">همه کلاس‌ها و اتاق‌ها</option>
                {Array.from(
                  new Map(
                    contexts
                      .filter((context) => context.contextType === category)
                      .map((context) => [context.id, context.name]),
                  ).entries(),
                ).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </AdaptiveSelect>
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              سال تحصیلی
              <AdaptiveSelect
                aria-label="سال تحصیلی جلسات"
                className={field}
                value={academicYearId}
                onChange={(event) => {
                  setAcademicYearId(event.target.value);
                  setTermId("");
                  setSessionsPage(1);
                }}
              >
                <option value="">همه سال‌ها</option>
                {(academicCycles.data?.years ?? []).map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </AdaptiveSelect>
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              نیم‌سال
              <AdaptiveSelect
                aria-label="نیم‌سال جلسات"
                className={field}
                value={termId}
                onChange={(event) => {
                  setTermId(event.target.value);
                  setSessionsPage(1);
                }}
              >
                <option value="">همه نیم‌سال‌ها</option>
                {currentTerms.map((term) => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </AdaptiveSelect>
            </label>
          </div>
          {officeTab === "reports" && report.data ? (
            <div
              role="tabpanel"
              className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/20"
            >
              <strong>گزارش نیم‌سالِ انتخاب‌شده</strong>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {report.data.finalizedSessions.toLocaleString("fa-IR")} جلسهٔ نهایی · {report.data.present.toLocaleString("fa-IR")} حاضر · {report.data.absent.toLocaleString("fa-IR")} غایب · {report.data.late.toLocaleString("fa-IR")} تأخیر · {report.data.excused.toLocaleString("fa-IR")} موجه
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                نرخ حضور: {report.data.attendanceRate === null ? "نامشخص" : `${report.data.attendanceRate.toLocaleString("fa-IR")}٪`}
              </p>
            </div>
          ) : null}
          {officeTab !== "reports" && history.isLoading ? (
            <p role="status">در حال دریافت جلسات…</p>
          ) : officeTab !== "reports" && history.isError ? (
            <p role="alert">
              جلسات دریافت نشد.{" "}
              <button type="button" onClick={() => void history.refetch()}>
                تلاش مجدد
              </button>
            </p>
          ) : officeTab !== "reports" ? (
            <div
              className="overflow-x-auto rounded-2xl border border-[rgb(var(--border-subtle))]"
              role="region"
              aria-label="فهرست جلسات حضور"
              tabIndex={0}
            >
              <table className="min-w-[980px] w-full text-start text-sm">
                <thead className="bg-[rgb(var(--surface-muted))] text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-3 text-start font-bold">جلسه</th>
                    <th className="px-3 py-3 text-start font-bold">زمینه</th>
                    <th className="px-3 py-3 text-start font-bold">استاد / کتاب</th>
                    <th className="px-3 py-3 text-start font-bold">سال و نیم‌سال</th>
                    <th className="px-3 py-3 text-start font-bold">زمان</th>
                    <th className="px-3 py-3 text-center font-bold">وضعیت</th>
                    <th className="px-3 py-3 text-center font-bold">حاضر</th>
                    <th className="px-3 py-3 text-center font-bold">غایب</th>
                    <th className="px-3 py-3 text-center font-bold">نامشخص</th>
                    <th className="px-3 py-3 text-end font-bold">جزئیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-subtle))]">
                  {sessionItems
                    .map((session) => (
                      <tr key={session.id} className="hover:bg-[rgb(var(--surface-muted))]">
                        <td className="px-3 py-3 font-bold">
                          <button
                            type="button"
                            className="text-start hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-300"
                            onClick={() => setSelectedId(session.id)}
                          >
                            {session.title}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">
                          {labels[session.contextType]}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">
                          <div>{session.teacherName || "استاد ثبت نشده"}</div>
                          <div className="mt-0.5 text-slate-400">{session.subjectName || "کتاب ثبت نشده"}</div>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">
                          <div>{session.academicYearName || "بدون سال"}</div>
                          <div className="mt-0.5 text-slate-400">{session.termName || "بدون نیم‌سال"}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(session.sessionDate).toLocaleString("fa-IR", {
                            timeZone: "Asia/Tehran",
                          })}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-500">
                          <div>{session.status}</div>
                          <div className="mt-0.5 text-slate-400">ویرایش {session.revision.toLocaleString("fa-IR")}</div>
                        </td>
                        <td className="px-3 py-3 text-center">{session.present}</td>
                        <td className="px-3 py-3 text-center">{session.absent}</td>
                        <td className="px-3 py-3 text-center">{session.unmarked ?? "—"}</td>
                        <td className="px-3 py-3 text-end">
                          <button
                            type="button"
                            className={`${action} min-h-9 border border-[rgb(var(--border-subtle))] px-3 text-xs`}
                            onClick={() => setSelectedId(session.id)}
                          >
                            مشاهده
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {officeTab !== "reports" && history.data && !sessionItems.length ? (
            <p className="py-4 text-center text-sm text-slate-500">
              جلسه‌ای در این بخش ثبت نشده است.
            </p>
          ) : null}
          {officeTab !== "reports" && history.data && history.data.total > 0 ? (
            <nav
              aria-label="صفحه‌بندی سوابق حضور"
              className="flex items-center justify-between gap-2"
            >
              <button
                type="button"
                className={`${action} border border-[rgb(var(--border-subtle))]`}
                disabled={history.isFetching || history.data.page <= 1}
                onClick={() => setSessionsPage((page) => Math.max(1, page - 1))}
              >
                جدیدتر
              </button>
              <span className="text-xs text-slate-500">
                صفحه {history.data.page.toLocaleString("fa-IR")} از{" "}
                {Math.max(1, Math.ceil(history.data.total / history.data.limit)).toLocaleString(
                  "fa-IR",
                )}
              </span>
              <button
                type="button"
                className={`${action} border border-[rgb(var(--border-subtle))]`}
                disabled={history.isFetching || !history.data.hasNext}
                onClick={() => setSessionsPage((page) => page + 1)}
              >
                قدیمی‌تر
              </button>
            </nav>
          ) : null}
        </section>
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
                <AdaptiveSelect
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
                </AdaptiveSelect>
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
          <AdaptiveSelect
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
          </AdaptiveSelect>
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
