import { Activity, CircleCheck, ShieldCheck } from "lucide-react";
import { Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";
import type { RoleDashboardData } from "../model/dashboard.types";

type PulseRing = {
  id: string;
  label: string;
  value: number;
  detail: string;
  tone: "pink" | "violet" | "lilac";
};

type PulseSignal = { id: string; label: string; value: number };

export type OperationalPulse = {
  title: string;
  description: string;
  rings: PulseRing[];
  signals: PulseSignal[];
};

const count = (value: unknown) => Math.max(0, Number(value) || 0);
const percentage = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

/**
 * Derives a visual dashboard summary solely from role-scoped API fields. The
 * bars compare current operational counts; they are intentionally not a time series.
 */
export function operationalPulse(
  data: RoleDashboardData,
  copy: Record<string, string>,
): OperationalPulse | null {
  if (data.context === "ORGANIZATION_ADMIN") {
    const students = count(data.students);
    const tasks = count(data.todayPlanHealth?.tasks ?? data.recentProgress?.tasks);
    const completed = Math.min(
      tasks,
      count(data.todayPlanHealth?.completed ?? data.recentProgress?.completed),
    );
    const noAdvisor = Math.min(students, count(data.studentHealthSummary?.noAdvisor));
    const noReport = Math.min(students, count(data.studentHealthSummary?.noReport));
    const noPlan = Math.min(students, count(data.studentHealthSummary?.noPlan));

    return {
      title: copy.operationalPulseTitle,
      description: copy.organizationPulseDescription,
      rings: [
        {
          id: "completion",
          label: copy.completionRate,
          value: percentage(completed, tasks),
          detail: `${completed.toLocaleString()} / ${tasks.toLocaleString()} ${copy.completedTasks}`,
          tone: "pink",
        },
        {
          id: "advisor-coverage",
          label: copy.advisorCoveragePulse,
          value: percentage(students - noAdvisor, students),
          detail: `${Math.max(0, students - noAdvisor).toLocaleString()} / ${students.toLocaleString()} ${copy.studentsMetric}`,
          tone: "violet",
        },
        {
          id: "reporting",
          label: copy.reportingPulse,
          value: percentage(students - noReport, students),
          detail: `${Math.max(0, students - noReport).toLocaleString()} / ${students.toLocaleString()} ${copy.studentsMetric}`,
          tone: "lilac",
        },
      ],
      signals: [
        { id: "tasks", label: copy.plannedTasks, value: tasks },
        { id: "completed", label: copy.completedTasks, value: completed },
        { id: "no-plan", label: copy.noPlanMetric, value: noPlan },
        { id: "no-report", label: copy.noReportMetric, value: noReport },
      ],
    };
  }

  if (data.context === "PLATFORM_ADMIN") {
    const organizations = count(data.organizations);
    const users = count(data.users);
    const enabledOrganizations = Math.min(
      organizations,
      count(data.signupOverview?.enabledOrganizations),
    );
    const lockedLogins = Math.min(users, count(data.auditSummary?.lockedLogins));
    const securityEvents = count(data.auditSummary?.events24h);
    const pendingAssignments = count(data.signupOverview?.pendingAssignments);
    const capacity = count(data.signupOverview?.remainingCapacity);

    return {
      title: copy.operationalPulseTitle,
      description: copy.platformPulseDescription,
      rings: [
        {
          id: "signup-readiness",
          label: copy.signupReadinessPulse,
          value: percentage(enabledOrganizations, organizations),
          detail: `${enabledOrganizations.toLocaleString()} / ${organizations.toLocaleString()} ${copy.organizationsMetric}`,
          tone: "pink",
        },
        {
          id: "account-security",
          label: copy.accountSecurityPulse,
          value: percentage(Math.max(0, users - lockedLogins), users),
          detail: `${Math.max(0, users - lockedLogins).toLocaleString()} / ${users.toLocaleString()} ${copy.usersMetric}`,
          tone: "violet",
        },
        {
          id: "assignment-readiness",
          label: copy.assignmentReadinessPulse,
          value: percentage(Math.max(0, users - pendingAssignments), users),
          detail: `${pendingAssignments.toLocaleString()} ${copy.pendingAssignmentsMetric}`,
          tone: "lilac",
        },
      ],
      signals: [
        { id: "open-orgs", label: copy.signupOrganizationsMetric, value: enabledOrganizations },
        { id: "capacity", label: copy.signupCapacityMetric, value: capacity },
        { id: "assignments", label: copy.pendingAssignmentsMetric, value: pendingAssignments },
        { id: "security", label: copy.securityEvents, value: securityEvents },
      ],
    };
  }

  return null;
}

export function DashboardOperationalPulse({ data }: { data: RoleDashboardData }) {
  const { language, profile } = useLocale();
  const copy = dashboardCopy[language];
  const pulse = operationalPulse(data, copy);
  if (!pulse) return null;

  const signalMax = Math.max(1, ...pulse.signals.map((signal) => signal.value));
  return (
    <Card
      className="relative overflow-hidden border-[#632477] bg-[#18001f] p-0 text-[#fff4ff] shadow-[0_20px_45px_rgba(61,0,79,0.24)] dark:border-[#7a338e]"
      aria-labelledby="dashboard-operational-pulse-title"
    >
      <div className="pointer-events-none absolute -end-24 -top-24 size-64 rounded-full bg-[#8b5cff]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 start-1/3 size-72 rounded-full bg-[#ff4fd8]/15 blur-3xl" />
      <div className="relative grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="min-w-0" aria-labelledby="dashboard-operational-pulse-title">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#ff8bea]/50 bg-[#ff4fd8]/15 text-[#ff9bed]">
              <Activity size={18} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="dashboard-operational-pulse-title"
                className="text-base font-black tracking-tight"
              >
                {pulse.title}
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-[#f2c7f8]/80">
                {pulse.description}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[minmax(8rem,1.2fr)_repeat(2,minmax(6rem,1fr))] gap-3 sm:gap-5">
            {pulse.rings.map((ring, index) => (
              <PulseRingView
                key={ring.id}
                ring={ring}
                locale={profile.locale}
                featured={index === 0}
              />
            ))}
          </div>
        </section>

        <section
          className="min-w-0 rounded-xl border border-white/10 bg-[#2a0638]/80 p-4 backdrop-blur-sm"
          aria-labelledby="dashboard-operational-signals-title"
        >
          <div className="flex items-center gap-2">
            <CircleCheck size={16} className="text-[#ff9bed]" aria-hidden="true" />
            <h3
              id="dashboard-operational-signals-title"
              className="text-xs font-black tracking-wide text-[#fff4ff]"
            >
              {copy.operationalSignals}
            </h3>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[#f2c7f8]/70">
            {copy.operationalSignalsDescription}
          </p>
          <div
            className="mt-4 grid h-32 grid-cols-4 items-end gap-2"
            aria-label={copy.operationalSignals}
          >
            {pulse.signals.map((signal) => {
              const height = signal.value
                ? Math.max(12, Math.round((signal.value / signalMax) * 100))
                : 4;
              return (
                <div
                  key={signal.id}
                  className="grid h-full min-w-0 grid-rows-[1fr_auto] gap-2 text-center"
                >
                  <div className="flex min-h-0 items-end justify-center">
                    <div
                      className="w-full max-w-7 rounded-t-full bg-gradient-to-t from-[#8b5cff] via-[#d73bdf] to-[#ff9bed] shadow-[0_0_16px_rgba(255,79,216,0.48)] motion-reduce:transition-none"
                      style={{ blockSize: `${height}%` }}
                      title={`${signal.label}: ${signal.value.toLocaleString(profile.locale)}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-xs tabular-nums text-white">
                      {signal.value.toLocaleString(profile.locale)}
                    </strong>
                    <span
                      className="mt-0.5 block truncate text-[10px] text-[#efc8f4]/75"
                      title={signal.label}
                    >
                      {signal.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11px] text-[#e7b6ef]/80">
            <ShieldCheck size={14} className="shrink-0 text-[#d9a6ff]" aria-hidden="true" />
            {copy.operationalPulseDataNote}
          </div>
        </section>
      </div>
    </Card>
  );
}

function PulseRingView({
  ring,
  locale,
  featured,
}: {
  ring: PulseRing;
  locale: string;
  featured: boolean;
}) {
  const radius = featured ? 41 : 32;
  const circumference = 2 * Math.PI * radius;
  const value = Math.min(100, Math.max(0, ring.value));
  const tones = {
    pink: { stroke: "#ff4fd8", glow: "drop-shadow(0 0 7px rgba(255,79,216,.72))" },
    violet: { stroke: "#8b5cff", glow: "drop-shadow(0 0 7px rgba(139,92,255,.7))" },
    lilac: { stroke: "#d99cff", glow: "drop-shadow(0 0 7px rgba(217,156,255,.65))" },
  } as const;
  const tone = tones[ring.tone];
  const size = featured ? 116 : 92;
  const center = size / 2;

  return (
    <div className="min-w-0 text-center">
      <div
        className="relative mx-auto grid place-items-center"
        style={{ inlineSize: size, blockSize: size }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#6b1f7c"
            strokeWidth={featured ? 9 : 7}
            opacity="0.72"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeLinecap="round"
            strokeWidth={featured ? 9 : 7}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
            style={{ filter: tone.glow }}
          />
        </svg>
        <strong
          className={
            featured ? "text-2xl font-black tabular-nums" : "text-lg font-black tabular-nums"
          }
        >
          {value.toLocaleString(locale)}%
        </strong>
      </div>
      <p className="mt-2 text-xs font-bold text-white">{ring.label}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#e9b8f0]/75">{ring.detail}</p>
    </div>
  );
}
