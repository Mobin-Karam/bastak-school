import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BedDouble,
  CalendarCheck2,
  FileWarning,
  UsersRound,
  UserRoundCheck,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { DormAttendanceReviewInbox } from "../../../student-life/attendance/components/DormAttendanceReviewInbox";
import {
  getDormAttendanceReviewQueue,
  getOutsidePresenceReports,
} from "../../../student-life/attendance/api/attendance-operations.api";
import {
  actOnTeacherStudentReport,
  getTeacherStudentReports,
  markTeacherStudentReportSeen,
  type TeacherStudentReport,
} from "../../reports/api/reports.api";
import {
  listTeacherLeaveRequests,
  reviewTeacherLeaveRequest,
  reviewTeacherLeaveReturn,
  type TeacherLeaveRequest,
} from "../../../academics/schedule/api/teacher-leave.api";
import {
  listAcademicTeachers,
  type AcademicTeacher,
} from "../../../academics/education/api/academic.api";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDormSessionId = searchParams.get("dormSessionId");
  const requestedPanel = searchParams.get("panel") as Panel | null;
  const [active, setActive] = useState<Panel | null>(() =>
    requestedDormSessionId ? "dorm" : requestedPanel === "leave" ? "leave" : null,
  );
  useEffect(() => {
    if (requestedDormSessionId) setActive("dorm");
  }, [requestedDormSessionId]);
  useEffect(() => {
    if (requestedPanel === "leave") setActive("leave");
  }, [requestedPanel]);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [autoArchiveProgress, setAutoArchiveProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [autoArchiveError, setAutoArchiveError] = useState(false);
  const autoArchiveCancelled = useRef(false);
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id;
  const dormScope = JSON.stringify([auth.user?.id, auth.activeRole, organizationId]);
  const dormQueue = useQuery({
    queryKey: ["dorm-attendance-review-queue", dormScope],
    queryFn: getDormAttendanceReviewQueue,
    enabled: canReviewAttendance,
  });
  const outsidePresenceReports = useQuery({
    queryKey: ["attendance", "outside-presence-reports", dormScope],
    queryFn: getOutsidePresenceReports,
    enabled: canReviewAttendance,
  });
  const reports = useQuery({
    queryKey: ["principal", "teacher-reports"],
    queryFn: getTeacherStudentReports,
    enabled: canReviewAttendance,
  });
  const teacherLeaves = useQuery({
    queryKey: ["teacher-leaves", "principal", organizationId],
    queryFn: listTeacherLeaveRequests,
    enabled: active === "leave" && auth.can("leave.read"),
  });
  const teachers = useQuery({
    queryKey: ["academic", "teachers", "leave-substitutes", organizationId],
    queryFn: () => listAcademicTeachers(organizationId!, { limit: 100 }),
    enabled: active === "leave" && Boolean(organizationId) && auth.can("schedule.publish"),
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
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: ["attendance-policy", organizationId] });
      const previous = client.getQueryData<AttendancePolicy>(["attendance-policy", organizationId]);
      client.setQueryData(["attendance-policy", organizationId], next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous)
        client.setQueryData(["attendance-policy", organizationId], context.previous);
    },
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
  const reviewTeacherLeave = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        decision: "approved" | "rejected";
        resolution?: "cancel" | "substitute";
        substituteTeacherId?: string;
      };
    }) => reviewTeacherLeaveRequest(id, body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["teacher-leaves"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
      void client.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
  const reviewTeacherReturn = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      reviewTeacherLeaveReturn(id, { decision }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["teacher-leaves"] });
      void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
      void client.invalidateQueries({ queryKey: ["schedule"] });
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
  const values = lists ?? {
    teacherSessions: [],
    teacherReports: [],
    dormAttendance: [],
    classGroupAttendance: [],
    teacherLeaveRequests: [],
  };
  const counts: Record<Panel, number> = {
    dorm:
      (dormQueue.data?.length ?? values.counts?.dorm ?? 0) +
      (outsidePresenceReports.data?.length ?? 0),
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
        onOpenChange={(open) => {
          if (open) return;
          setActive(null);
          if (requestedDormSessionId) {
            const next = new URLSearchParams(searchParams);
            next.delete("dormSessionId");
            setSearchParams(next, { replace: true });
          }
          if (requestedPanel) {
            const next = new URLSearchParams(searchParams);
            next.delete("panel");
            setSearchParams(next, { replace: true });
          }
        }}
        title={cards.find((item) => item.id === active)?.title ?? "فهرست مدیر"}
        description="موارد این بخش در همین پنل بررسی و در سوابق مربوط ذخیره می‌شوند."
        desktopSide="left"
        className="principal-dashboard__drawer"
      >
        <div className="grid gap-3" dir="rtl">
          {updatePolicy.isError ||
          reviewSession.isError ||
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
            <DormAttendanceReviewInbox
              compact
              requestedSessionId={requestedDormSessionId ?? undefined}
            />
          )}
          {active === "sessions" && (
            <>
              {policy.isError ? <ErrorText onRetry={() => void policy.refetch()} /> : null}
              {fullyPresentSessions.isError ? (
                <ErrorText onRetry={() => void fullyPresentSessions.refetch()} />
              ) : null}
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
          {active === "leave" && (
            <TeacherLeaveReviewList
              rows={teacherLeaves.data ?? []}
              loading={teacherLeaves.isLoading}
              error={teacherLeaves.isError}
              teachers={teachers.data?.items ?? []}
              busy={reviewTeacherLeave.isPending || reviewTeacherReturn.isPending}
              onReviewLeave={(id, body) => reviewTeacherLeave.mutate({ id, body })}
              onReviewReturn={(id, decision) => reviewTeacherReturn.mutate({ id, decision })}
            />
          )}
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
  const messageRequired = absentCount > 0;
  const canMessageTeacher = absentCount > 0 || delayedCount > 0;
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
              {canMessageTeacher && (
                <label className="text-sm font-semibold">
                  پیام مدیر برای استاد دربارهٔ ورود دانش‌آموزان
                  <textarea
                    value={message}
                    maxLength={500}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-2 min-h-20 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 font-normal"
                    placeholder={
                      messageRequired
                        ? "اجباری: دستور یا توضیح مدیر دربارهٔ دانش‌آموزان غایب را بنویسید."
                        : "اختیاری: دستور مدیر برای اجازهٔ ورود دانش‌آموزان دارای تأخیر."
                    }
                  />
                  {messageRequired ? (
                    <small className="mt-1 block text-rose-700 dark:text-rose-200">
                      برای جلسه دارای غیبت، نوشتن پیام مدیر الزامی است.
                    </small>
                  ) : null}
                </label>
              )}
              <div className="principal-dashboard__review-action">
                <small>
                  {messageRequired
                    ? "پیام مدیر همراه نام دانش‌آموزان برای استاد ارسال می‌شود."
                    : canMessageTeacher
                      ? "در صورت نیاز، پیام مدیر همراه نام دانش‌آموزان دارای تأخیر برای استاد ارسال می‌شود."
                      : "این جلسه بدون غیبت، پس از بازبینی در آرشیو نگهداری می‌شود."}
                </small>
                <Button
                  disabled={busy || (messageRequired && !message.trim())}
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

function TeacherLeaveReviewList({
  rows,
  loading,
  error,
  teachers,
  busy,
  onReviewLeave,
  onReviewReturn,
}: {
  rows: TeacherLeaveRequest[];
  loading: boolean;
  error: boolean;
  teachers: AcademicTeacher[];
  busy: boolean;
  onReviewLeave: (
    id: string,
    body: {
      decision: "approved" | "rejected";
      resolution?: "cancel" | "substitute";
      substituteTeacherId?: string;
    },
  ) => void;
  onReviewReturn: (id: string, decision: "approved" | "rejected") => void;
}) {
  const [substitutes, setSubstitutes] = useState<Record<string, string>>({});
  const pending = rows.filter((row) => row.status === "pending" || row.returnStatus === "pending");
  if (loading) return <LoadingState label="دریافت درخواست‌های مرخصی استادان…" />;
  if (error) return <ErrorText onRetry={() => window.location.reload()} />;
  if (!pending.length) return <Empty text="درخواست مرخصی یا بازگشت استادی در صف نیست." />;
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        تأیید مرخصی فقط رخدادهای همان بازه را منجمد می‌کند. با انتخاب جانشین، همان جلسه‌ها به‌صورت
        یک‌باره به دبیر منتخب واگذار می‌شوند.
      </p>
      {pending.map((row) => {
        const isReturn = row.returnStatus === "pending";
        const teacherName =
          [row.teacher?.firstName, row.teacher?.lastName].filter(Boolean).join(" ") ||
          row.teacher?.username ||
          "استاد";
        return (
          <article
            key={`${row.id}:${isReturn ? "return" : "leave"}`}
            className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <strong>{teacherName}</strong>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isReturn
                    ? `بازگشت در ${formatDate(row.returnDate ?? row.startDate)}`
                    : `${formatDate(row.startDate)} تا ${formatDate(row.endDate)}`}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                {isReturn ? "درخواست بازگشت" : "درخواست مرخصی"}
              </span>
            </div>
            <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm leading-6">
              {isReturn ? row.returnMessage || "بدون پیام" : row.reason}
            </p>
            {isReturn ? (
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => onReviewReturn(row.id, "approved")}>
                  تأیید بازگشت و فعال‌سازی برنامه
                </Button>
                <Button
                  variant="soft"
                  disabled={busy}
                  onClick={() => onReviewReturn(row.id, "rejected")}
                >
                  رد درخواست
                </Button>
              </div>
            ) : (
              <>
                <label className="grid gap-1 text-sm font-bold">
                  دبیر جایگزین (اختیاری)
                  <select
                    className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] px-3 font-normal"
                    value={substitutes[row.id] ?? ""}
                    onChange={(event) =>
                      setSubstitutes((current) => ({ ...current, [row.id]: event.target.value }))
                    }
                  >
                    <option value="">بدون جانشین؛ نمایش لغو جلسه برای دانش‌آموزان</option>
                    {teachers
                      .filter((teacher) => teacher.id !== row.teacherId)
                      .map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
                            teacher.username}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      onReviewLeave(
                        row.id,
                        substitutes[row.id]
                          ? {
                              decision: "approved",
                              resolution: "substitute",
                              substituteTeacherId: substitutes[row.id],
                            }
                          : { decision: "approved", resolution: "cancel" },
                      )
                    }
                  >
                    تأیید مرخصی
                  </Button>
                  <Button
                    variant="soft"
                    disabled={busy}
                    onClick={() => onReviewLeave(row.id, { decision: "rejected" })}
                  >
                    رد درخواست
                  </Button>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
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
