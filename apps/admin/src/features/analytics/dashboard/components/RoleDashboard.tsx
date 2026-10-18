import {
  Activity,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Clock3,
  FileQuestion,
  MessageSquare,
  MonitorDot,
  PanelsTopLeft,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../../../identity/auth";
import { Badge, Button, Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { useLocale } from "../../../../shared/ui/locale";
import { DashboardWorkspace } from "../../../../shared/ui/dashboard-workspace";
import { ZaninBrand } from "../../../../shared/ui/zanin-brand";
import type { DashboardWorkItem, RoleDashboardData } from "../model/dashboard.types.ts";
import { dashboardCopy } from "../model/dashboard-copy";
import { DashboardWorkQueue } from "./work/DashboardWorkQueue";
import { getRoleConfig } from "../model/role-config";
import { DashboardQuickActions } from "./work/DashboardQuickActions";
import { PlatformHealthPanel } from "./health/PlatformHealthPanel";
import { PlatformOrganizationOverview } from "./health/PlatformOrganizationOverview";
import { DashboardSchedule } from "./planning/DashboardSchedule";
import { DashboardPlanHealth } from "./planning/DashboardPlanHealth";
import { DashboardOperationalPulse } from "./health/DashboardOperationalPulse";
import {
  DashboardLayoutBoard,
  type DashboardBoardItem,
} from "../../../../shared/ui/dashboard-layout-board";
import { SegmentedControl } from "../../../../shared/ui/segmented-control";
import {
  createRoleDashboardView,
  dashboardSearchForView,
  dashboardViewFromSearch,
  hasDashboardViewSearch,
  useRoleDashboardView,
  visibleRoleDashboardWidgets,
} from "../model/dashboard-layout";
import { quickActionsForRole } from "../model/role-experience";
import { dashboardWidgetRole } from "../model/role-dashboard-composition";
import { Metric } from "../model/dashboard-metrics";
import { DashboardMetricGrid } from "./metrics/DashboardMetricGrid";
import { DashboardCalendar } from "./DashboardCalendar";
import { MobileDashboardHome } from "./MobileDashboardHome";
import { todayIso } from "../../../../shared/lib/utils";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";
import { useViewportShell } from "../../../../app/layout/lib/viewport-shell";

const n = (value: unknown) => (typeof value === "number" ? value : 0);

export function roleDashboardMetrics(
  data: RoleDashboardData,
  language: "fa" | "en" = "fa",
): Metric[] {
  const copy = dashboardCopy[language];
  const common: Metric[] = [
    {
      label: copy.assignedStudents,
      value: n(data.assignedStudents),
      hint: copy.assignedStudentsHint,
      icon: UsersRound,
      tone: "green",
    },
    {
      label: copy.unreadMessages,
      value: n(data.unreadConversations),
      hint: copy.unreadMessagesHint,
      icon: MessageSquare,
      tone: "blue",
    },
  ];
  switch (data.context) {
    case "GUARDIAN":
      return [
        {
          label: copy.children,
          value: n(data.children),
          hint: copy.childrenHint,
          icon: UsersRound,
          tone: "green",
        },
        common[1],
      ];
    case "ADVISOR":
      return [
        ...common,
        {
          label: copy.needsAttention,
          value: n(data.attentionStudents),
          hint: copy.needsAttentionHint,
          icon: Activity,
          tone: "red",
        },
        {
          label: copy.recoveryRequests,
          value: n(data.recoveryRequests),
          hint: copy.recoveryRequestsHint,
          icon: RefreshCw,
          tone: "amber",
        },
        {
          label: copy.taskIssues,
          value: n(data.taskIssues),
          hint: copy.taskIssuesHint,
          icon: CalendarDays,
          tone: "amber",
        },
        {
          label: copy.retryRequests,
          value: n(data.retryRequests),
          hint: copy.retryRequestsHint,
          icon: BookOpenCheck,
          tone: "blue",
        },
      ];
    case "TEACHER":
      return [
        ...common,
        {
          label: copy.activeSubjects,
          value: Array.isArray(data.subjects) ? data.subjects.length : 0,
          hint: copy.activeSubjectsHint,
          icon: BookOpenCheck,
          tone: "blue",
        },
        {
          label: copy.openIssues,
          value: n(data.studentsNeedingAttention),
          hint: copy.openIssuesHint,
          icon: Activity,
          tone: "red",
        },
        {
          label: copy.questionBank,
          value: n(data.contentTasks?.questions),
          hint: copy.questionBankHint,
          icon: FileQuestion,
          tone: "amber",
        },
      ];
    case "MENTOR":
      return [
        ...common,
        {
          label: copy.todayPlansMetric,
          value: n(data.recentProgress?.plans),
          hint: copy.todayPlansHint,
          icon: CalendarDays,
          tone: "green",
        },
        {
          label: copy.upcomingGoalsMetric,
          value: data.upcomingGoals?.length || 0,
          hint: copy.upcomingGoalsHint,
          icon: BookOpenCheck,
          tone: "amber",
        },
      ];
    case "CONTENT_MANAGER":
      return [
        {
          label: copy.subjectsMetric,
          value: n(data.subjects),
          hint: copy.subjectsHint,
          icon: BookOpenCheck,
          tone: "green",
        },
        {
          label: copy.questionsMetric,
          value: n(data.questions),
          hint: copy.questionsHint,
          icon: FileQuestion,
          tone: "blue",
        },
        {
          label: copy.quizzesMetric,
          value: n(data.quizzes),
          hint: `${n(data.draftCount).toLocaleString(language === "en" ? "en-US" : "fa-IR")} ${copy.quizzesHint}`,
          icon: BookOpenCheck,
          tone: "amber",
        },
        {
          label: copy.examsMetric,
          value: n(data.exams),
          hint: copy.examsHint,
          icon: CalendarDays,
          tone: "red",
        },
      ];
    case "ORGANIZATION_ADMIN":
      return [
        {
          label: copy.noPlanMetric,
          value: n(data.studentHealthSummary?.noPlan),
          hint: copy.noPlanMetricHint,
          icon: CalendarDays,
          tone: "amber",
        },
        {
          label: copy.studentsMetric,
          value: n(data.students),
          hint: copy.studentsHint,
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: copy.noAdvisorMetric,
          value: n(data.studentHealthSummary?.noAdvisor),
          hint: copy.noAdvisorMetricHint,
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: copy.noReportMetric,
          value: n(data.studentHealthSummary?.noReport),
          hint: copy.noReportMetricHint,
          icon: Activity,
          tone: "red",
        },
      ];
    case "PLATFORM_ADMIN":
      return [
        {
          label: copy.organizationsMetric,
          value: n(data.organizations),
          hint: copy.organizationsHint,
          icon: Building2,
          tone: "green",
        },
        {
          label: copy.usersMetric,
          value: n(data.users),
          hint: copy.usersHint,
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: copy.securityEvents,
          value: n(data.auditSummary?.events24h),
          hint: copy.securityEventsHint,
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: copy.lockedLogins,
          value: n(data.auditSummary?.lockedLogins),
          hint: copy.lockedLoginsHint,
          icon: Activity,
          tone: "red",
        },
        {
          label: copy.signupOrganizationsMetric,
          value: n(data.signupOverview?.enabledOrganizations),
          hint: copy.signupOrganizationsHint,
          icon: Building2,
          tone: "green",
        },
        {
          label: copy.signupCapacityMetric,
          value: n(data.signupOverview?.remainingCapacity),
          hint: copy.signupCapacityHint,
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: copy.pendingAssignmentsMetric,
          value: n(data.signupOverview?.pendingAssignments),
          hint: copy.pendingAssignmentsHint,
          icon: Activity,
          tone: "amber",
        },
      ];
    default:
      return common;
  }
}
const metrics = roleDashboardMetrics;

export function RoleDashboard({
  data,
  loading,
  error,
  refreshing,
  workItems,
  workLoading,
  workError,
  onRefresh,
  onRetry,
  onRetryWork,
}: {
  data?: RoleDashboardData;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  workItems: DashboardWorkItem[];
  workLoading: boolean;
  workError: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onRetryWork: () => void;
}) {
  const auth = useAuth();
  const isMobileShell = useViewportShell() === "mobile";
  const { language, profile } = useLocale();
  const dashboard = dashboardCopy[language];
  const roleKey = dashboardWidgetRole(data?.activeRole || data?.context || auth.activeRole || "");
  const roleCopy = {
    GUARDIAN: {
      title: dashboard.guardianWorkspaceTitle,
      description: dashboard.guardianWorkspaceDescription,
    },
    ADVISOR: {
      title: dashboard.advisorWorkspaceTitle,
      description: dashboard.advisorWorkspaceDescription,
    },
    TEACHER: {
      title: dashboard.teacherWorkspaceTitle,
      description: dashboard.teacherWorkspaceDescription,
    },
    MENTOR: {
      title: dashboard.mentorWorkspaceTitle,
      description: dashboard.mentorWorkspaceDescription,
    },
    CONTENT_MANAGER: {
      title: dashboard.contentManagerWorkspaceTitle,
      description: dashboard.contentManagerWorkspaceDescription,
    },
    ORGANIZATION_ADMIN: {
      title: dashboard.organizationAdminWorkspaceTitle,
      description: dashboard.organizationAdminWorkspaceDescription,
    },
    PLATFORM_ADMIN: {
      title: dashboard.platformAdminWorkspaceTitle,
      description: dashboard.platformAdminWorkspaceDescription,
    },
  }[roleKey] || {
    title: dashboard.defaultWorkspaceTitle,
    description: dashboard.defaultWorkspaceDescription,
  };

  const role = data?.context; // "PLATFORM_ADMIN" | "TEACHER" | ...
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultView = useMemo(() => createRoleDashboardView(role), [role]);
  const sharedView = useMemo(
    () =>
      hasDashboardViewSearch(searchParams)
        ? dashboardViewFromSearch(defaultView, searchParams)
        : undefined,
    [defaultView, searchParams],
  );
  const syncViewToUrl = useCallback(
    (nextView: ReturnType<typeof createRoleDashboardView>) => {
      setSearchParams((current) => dashboardSearchForView(current, nextView, defaultView), {
        replace: true,
      });
    },
    [defaultView, setSearchParams],
  );
  const { tone, icon: Icon, label } = getRoleConfig(role);
  const { view, setDensity, setMode, setWidgetVisible, setWidgetLayout, setWidgetOrder, reset } =
    useRoleDashboardView(role, {
      sharedView,
      onChange: syncViewToUrl,
    });
  const [editingBoard, setEditingBoard] = useState(false);
  const [calendarDate, setCalendarDate] = useState(todayIso);
  const prayer = data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;

  if (loading) return <LoadingState label={dashboard.workspaceLoading} />;
  if (error || !data)
    return (
      <EmptyState
        title={dashboard.workspaceUnavailable}
        action={
          <Button variant="soft" onClick={onRetry}>
            <RefreshCw size={16} />
            {dashboard.retry}
          </Button>
        }
      />
    );
  const metricItems = metrics(data, language);
  const visibleWidget = (id: string) =>
    visibleRoleDashboardWidgets(view).some((widget) => widget.id === id);
  const showPlatformHealth = data.context === "PLATFORM_ADMIN" && visibleWidget("platform-health");
  const showPlatformOrganizations =
    data.context === "PLATFORM_ADMIN" && visibleWidget("platform-organizations");
  const showOperationalPulse =
    ["PLATFORM_ADMIN", "ORGANIZATION_ADMIN"].includes(data.context) &&
    visibleWidget("operational-pulse");
  const showNextActions =
    visibleWidget("next-actions") &&
    quickActionsForRole(auth.activeRole, auth.capabilities, language).length > 0;
  const supportsSchedule = ["ADVISOR", "TEACHER", "MENTOR"].includes(data.context);
  const showSchedule = visibleWidget("upcoming-schedule") && supportsSchedule;
  const supportsPlanHealth = ["ADVISOR", "MENTOR", "ORGANIZATION_ADMIN"].includes(data.context);
  const showPlanHealth = visibleWidget("plan-health") && supportsPlanHealth;
  const showStudentHealth =
    data.context === "ORGANIZATION_ADMIN" && visibleWidget("student-health");
  const showWeeklyPlanHealth =
    data.context === "ORGANIZATION_ADMIN" && visibleWidget("weekly-plan-health");
  const generatedAt = data.generatedAt
    ? dashboard.refreshedAt +
      " · " +
      new Intl.DateTimeFormat(profile.locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(data.generatedAt),
      )
    : undefined;
  const widgetById = new Map(view.widgets.map((widget) => [widget.id, widget]));
  const boardItems: DashboardBoardItem[] = [
    {
      id: "summary",
      title: dashboard.defaultWorkspaceTitle,
      description: dashboard.defaultWorkspaceDescription,
      width: widgetById.get("summary")?.width ?? 12,
      height: widgetById.get("summary")?.height ?? 1,
      content: (
        <DashboardMetricGrid
          items={metricItems}
          locale={profile.locale}
          density={view.density}
          label={dashboard.defaultWorkspaceTitle}
        />
      ),
    },
    ...(showOperationalPulse
      ? [
          {
            id: "operational-pulse",
            title: dashboard.operationalPulseWidget,
            description: dashboard.operationalPulseWidgetDescription,
            width: widgetById.get("operational-pulse")?.width ?? 12,
            height: widgetById.get("operational-pulse")?.height ?? 1,
            content: <DashboardOperationalPulse data={data} />,
          },
        ]
      : []),
    {
      id: "priority-work",
      title: dashboard.workQueueTitle,
      description: dashboard.workQueueDescription,
      width: widgetById.get("priority-work")?.width ?? 8,
      height: widgetById.get("priority-work")?.height ?? 2,
      content: (
        <DashboardWorkQueue
          items={workItems}
          loading={workLoading}
          error={workError}
          onRetry={onRetryWork}
        />
      ),
    },
    ...(showNextActions
      ? [
          {
            id: "next-actions",
            title: dashboard.nextActionsWidget,
            description: dashboard.nextActionsWidgetDescription,
            width: widgetById.get("next-actions")?.width ?? 4,
            height: widgetById.get("next-actions")?.height ?? 1,
            content: <DashboardQuickActions />,
          },
        ]
      : []),
    ...(showSchedule
      ? [
          {
            id: "upcoming-schedule",
            title: dashboard.upcomingScheduleWidget,
            description: dashboard.upcomingScheduleWidgetDescription,
            width: widgetById.get("upcoming-schedule")?.width ?? 4,
            height: widgetById.get("upcoming-schedule")?.height ?? 1,
            content: <DashboardSchedule data={data} />,
          },
        ]
      : []),
    ...(showPlanHealth
      ? [
          {
            id: "plan-health",
            title: dashboard.planHealthWidget,
            description: dashboard.planHealthWidgetDescription,
            width: widgetById.get("plan-health")?.width ?? 4,
            height: widgetById.get("plan-health")?.height ?? 1,
            content: (
              <DashboardPlanHealth
                value={data.todayPlanHealth ?? data.recentProgress}
                href={auth.capabilities.includes("plans.read") ? "/admin/planner" : undefined}
              />
            ),
          },
        ]
      : []),
    ...(showPlatformHealth
      ? [
          {
            id: "platform-health",
            title: dashboard.platformHealthWidget,
            description: dashboard.platformHealthWidgetDescription,
            width: widgetById.get("platform-health")?.width ?? 4,
            height: widgetById.get("platform-health")?.height ?? 1,
            content: <PlatformHealthPanel data={data} />,
          },
        ]
      : []),
    ...(showPlatformOrganizations
      ? [
          {
            id: "platform-organizations",
            title: "سازمان‌های پلتفرم",
            description: "مرز داده و وضعیت عملیاتی هر سازمان",
            width: widgetById.get("platform-organizations")?.width ?? 8,
            height: widgetById.get("platform-organizations")?.height ?? 2,
            content: <PlatformOrganizationOverview data={data} />,
          },
        ]
      : []),
    ...(showStudentHealth
      ? [
          {
            id: "student-health",
            title: dashboard.studentHealthWidget,
            description: dashboard.studentHealthWidgetDescription,
            width: widgetById.get("student-health")?.width ?? 8,
            height: widgetById.get("student-health")?.height ?? 1,
            content: <OrganizationStudentHealth data={data} />,
          },
        ]
      : []),
    ...(showWeeklyPlanHealth
      ? [
          {
            id: "weekly-plan-health",
            title: dashboard.weeklyPlanHealthWidget,
            description: dashboard.weeklyPlanHealthWidgetDescription,
            width: widgetById.get("weekly-plan-health")?.width ?? 4,
            height: widgetById.get("weekly-plan-health")?.height ?? 1,
            content: (
              <DashboardPlanHealth
                value={data.weeklyPlanHealth}
                href={auth.capabilities.includes("plans.read") ? "/admin/planner" : undefined}
                title={dashboard.weeklyPlanHealthTitle}
                description={dashboard.weeklyPlanHealthDescription}
              />
            ),
          },
        ]
      : []),
  ]
    .filter((item) => visibleWidget(item.id))
    .sort(
      (left, right) =>
        (widgetById.get(left.id)?.order ?? 0) - (widgetById.get(right.id)?.order ?? 0),
    );

  return (
    <DashboardWorkspace
      title={roleCopy.title}
      description={roleCopy.description}
      freshness={
        <span className="inline-flex items-center lg:gap-1.5 ">
          <Badge tone={tone} title={label}>
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </Badge>
          {generatedAt}
        </span>
      }
      density={view.density}
      brand={<ZaninBrand className="max-w-[13rem]" showName={false} />}
      onDensityChange={setDensity}
      densityLabels={{
        label: dashboard.dashboardDensity,
        comfortable: dashboard.comfortableDensity,
        compact: dashboard.compactDensity,
      }}
      preferences={{
        label: dashboard.dashboardLayout,
        visibleWidgetsLabel: dashboard.visibleWidgets,
        resetLabel: dashboard.resetDashboardLayout,
        shownLabel: dashboard.widgetShown,
        hiddenLabel: dashboard.widgetHidden,
        widgets: [
          ...(["PLATFORM_ADMIN", "ORGANIZATION_ADMIN"].includes(data.context)
            ? [
                {
                  id: "operational-pulse",
                  label: dashboard.operationalPulseWidget,
                  description: dashboard.operationalPulseWidgetDescription,
                  visible: visibleWidget("operational-pulse"),
                },
              ]
            : []),
          ...(data.context === "PLATFORM_ADMIN"
            ? [
                {
                  id: "platform-organizations",
                  label: "سازمان‌های پلتفرم",
                  description: "نمایش برچسب و آمار هر سازمان",
                  visible: visibleWidget("platform-organizations"),
                },
              ]
            : []),
          {
            id: "next-actions",
            label: dashboard.nextActionsWidget,
            description: dashboard.nextActionsWidgetDescription,
            visible: visibleWidget("next-actions"),
          },
          ...(supportsSchedule
            ? [
                {
                  id: "upcoming-schedule",
                  label: dashboard.upcomingScheduleWidget,
                  description: dashboard.upcomingScheduleWidgetDescription,
                  visible: visibleWidget("upcoming-schedule"),
                },
              ]
            : []),
          ...(supportsPlanHealth
            ? [
                {
                  id: "plan-health",
                  label: dashboard.planHealthWidget,
                  description: dashboard.planHealthWidgetDescription,
                  visible: visibleWidget("plan-health"),
                },
              ]
            : []),
          ...(data.context === "PLATFORM_ADMIN"
            ? [
                {
                  id: "platform-health",
                  label: dashboard.platformHealthWidget,
                  description: dashboard.platformHealthWidgetDescription,
                  visible: visibleWidget("platform-health"),
                },
              ]
            : []),
          ...(data.context === "ORGANIZATION_ADMIN"
            ? [
                {
                  id: "student-health",
                  label: dashboard.studentHealthWidget,
                  description: dashboard.studentHealthWidgetDescription,
                  visible: visibleWidget("student-health"),
                },
                {
                  id: "weekly-plan-health",
                  label: dashboard.weeklyPlanHealthWidget,
                  description: dashboard.weeklyPlanHealthWidgetDescription,
                  visible: visibleWidget("weekly-plan-health"),
                },
              ]
            : []),
        ],
        onVisibilityChange: setWidgetVisible,
        onReset: reset,
      }}
      actions={
        <>
          <SegmentedControl
            ariaLabel={dashboard.dashboardView}
            value={view.mode}
            onValueChange={(mode) => setMode(mode as "board" | "live")}
            options={[
              {
                value: "board",
                label: (
                  <>
                    <PanelsTopLeft size={14} aria-hidden="true" />
                    {dashboard.boardView}
                  </>
                ),
              },
              {
                value: "live",
                label: (
                  <>
                    <MonitorDot size={14} aria-hidden="true" />
                    {dashboard.liveView}
                  </>
                ),
              },
            ]}
          />
          {view.mode === "board" ? (
            <Button
              variant={editingBoard ? "primary" : "soft"}
              size="sm"
              onClick={() => setEditingBoard((value) => !value)}
              aria-pressed={editingBoard}
            >
              {editingBoard ? dashboard.finishDashboardEditing : dashboard.customizeDashboard}
            </Button>
          ) : null}
          <Button
            variant="soft"
            size="sm"
            loading={refreshing}
            onClick={onRefresh}
            aria-label={dashboard.refreshWorkspace}
            title={dashboard.refreshWorkspace}
          >
            <RefreshCw size={16} />
            {dashboard.refresh}
          </Button>
        </>
      }
      summary={
        isMobileShell ? (
          <MobileDashboardHome
            data={data}
            activeRole={auth.activeRole}
            capabilities={auth.capabilities}
            calendarDate={calendarDate}
            onCalendarDateChange={setCalendarDate}
          />
        ) : (
          <div className="grid min-w-0 gap-3">
            <DashboardCalendar
              value={calendarDate}
              onChange={setCalendarDate}
              capabilities={auth.capabilities}
              schedule={data.home?.calendar.entries}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <CurrentPrayerCard times={prayerTimes} />
              <Card className="p-3" aria-label="کلاس اکنون">
                <div className="flex items-start gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Clock3 size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-ink">کلاس اکنون</h2>
                    {data.home?.currentClass ? (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {data.home.currentClass.title} · {data.home.currentClass.startTime} تا{" "}
                        {data.home.currentClass.endTime}
                        {data.home.currentClass.room ? ` · ${data.home.currentClass.room}` : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        در این بازه، کلاسی برای شما ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
            {data.home?.announcements?.length ? (
              <Card className="p-3" aria-label="پیام‌های مدرسه">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-brand" />
                  <h2 className="text-sm font-black text-ink">پیام‌های مدرسه</h2>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {data.home.announcements.slice(0, 4).map((announcement) => (
                    <article key={announcement.id} className="rounded-lg bg-brand/[0.04] p-3">
                      <h3 className="text-sm font-bold text-ink">{announcement.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {announcement.body}
                      </p>
                    </article>
                  ))}
                </div>
              </Card>
            ) : null}
            {view.mode === "live" ? (
              <DashboardLiveOverview
                title={dashboard.liveOverviewTitle}
                description={dashboard.liveOverviewDescription}
                status={dashboard.liveStatus}
                metrics={boardItems.find((item) => item.id === "summary")?.content}
                pulse={boardItems.find((item) => item.id === "operational-pulse")?.content}
                work={boardItems.find((item) => item.id === "priority-work")?.content}
                supporting={boardItems.filter(
                  (item) => !["summary", "operational-pulse", "priority-work"].includes(item.id),
                )}
              />
            ) : (
              <DashboardLayoutBoard
                key={`${editingBoard ? "editable-dashboard" : "dashboard"}:${boardItems
                  .map((item) => item.id)
                  .join("|")}`}
                items={boardItems}
                editing={editingBoard}
                onChange={setWidgetLayout}
                onReorder={setWidgetOrder}
                labels={{
                  boardLabel: dashboard.dashboardBoard,
                  footprint: dashboard.widgetFootprint,
                  dragHint: dashboard.dragWidgetHint,
                  moveEarlier: dashboard.moveWidgetEarlier,
                  moveLater: dashboard.moveWidgetLater,
                  makeNarrower: dashboard.makeWidgetNarrower,
                  makeWider: dashboard.makeWidgetWider,
                  makeShorter: dashboard.makeWidgetShorter,
                  makeTaller: dashboard.makeWidgetTaller,
                }}
              />
            )}
          </div>
        )
      }
      primary={null}
    />
  );
}

function DashboardLiveOverview({
  title,
  description,
  status,
  metrics,
  pulse,
  work,
  supporting,
}: {
  title: string;
  description: string;
  status: string;
  metrics: ReactNode;
  pulse: ReactNode;
  work: ReactNode;
  supporting: DashboardBoardItem[];
}) {
  return (
    <section aria-label={title} className="grid min-w-0 gap-3">
      <section className="flex min-w-0 flex-wrap justify-end gap-2">
        <span className="sr-only">{description}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
          {status}
        </span>
      </section>
      {metrics}
      {pulse ? <div className="min-w-0">{pulse}</div> : null}
      <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-12">
        <div className="min-w-0 min-[1200px]:col-span-7">{work}</div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1200px]:col-span-5 min-[1200px]:grid-cols-1">
          {supporting.slice(0, 2).map((item) => (
            <div key={item.id} className="min-w-0">
              {item.content}
            </div>
          ))}
        </div>
      </div>
      {supporting.length > 2 ? (
        <div className="grid min-w-0 gap-3 md:grid-cols-2 min-[1200px]:grid-cols-3">
          {supporting.slice(2).map((item) => (
            <div key={item.id} className="min-w-0">
              {item.content}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OrganizationStudentHealth({ data }: { data: RoleDashboardData }) {
  const { language, profile } = useLocale();
  const auth = useAuth();
  const copy = dashboardCopy[language];
  const students = data.studentHealth || [];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-ink">{copy.studentHealthTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {copy.studentHealthDescription}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-3 text-xs font-bold text-brand">
          {auth.capabilities.includes("organization.members.manage") ? (
            <Link to="/admin/organizations" className="hover:underline">
              {copy.openPeopleAccess}
            </Link>
          ) : null}
          <Link to="/admin/students" className="hover:underline">
            {copy.openStudents}
          </Link>
        </span>
      </div>
      {students.length ? (
        <ul
          className="mt-3 divide-y divide-[rgb(var(--border-subtle))]"
          aria-label={copy.studentHealthTitle}
        >
          {students.map((student) => {
            const reasons = [
              student.plansToday === 0
                ? copy.noPlanToday
                : student.completedToday === 0 && student.tasksToday > 0
                  ? copy.noCompletionToday
                  : null,
              !student.reportSubmitted ? copy.noReportToday : null,
              student.syncStatus === "failed" ? copy.syncFailed : null,
              student.openIssues ? copy.openStudentIssue : null,
              student.pendingRecoveries ? copy.pendingRecovery : null,
              !student.advisorAssigned ? copy.noAdvisor : null,
            ].filter(Boolean);
            return (
              <li key={student.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    to={`/admin/students?studentId=${encodeURIComponent(student.id)}&tab=activity`}
                    className="block truncate text-xs font-bold text-ink hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {student.name}
                  </Link>
                  <span className="mt-0.5 block truncate text-[11px] text-amber-700 dark:text-amber-300">
                    {reasons.join(" · ")}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">
                  {student.completedToday.toLocaleString(profile.locale)}/
                  {student.tasksToday.toLocaleString(profile.locale)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{copy.noStudentHealth}</p>
      )}
      <section
        className="mt-4 border-t border-[rgb(var(--border-subtle))] pt-3"
        aria-labelledby="advisor-coverage-title"
      >
        <h3 id="advisor-coverage-title" className="text-xs font-black text-ink">
          {copy.advisorCoverageTitle}
        </h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          {copy.advisorCoverageDescription}
        </p>
        {data.advisorCoverage?.length ? (
          <ul
            className="mt-2 flex gap-2 overflow-x-auto pb-1"
            aria-label={copy.advisorCoverageTitle}
          >
            {data.advisorCoverage.map((advisor) => (
              <li
                key={advisor.id}
                className="min-w-28 rounded-md bg-[rgb(var(--surface-muted))] px-2.5 py-2"
              >
                <strong className="block truncate text-xs text-ink">{advisor.name}</strong>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  {copy.assignedStudentsCount.replace(
                    "{count}",
                    advisor.assignedStudents.toLocaleString(profile.locale),
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {copy.noAdvisorCoverage}
          </p>
        )}
      </section>
    </Card>
  );
}
