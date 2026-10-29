import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BedDouble,
  CalendarCheck2,
  FileWarning,
  UsersRound,
  UserRoundCheck,
  Check,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "../../../identity/auth";
import { Button, LoadingState } from "../../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { Switch } from "../../../../shared/ui/switch";
import {
  getAttendancePolicy,
  updateAttendancePolicy,
  type AttendancePolicy,
} from "../../../student-life/attendance/api/attendance-operations.api";
import {
  getAttendanceSessionForReview,
  getReviewablePresentSessions,
  reviewAttendanceSession,
  type PrincipalDashboardContract,
} from "../api/principal-dashboard.api";
import {
  listAttendanceAbsenceReviews,
  markDormAbsenceOutsideSchool,
  reviewAttendanceAbsence,
  type AttendanceAbsenceReview,
} from "../../../student-life/attendance/api/attendance.api";
import {
  actOnTeacherStudentReport,
  getTeacherStudentReports,
  markTeacherStudentReportSeen,
  type TeacherStudentReport,
} from "../../reports/api/reports.api";

type Lists = NonNullable<PrincipalDashboardContract["principalLists"]>;
type SessionReview = NonNullable<PrincipalDashboardContract["sessionReviews"]>["items"][number];
type Panel = "dorm" | "sessions" | "reports" | "leave" | "groups";

const cards: Array<{
  id: Panel;
  title: string;
  description: string;
  icon: typeof BedDouble;
  capability: string;
}> = [
  {
    id: "dorm",
    title: "بازبینی حضور خوابگاه",
    description: "غیبت‌های خوابگاه را بررسی و در آرشیو ثبت کنید",
    icon: BedDouble,
    capability: "attendance.review",
  },
  {
    id: "sessions",
    title: "جلسه‌های کلاس",
    description: "حضور ثبت‌شدهٔ استادان را بررسی کنید",
    icon: CalendarCheck2,
    capability: "attendance.review",
  },
  {
    id: "reports",
    title: "گزارش‌های دانش‌آموزان",
    description: "گزارش محرمانهٔ استاد دربارهٔ دانش‌آموز",
    icon: FileWarning,
    capability: "attendance.review",
  },
  {
    id: "leave",
    title: "درخواست‌های مرخصی استادان",
    description: "درخواست‌های رسیده را یکجا ببینید",
    icon: UserRoundCheck,
    capability: "leave.read",
  },
  {
    id: "groups",
    title: "حضور گروه‌های کلاس",
    description: "جلسه‌ها و سوابق حضور گروهی",
    icon: UsersRound,
    capability: "attendance.review",
  },
];

export function PrincipalOperationalLists({
  lists,
  sessionReviews,
  canReviewAttendance,
}: {
  lists?: Lists;
  sessionReviews?: NonNullable<PrincipalDashboardContract["sessionReviews"]>;
  canReviewAttendance: boolean;
}) {
  const auth = useAuth();
  const [active, setActive] = useState<Panel | null>(null);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [autoArchiveProgress, setAutoArchiveProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [autoArchiveError, setAutoArchiveError] = useState(false);
  const autoArchiveCancelled = useRef(false);
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id;
  const dorm = useQuery({
    queryKey: ["attendance", "absence-reviews", "principal-home", organizationId],
    queryFn: () => listAttendanceAbsenceReviews(organizationId, "dorm"),
    enabled: canReviewAttendance,
  });
  const reports = useQuery({
    queryKey: ["principal", "teacher-reports"],
    queryFn: getTeacherStudentReports,
    enabled: canReviewAttendance,
  });
  const policy = useQuery({
    queryKey: ["attendance-policy", organizationId],
    queryFn: getAttendancePolicy,
    enabled: active === "sessions" && auth.can("attendance.settings.manage"),
  });
  const fullyPresentSessions = useQuery({
    queryKey: ["attendance", "reviewable-present-sessions", organizationId],
    queryFn: () => getReviewablePresentSessions(organizationId),
    enabled: active === "sessions" && canReviewAttendance,
  });
  const updatePolicy = useMutation({
    mutationFn: (next: AttendancePolicy) => updateAttendancePolicy(next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance-policy"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
    },
  });
  const reviewSession = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      reviewAttendanceSession(id, message),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
      void client.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
  const reviewDorm = useMutation({
    mutationFn: ({
      item,
      decision,
      note,
      outside,
    }: {
      item: AttendanceAbsenceReview;
      decision: "approved" | "rejected";
      note: string;
      outside: boolean;
    }) =>
      reviewAttendanceAbsence(item.id, { decision, note: note || undefined }).then(
        async (saved) => {
          if (decision === "approved" && outside)
            await markDormAbsenceOutsideSchool(saved.id, note || undefined);
          return saved;
        },
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance", "absence-reviews"] });
      void client.invalidateQueries({ queryKey: ["attendance"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
    },
  });
  const seenReport = useMutation({
    mutationFn: markTeacherStudentReportSeen,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["principal", "teacher-reports"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
    },
  });
  const reportAction = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "full_screen_summons" | "contact_request";
    }) => actOnTeacherStudentReport(id, action),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["principal", "teacher-reports"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
    },
  });
  const runAutoArchive = async (checked: boolean) => {
    if (!checked) {
      if (autoArchiveProgress) autoArchiveCancelled.current = true;
      else setAutoArchiveEnabled(false);
      return;
    }
    const candidates = fullyPresentSessions.data ?? [];
    if (!candidates.length) return;
    autoArchiveCancelled.current = false;
    setAutoArchiveError(false);
    setAutoArchiveEnabled(true);
    setAutoArchiveProgress({ completed: 0, total: candidates.length });
    let completed = 0;
    try {
      for (const session of candidates) {
        if (autoArchiveCancelled.current) break;
        await reviewAttendanceSession(session.id);
        completed += 1;
        setAutoArchiveProgress({ completed, total: candidates.length });
      }
    } catch {
      setAutoArchiveError(true);
    } finally {
      setAutoArchiveEnabled(false);
      setAutoArchiveProgress(null);
      void client.invalidateQueries({ queryKey: ["attendance", "reviewable-present-sessions"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
      void client.invalidateQueries({ queryKey: ["attendance"] });
    }
  };

  const sessions = sessionReviews?.items ?? [];
  const pendingDorm = useMemo(
    () =>
      (dorm.data ?? []).filter(
        (item) => item.contextType === "dorm" && item.reviewStatus === "pending",
      ),
    [dorm.data],
  );
  const values = lists ?? {
    teacherSessions: [],
    teacherReports: [],
    dormAttendance: [],
    classGroupAttendance: [],
    teacherLeaveRequests: [],
  };
  const counts: Record<Panel, number> = {
    dorm: values.counts?.dorm ?? pendingDorm.length,
    sessions: sessionReviews?.pendingCount ?? sessions.length,
    reports:
      values.counts?.reports ??
      reports.data?.filter((report) => !report.seenAt).length ??
      values.teacherReports.filter((report) => !report.seenAt).length,
    leave: values.counts?.leave ?? values.teacherLeaveRequests.length,
    groups: values.counts?.groups ?? values.classGroupAttendance.length,
  };
  const visibleCards = cards.filter(({ capability }) => auth.can(capability));

  return (
    <>
      <section className="principal-dashboard__home-cards" aria-label="فهرست‌های مدیریتی">
        {visibleCards.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="principal-dashboard__home-card"
            onClick={() => setActive(id)}
            aria-haspopup="dialog"
          >
            <span className="principal-dashboard__home-icon">
              <Icon aria-hidden="true" size={23} />
            </span>
            <span className="principal-dashboard__home-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            {counts[id] > 0 ? (
              <span className="principal-dashboard__home-count" aria-label={`${counts[id]} مورد`}>
                {counts[id].toLocaleString("fa-IR")}
              </span>
            ) : null}
          </button>
        ))}
      </section>

      <ResponsiveDrawer
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
        title={cards.find((item) => item.id === active)?.title ?? "فهرست مدیر"}
        description="موارد این بخش در همین پنل بررسی و در سوابق مربوط ذخیره می‌شوند."
        desktopSide="left"
        className="principal-dashboard__drawer"
      >
        <div className="grid gap-3" dir="rtl">
          {updatePolicy.isError ||
          reviewSession.isError ||
          reviewDorm.isError ||
          seenReport.isError ||
          reportAction.isError ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-100"
            >
              عملیات انجام نشد. اتصال و دسترسی را بررسی کنید و دوباره تلاش کنید.
            </p>
          ) : null}
          {autoArchiveError ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-100"
            >
              بایگانی خودکار کامل نشد. موارد انجام‌شده ذخیره شده‌اند؛ برای بقیه دوباره تلاش کنید.
            </p>
          ) : null}
          {active === "dorm" && (
            <>
              <p className="text-sm text-muted-foreground">
                پس از ثبت تصمیم، سابقهٔ اصلی حضور خوابگاه در آرشیو باقی می‌ماند.
              </p>
              {dorm.isLoading ? (
                <LoadingState label="دریافت موارد خوابگاه…" />
              ) : dorm.isError ? (
                <ErrorText onRetry={() => void dorm.refetch()} />
              ) : pendingDorm.length ? (
                pendingDorm.map((item) => (
                  <DormReviewRow
                    key={item.id}
                    item={item}
                    onReview={(decision, note, outside) =>
                      reviewDorm.mutate({ item, decision, note, outside })
                    }
                    busy={reviewDorm.isPending}
                  />
                ))
              ) : (
                <Empty text="غیبت خوابگاهی برای بررسی باقی نمانده است." />
              )}
            </>
          )}
          {active === "sessions" && (
            <>
              {auth.can("attendance.settings.manage") && policy.data && (
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-[rgb(var(--border-subtle))] p-4">
                  <span>
                    <strong className="block">نمایش همهٔ جلسه‌ها</strong>
                    <small className="text-muted-foreground">خاموش: فقط جلسه‌های دارای غیبت</small>
                  </span>
                  <Switch
                    checked={policy.data.principalReviewMode === "all_sessions"}
                    disabled={updatePolicy.isPending}
                    onCheckedChange={(checked) =>
                      updatePolicy.mutate({
                        ...policy.data!,
                        principalReviewMode: checked ? "all_sessions" : "absences_only",
                      })
                    }
                    aria-label="نمایش همهٔ جلسه‌ها برای بازبینی"
                  />
                </label>
              )}
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[rgb(var(--border-subtle))] p-4">
                <span>
                  <strong className="block">بایگانی خودکارِ جلسه‌های کاملاً حاضر</strong>
                  <small className="text-muted-foreground">
                    فقط جلسه‌های کامل، بدون غیبت یا تأخیر، یک‌بار بایگانی می‌شوند.
                    {fullyPresentSessions.data?.length
                      ? ` ${fullyPresentSessions.data.length.toLocaleString("fa-IR")} جلسه آماده است.`
                      : " جلسهٔ آماده‌ای وجود ندارد."}
                  </small>
                </span>
                <Switch
                  checked={autoArchiveEnabled}
                  disabled={
                    fullyPresentSessions.isLoading ||
                    !fullyPresentSessions.data?.length ||
                    Boolean(autoArchiveProgress)
                  }
                  onCheckedChange={(checked) => void runAutoArchive(checked)}
                  aria-label="بایگانی خودکار جلسه‌های کاملاً حاضر"
                />
              </label>
              {policy.isLoading ? <LoadingState label="دریافت تنظیم بازبینی…" /> : null}
              {sessions.length ? (
                sessions.map((session) => (
                  <SessionReviewRow
                    key={session.id}
                    session={session}
                    onReview={(message) => reviewSession.mutate({ id: session.id, message })}
                    busy={reviewSession.isPending}
                  />
                ))
              ) : (
                <Empty text="جلسه‌ای برای بررسی باقی نمانده است." />
              )}
            </>
          )}
          {active === "reports" && (
            <>
              {reports.isLoading ? (
                <LoadingState label="دریافت گزارش‌ها…" />
              ) : reports.isError ? (
                <ErrorText onRetry={() => void reports.refetch()} />
              ) : (reports.data ?? []).length ? (
                reports.data!.map((report) => (
                  <ReportRow
                    key={report.id}
                    report={report}
                    onSeen={() => seenReport.mutate(report.id)}
                    onAction={(action) => reportAction.mutate({ id: report.id, action })}
                    busy={seenReport.isPending || reportAction.isPending}
                  />
                ))
              ) : (
                <Empty text="گزارشی برای نمایش وجود ندارد." />
              )}
            </>
          )}
          {active === "leave" &&
            (values.teacherLeaveRequests.length ? (
              values.teacherLeaveRequests.map((item) => (
                <article
                  key={`${item.type}:${item.id}`}
                  className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong>{item.teacherName}</strong>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      {item.type === "return" ? "درخواست بازگشت" : "درخواست مرخصی"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(item.startDate)} تا {formatDate(item.endDate)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">درخواست در صف بررسی است.</p>
                </article>
              ))
            ) : (
              <Empty text="درخواست مرخصی یا بازگشت استادی در صف نیست." />
            ))}
          {active === "groups" &&
            (values.classGroupAttendance.length ? (
              values.classGroupAttendance.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong>{item.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.sessionDate)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Count label="کل" value={item.total} />
                    <Count label="حاضر" value={item.present} />
                    <Count label="غایب" value={item.absent} />
                  </div>
                </article>
              ))
            ) : (
              <Empty text="حضور گروهی برای نمایش ثبت نشده است." />
            ))}
        </div>
      </ResponsiveDrawer>
      {autoArchiveProgress ? (
        <div
          className="principal-dashboard__auto-archive-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auto-archive-title"
        >
          <div className="principal-dashboard__auto-archive-dialog" dir="rtl">
            <p className="principal-dashboard__eyebrow">در حال بایگانی خودکار</p>
            <h2 id="auto-archive-title">جلسه‌های کاملاً حاضر در حال ثبت در آرشیو هستند</h2>
            <p>
              {autoArchiveProgress.completed.toLocaleString("fa-IR")} از{" "}
              {autoArchiveProgress.total.toLocaleString("fa-IR")} جلسه انجام شد.
            </p>
            <div
              className="principal-dashboard__auto-archive-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={autoArchiveProgress.total}
              aria-valuenow={autoArchiveProgress.completed}
            >
              <span
                style={{
                  width: `${(autoArchiveProgress.completed / autoArchiveProgress.total) * 100}%`,
                }}
              />
            </div>
            <Button variant="soft" onClick={() => void runAutoArchive(false)}>
              لغو پس از جلسهٔ در حال انجام
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SessionReviewRow({
  session,
  onReview,
  busy,
}: {
  session: SessionReview;
  onReview: (message: string) => void;
  busy: boolean;
}) {
  const detail = useQuery({
    queryKey: ["principal-attendance-review-detail", session.id],
    queryFn: () => getAttendanceSessionForReview(session.id),
    enabled: false,
  });
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const rosterNames = useMemo(
    () => new Map((detail.data?.roster ?? []).map((student) => [student.id, student.name])),
    [detail.data?.roster],
  );
  const absentRecords = useMemo(
    () => (detail.data?.records ?? []).filter((record) => record.physicalStatus === "absent"),
    [detail.data?.records],
  );
  const delayedRecords = useMemo(
    () => (detail.data?.records ?? []).filter((record) => record.physicalStatus === "late"),
    [detail.data?.records],
  );
  const reviewRecords = useMemo(
    () => [...absentRecords, ...delayedRecords],
    [absentRecords, delayedRecords],
  );
  const visibleRecords = useMemo(() => {
    const normalizedQuery = studentQuery.trim().toLocaleLowerCase("fa-IR");
    if (!normalizedQuery) return reviewRecords;
    return reviewRecords.filter((record) =>
      (rosterNames.get(record.studentId) ?? "")
        .toLocaleLowerCase("fa-IR")
        .includes(normalizedQuery),
    );
  }, [reviewRecords, rosterNames, studentQuery]);
  const absentCount = detail.data ? absentRecords.length : session.absent;
  const delayedCount = detail.data ? delayedRecords.length : session.late;
  const needsAbsenceMessage = absentCount > 0;
  return (
    <article className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4">
      <button
        type="button"
        className="w-full text-start"
        onClick={() => {
          setOpen((value) => !value);
          if (!detail.data) void detail.refetch();
        }}
        aria-expanded={open}
      >
        <span className="flex items-start justify-between gap-3">
          <strong>{session.title}</strong>
          <span className="flex flex-wrap justify-end gap-1.5">
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {absentCount.toLocaleString("fa-IR")} غایب
            </span>
            {delayedCount > 0 ? (
              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-950 dark:bg-sky-950 dark:text-sky-100">
                {delayedCount.toLocaleString("fa-IR")} تأخیر
              </span>
            ) : null}
          </span>
        </span>
        <small className="mt-1 block text-muted-foreground">
          {formatDate(session.sessionDate)} · فقط غیبت‌های نیازمند پیگیری
        </small>
      </button>
      {open && (
        <div className="mt-3 grid gap-3 border-t border-[rgb(var(--border-subtle))] pt-3">
          {detail.isLoading ? (
            <LoadingState label="دریافت فهرست دانش‌آموزان…" />
          ) : detail.isError ? (
            <ErrorText onRetry={() => void detail.refetch()} />
          ) : (
            <>
              <section
                className="principal-dashboard__session-identity"
                aria-label="مشخصات جلسهٔ انتخاب‌شده"
              >
                <div>
                  <span>کلاس و درس</span>
                  <strong>{detail.data?.title ?? session.title}</strong>
                  <small>{detail.data?.subjectName || "درس ثبت نشده"}</small>
                </div>
                <div>
                  <span>استاد و زمان</span>
                  <strong>{detail.data?.assignedStaffName || "استاد ثبت نشده"}</strong>
                  <small>
                    {formatDate(detail.data?.sessionDate ?? session.sessionDate)}
                    {detail.data?.scheduledStartAt
                      ? ` · ${new Intl.DateTimeFormat("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tehran",
                        }).format(new Date(detail.data.scheduledStartAt))}`
                      : ""}
                  </small>
                </div>
                <div className="principal-dashboard__session-totals" aria-label="خلاصه غیبت‌ها">
                  <Count label="غایبِ نیازمند پیگیری" value={absentCount} />
                  <Count label="تأخیر" value={delayedCount} />
                </div>
              </section>
              <label className="principal-dashboard__student-search">
                <span>جست‌وجوی دانش‌آموز</span>
                <input
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="نام دانش‌آموز را بنویسید"
                  type="search"
                />
              </label>
              <p className="text-sm font-bold">
                دانش‌آموزان غایب و دارای تأخیر ({visibleRecords.length.toLocaleString("fa-IR")})
              </p>
              <ul className="grid gap-2">
                {visibleRecords.map((record) => {
                  const delayed = record.physicalStatus === "late";
                  return (
                    <li
                      key={record.id}
                      className={
                        delayed
                          ? "principal-dashboard__late-student-row"
                          : "principal-dashboard__absent-student-row"
                      }
                    >
                      <span
                        className={
                          delayed
                            ? "principal-dashboard__late-student-name"
                            : "principal-dashboard__absent-student-name"
                        }
                      >
                        {rosterNames.get(record.studentId) ?? "دانش‌آموز"}
                        {record.note ? (
                          <small className="mt-1 block text-muted-foreground">
                            یادداشت استاد: {record.note}
                          </small>
                        ) : null}
                      </span>
                      <span
                        className={
                          delayed
                            ? "principal-dashboard__late-student-badge"
                            : "principal-dashboard__absent-student-badge"
                        }
                      >
                        {delayed ? "تأخیر · نیازمند پیگیری" : "غایب · نیازمند پیگیری"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {!visibleRecords.length ? (
                <Empty text="دانش‌آموز غایب یا دارای تأخیر با این نام در این جلسه پیدا نشد." />
              ) : null}
              {needsAbsenceMessage && (
                <label className="text-sm font-semibold">
                  پیام مدیر برای استاد (درخواست توضیح غیبت‌ها)
                  <textarea
                    value={message}
                    maxLength={500}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-2 min-h-20 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 font-normal"
                    placeholder="برای مثال: لطفاً علت غیبت دانش‌آموزان را پیگیری و توضیح دهید."
                  />
                </label>
              )}
              <div className="principal-dashboard__review-action">
                <small>
                  {needsAbsenceMessage
                    ? "برای بایگانی این جلسه، پیام پیگیری غیبت‌ها برای استاد لازم است."
                    : "این جلسه بدون غیبت، پس از بازبینی در آرشیو نگهداری می‌شود."}
                </small>
                <Button
                  disabled={busy || (needsAbsenceMessage && !message.trim())}
                  onClick={() => onReview(message.trim())}
                >
                  <Check size={16} /> ثبت بازبینی و انتقال به آرشیو
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function DormReviewRow({
  item,
  onReview,
  busy,
}: {
  item: AttendanceAbsenceReview;
  onReview: (decision: "approved" | "rejected", note: string, outside: boolean) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  const [outside, setOutside] = useState(false);
  return (
    <article className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4">
      <div className="flex items-start justify-between gap-3">
        <strong>{item.studentName}</strong>
        <span className="text-xs text-muted-foreground">{formatDate(item.sessionDate)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.organizationName} · {item.teacherName}
      </p>
      <p className="mt-3 text-sm">دلیل ثبت‌شده: {item.reason || "ثبت نشده"}</p>
      <label className="mt-3 block text-sm font-semibold">
        یادداشت بررسی
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          className="mt-2 min-h-16 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 font-normal"
        />
      </label>
      {item.contextType === "dorm" && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={outside}
            onChange={(event) => setOutside(event.target.checked)}
          />{" "}
          پس از پذیرش، خارج از مدرسه ثبت شود
        </label>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => onReview("approved", note.trim(), outside)}>
          پذیرش و ذخیره در آرشیو
        </Button>
        <Button
          variant="soft"
          disabled={busy}
          onClick={() => onReview("rejected", note.trim(), false)}
        >
          رد دلیل
        </Button>
      </div>
    </article>
  );
}

function ReportRow({
  report,
  onSeen,
  onAction,
  busy,
}: {
  report: TeacherStudentReport;
  onSeen: () => void;
  onAction: (action: "full_screen_summons" | "contact_request") => void;
  busy: boolean;
}) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <strong>{report.studentName}</strong>
        <small className="text-muted-foreground">
          {report.teacherName} · {report.sessionTitle}
        </small>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{report.message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!report.seenAt && (
          <Button variant="soft" disabled={busy} onClick={onSeen}>
            علامت‌گذاری به‌عنوان دیده‌شده
          </Button>
        )}
        {report.principalAction ? (
          <span className="self-center text-xs font-bold text-emerald-700">اقدام ارسال شد</span>
        ) : (
          <>
            <Button disabled={busy} onClick={() => onAction("full_screen_summons")}>
              ارسال اعلان مراجعه به دفتر
            </Button>
            <Button variant="soft" disabled={busy} onClick={() => onAction("contact_request")}>
              درخواست تماس با دانش‌آموز
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full bg-[rgb(var(--surface-muted))] px-3 py-1">
      {label}: {value.toLocaleString("fa-IR")}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-[rgb(var(--surface-muted))] p-4 text-sm text-muted-foreground">
      {text}
    </p>
  );
}
function ErrorText({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-100"
    >
      دریافت فهرست انجام نشد.{" "}
      <button className="font-bold underline" onClick={onRetry}>
        تلاش دوباره
      </button>
    </div>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeZone: "Asia/Tehran",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}
