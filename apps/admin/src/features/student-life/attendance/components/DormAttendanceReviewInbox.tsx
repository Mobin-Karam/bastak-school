import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  Check,
  Clock3,
  LoaderCircle,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { Card, Textarea } from "../../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { notify } from "../../../../shared/ui/notifications";
import {
  finalizeDormAttendanceReview,
  forwardDormAttendanceReview,
  getDormAttendanceReviewQueue,
  getOutsidePresenceReports,
  markDormStudentUnauthorizedOutside,
  reopenDormAttendanceReview,
  verifyOutsidePresenceReport,
  type DormAttendanceReviewItem,
} from "../api/attendance-operations.api";

const statusLabel: Record<string, string> = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
  excused: "موجه",
};
const statusStyle: Record<string, string> = {
  absent:
    "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
  late: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  excused:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
};

/** Shared supervisor review and principal final-approval inbox for completed room roll calls. */
export function DormAttendanceReviewInbox({
  compact = false,
  requestedSessionId,
}: {
  compact?: boolean;
  requestedSessionId?: string;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [searchParams] = useSearchParams();
  const isPrincipal = auth.activeRole === "PRINCIPAL";
  const isSupervisor = auth.activeRole === "SCHOOL_SUPERVISOR";
  const enabled = auth.can("attendance.review") && (isPrincipal || isSupervisor);
  const scope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const queue = useQuery({
    queryKey: ["dorm-attendance-review-queue", scope],
    queryFn: getDormAttendanceReviewQueue,
    enabled,
    refetchInterval: enabled ? 30000 : false,
  });
  const outsideReports = useQuery({
    queryKey: ["attendance", "outside-presence-reports", scope],
    queryFn: getOutsidePresenceReports,
    enabled: enabled && isPrincipal,
    refetchInterval: enabled && isPrincipal ? 30000 : false,
  });
  const [selected, setSelected] = useState<DormAttendanceReviewItem | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reopenConfirm, setReopenConfirm] = useState(false);
  const [verifyingOutsideId, setVerifyingOutsideId] = useState<string | null>(null);
  const targetSessionId = requestedSessionId ?? searchParams.get("sessionId") ?? undefined;
  useEffect(() => {
    if (!targetSessionId || !queue.data) return;
    const target = queue.data.find((item) => item.id === targetSessionId);
    if (target) {
      setSelected(target);
      setNote(target.supervisorNote);
    }
  }, [queue.data, targetSessionId]);
  if (!enabled) return null;
  const refresh = () =>
    void Promise.all([
      cache.invalidateQueries({ queryKey: ["dorm-attendance-review-queue", scope] }),
      cache.invalidateQueries({ queryKey: ["attendance", "outside-presence-reports", scope] }),
      cache.invalidateQueries({ queryKey: ["attendance", "participants"] }),
      cache.invalidateQueries({ queryKey: ["principal-dashboard"] }),
    ]);
  async function forward() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await forwardDormAttendanceReview(selected.id, note);
      notify("گزارش اتاق برای تأیید نهایی به مدیر ارسال شد.", "success");
      setSelected(null);
      setNote("");
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "ارسال برای مدیر انجام نشد.", "error");
    } finally {
      setBusy(false);
    }
  }
  async function finalize() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await finalizeDormAttendanceReview(selected.id);
      notify("حضور اتاق تأیید و به بایگانی منتقل شد.", "success");
      setSelected(null);
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "تأیید نهایی انجام نشد.", "error");
    } finally {
      setBusy(false);
    }
  }
  async function reopen(action: "delegate" | "supervisor") {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const result = await reopenDormAttendanceReview(
        selected.id,
        action,
        note.trim() || "ثبت حضور برای ثبت مجدد به ناظر بازگردانده شد.",
      );
      notify(
        action === "delegate"
          ? "ثبت قبلی پاک‌سازی شد و مسئول اتاق برای ثبت دوباره مطلع شد."
          : "ثبت قبلی پاک‌سازی شد؛ جلسه برای ثبت شما باز است.",
        "success",
      );
      setSelected(null);
      setReopenConfirm(false);
      setNote("");
      refresh();
      if (action === "supervisor") navigate(result.reviewUrl);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "بازگرداندن حضور برای ثبت مجدد انجام نشد.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Card
        className={`space-y-3 rounded-2xl p-4 sm:p-5 ${compact ? "border-0 p-0 shadow-none" : ""}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <Building2 size={20} />
            </span>
            <div>
              <h2 className="font-black">
                {isPrincipal ? "تأیید نهایی حضور خوابگاه" : "بازبینی حضور اتاق‌ها"}
              </h2>
              {!compact ? (
                <p className="text-xs text-slate-500">
                  {isPrincipal
                    ? "گزارش‌های بررسی‌شده توسط ناظر"
                    : "اتاق‌های ثبت‌شده و موارد نیازمند توجه"}
                </p>
              ) : null}
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
            {(queue.data?.length ?? 0).toLocaleString("fa-IR")}
          </span>
        </div>
        {queue.isLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={18} /> دریافت فهرست…
          </div>
        ) : null}
        {queue.isError ? (
          <div role="alert" className="text-sm text-rose-700">
            فهرست دریافت نشد.{" "}
            <button className="font-bold underline" onClick={() => void queue.refetch()}>
              تلاش دوباره
            </button>
          </div>
        ) : null}
        {!queue.isLoading && !queue.isError && !queue.data?.length ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            اتاقی در صف بازبینی نیست.
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {queue.data?.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelected(item);
                setNote(item.supervisorNote);
              }}
              className="min-h-24 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3 text-start transition hover:border-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="flex items-center justify-between gap-2">
                <strong className="truncate text-base font-black">اتاق {item.roomName}</strong>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-bold dark:bg-slate-900">
                  {item.attention.length.toLocaleString("fa-IR")} مورد
                </span>
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 size={14} />
                {item.attendancePeriod === "night" ? "شب · اصلی" : "روز"} ·{" "}
                {item.operationalDate ??
                  new Date(item.sessionDate).toLocaleDateString("fa-IR-u-ca-persian")}{" "}
                · {item.present}/{item.total} حاضر ·{" "}
                {item.attendanceRole === "primary" ? "ثبت اصلی" : "بررسی اتاق"}
              </span>
            </button>
          ))}
        </div>
        {isPrincipal ? (
          <section
            className="space-y-2 border-t border-[rgb(var(--border-subtle))] pt-3"
            aria-label="گزارش حضور دانش‌آموز خارج از مدرسه"
          >
            <h3 className="font-black">گزارش حضور در کلاس برای دانش‌آموزان خارج از مدرسه</h3>
            {outsideReports.isLoading ? (
              <p className="text-sm text-slate-500">دریافت گزارش‌ها…</p>
            ) : null}
            {outsideReports.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                گزارش‌ها دریافت نشد.{" "}
                <button className="underline" onClick={() => void outsideReports.refetch()}>
                  تلاش دوباره
                </button>
              </p>
            ) : null}
            {!outsideReports.isLoading &&
            !outsideReports.isError &&
            !outsideReports.data?.length ? (
              <p className="text-sm text-slate-500">گزارش حضور تأییدنشده‌ای وجود ندارد.</p>
            ) : null}
            {outsideReports.data?.map((report) => (
              <article
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"
              >
                <div>
                  <strong>{report.studentName}</strong>
                  <p className="mt-1 text-xs">
                    استاد می‌گوید دانش‌آموز در کلاس حاضر است. تأیید شما او را به آمار داخل مدرسه
                    برمی‌گرداند.
                  </p>
                  {report.note ? <p className="mt-1 text-xs">{report.note}</p> : null}
                </div>
                <button
                  type="button"
                  disabled={verifyingOutsideId === report.id}
                  onClick={async () => {
                    setVerifyingOutsideId(report.id);
                    try {
                      await verifyOutsidePresenceReport(report.id);
                      notify("بازگشت دانش‌آموز تأیید شد و آمار داخل مدرسه به‌روز شد.", "success");
                      refresh();
                    } catch (error) {
                      notify(
                        error instanceof Error ? error.message : "تأیید بازگشت انجام نشد.",
                        "error",
                      );
                    } finally {
                      setVerifyingOutsideId(null);
                    }
                  }}
                  className="min-h-10 rounded-lg bg-rose-800 px-3 text-xs font-black text-white disabled:opacity-50"
                >
                  تأیید حضور و بازگشت
                </button>
              </article>
            ))}
          </section>
        ) : null}
      </Card>
      {selected ? (
        <ResponsiveDrawer
          open
          title={`بازبینی اتاق ${selected.roomName}`}
          description={
            isPrincipal
              ? "گزارش ناظر را بررسی و بایگانی کنید."
              : "وضعیت و نام افراد را بررسی کنید؛ در صورت نیاز ابتدا حضور را اصلاح کنید."
          }
          desktopSide="left"
          onOpenChange={(open) => {
            if (!open && !busy) setSelected(null);
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
                <p className="text-xs text-slate-500">کل ساکن</p>
                <b className="text-lg">{selected.total}</b>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <p className="text-xs">حاضر</p>
                <b className="text-lg">{selected.present}</b>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="text-xs">نیازمند بررسی</p>
                <b className="text-lg">{selected.attention.length}</b>
              </div>
            </div>
            <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3 text-sm">
              <p className="font-black">تطبیق ثبت‌ها</p>
              <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                مسئول ثبت: {selected.delegateStudentName ?? "ثبت دستی ناظر"} · ثبت‌شده{" "}
                {selected.recorded} از {selected.total} نفر
              </p>
              <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                ساکنان خوابگاه: {selected.schoolPresence.dormResidents} نفر · مدرسه:{" "}
                {selected.schoolPresence.totalStudents} نفر · داخل{" "}
                {selected.schoolPresence.currentlyInSchool} · خارج{" "}
                {selected.schoolPresence.currentlyOutside} (مجوزدار{" "}
                {selected.schoolPresence.authorizedOutside}، غیرمجاز{" "}
                {selected.schoolPresence.unauthorizedOutside})
              </p>
              <p
                className={`mt-1 text-xs font-bold ${selected.comparison.state === "mismatch" ? "text-rose-700 dark:text-rose-300" : selected.comparison.state === "matched" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}
              >
                {selected.comparison.state === "waiting"
                  ? "ثبت مسئول اتاق هنوز برای مقایسه نرسیده است."
                  : selected.comparison.state === "matched"
                    ? "ثبت مسئول اتاق با ثبت اصلی یکسان است."
                    : `${selected.comparison.mismatchCount} اختلاف با ثبت ${selected.attendanceRole === "primary" ? "مسئول اتاق" : "اصلی"}`}
              </p>
              {selected.comparison.differences.length ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {selected.comparison.differences.map((difference) => (
                    <li
                      key={difference.studentId}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    >
                      {difference.name}: اصلی{" "}
                      {statusLabel[difference.primaryStatus ?? ""] ??
                        difference.primaryStatus ??
                        "ثبت‌نشده"}{" "}
                      · اتاق{" "}
                      {statusLabel[difference.roomCheckStatus ?? ""] ??
                        difference.roomCheckStatus ??
                        "ثبت‌نشده"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {selected.attention.length ? (
              <div className="space-y-2">
                {selected.attention.map((person) => (
                  <div
                    key={person.studentId}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${statusStyle[person.status]}`}
                  >
                    <span className="font-black">{person.name}</span>
                    <span className="shrink-0 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-black dark:bg-black/20">
                      {person.authorizedOutside ? "خارج با مجوز" : statusLabel[person.status]}
                      {person.illegalDeparture ? " · خروج غیرمجاز" : ""}
                    </span>
                    {(isPrincipal || isSupervisor) &&
                    selected.attendanceRole === "primary" &&
                    person.status === "absent" &&
                    !person.authorizedOutside ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `خروج ${person.name} بدون مجوز را ثبت می‌کنید؟ این اقدام آمار افراد داخل مدرسه را به‌روز می‌کند.`,
                            )
                          )
                            return;
                          setBusy(true);
                          try {
                            const result = await markDormStudentUnauthorizedOutside(
                              selected.id,
                              person.studentId,
                            );
                            setSelected({
                              ...selected,
                              schoolPresence: {
                                totalStudents: result.totalStudents,
                                dormResidents: result.dormResidents,
                                currentlyInSchool: result.currentlyInSchool,
                                currentlyOutside: result.currentlyOutside,
                                authorizedOutside: result.authorizedOutside,
                                unauthorizedOutside: result.unauthorizedOutside,
                              },
                              attention: selected.attention.map((entry) =>
                                entry.studentId === person.studentId
                                  ? {
                                      ...entry,
                                      authorizedOutside: false,
                                      illegalDeparture: true,
                                      exitPermissionId: result.exitPermissionId,
                                    }
                                  : entry,
                              ),
                            });
                            refresh();
                            notify("خروج بدون مجوز ثبت شد و آمار حضور مدرسه به‌روز شد.", "success");
                          } catch (error) {
                            notify(
                              error instanceof Error ? error.message : "ثبت خروج انجام نشد.",
                              "error",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className="min-h-10 rounded-lg border border-rose-400 bg-white px-2 text-xs font-black text-rose-800 dark:bg-slate-950 dark:text-rose-200"
                      >
                        ثبت خروج غیرمجاز
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                همه ساکنان حاضر ثبت شده‌اند.
              </p>
            )}
            {!isPrincipal ? (
              <label className="block space-y-1.5 text-sm font-bold">
                یادداشت ناظر (اختیاری)
                <Textarea
                  value={note}
                  maxLength={1000}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="توضیح کوتاه برای مدیر…"
                />
              </label>
            ) : null}
            {!isPrincipal && selected.attendanceRole === "room_check" ? (
              <p className="rounded-xl bg-sky-50 p-3 text-sm font-bold text-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
                این مشاهدهٔ مستقل برای مقایسه است و به فهرست نهایی مدیر ارسال نمی‌شود؛ ثبت اصلی،
                مبنای بایگانی است.
              </p>
            ) : null}
            {reopenConfirm ? (
              <div className="space-y-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <p className="flex gap-2 text-sm font-bold text-rose-950 dark:text-rose-100">
                  <AlertTriangle className="shrink-0" size={18} />
                  ثبت‌های فعلی پاک می‌شوند؛ نتیجه قبلی در گزارش بازبینی حفظ می‌شود. مسئولیت این اتاق
                  دوباره ثبت می‌شود.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reopen("delegate")}
                    className="min-h-12 rounded-xl border border-rose-300 bg-white px-3 text-sm font-bold text-rose-900 disabled:opacity-50 dark:bg-slate-900 dark:text-rose-100"
                  >
                    ارجاع دوباره به مسئول اتاق
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reopen("supervisor")}
                    className="min-h-12 rounded-xl bg-rose-700 px-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    ثبت توسط خودم
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setReopenConfirm(false)}
                  className="min-h-10 w-full text-sm font-bold text-slate-600"
                >
                  انصراف
                </button>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {!isPrincipal && selected.delegateStudentId ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setSelected(null);
                      navigate(selected.reviewUrl);
                    }}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border-subtle))] px-4 font-bold disabled:opacity-50"
                  >
                    <PencilLine size={17} /> اصلاح حضور
                  </button>
                ) : null}
                {!isPrincipal ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReopenConfirm(true)}
                    className="min-h-12 rounded-xl border border-rose-300 px-4 font-bold text-rose-800 disabled:opacity-50 dark:text-rose-200"
                  >
                    رد و ثبت دوباره
                  </button>
                ) : null}
                {!isPrincipal && selected.attendanceRole === "room_check" ? null : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void (isPrincipal ? finalize() : forward())}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 font-bold text-white disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : isPrincipal ? (
                      <Check size={18} />
                    ) : (
                      <ShieldCheck size={18} />
                    )}{" "}
                    {isPrincipal ? "تأیید و بایگانی" : "ارسال برای تأیید مدیر"}
                  </button>
                )}
              </div>
            )}
          </div>
        </ResponsiveDrawer>
      ) : null}
    </>
  );
}
