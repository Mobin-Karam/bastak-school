import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  Info,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { Card } from "../../../../../shared/ui/ui";
import { useLocale } from "../../../../../shared/ui/locale";
import { dashboardCopy } from "../../model/dashboard-copy";
import type { RoleDashboardData } from "../../model/dashboard.types";

/* =========================================================
   TYPES
   ========================================================= */

type PulseTone = "green" | "blue" | "amber";

type PulseRing = {
  id: string;
  label: string;
  value: number;
  detail: string;
  tone: PulseTone;
};

type SignalTone = "good" | "warning" | "danger" | "neutral";

type PulseSignal = {
  id: string;
  label: string;
  value: number;
  tone?: SignalTone;
};

export type OperationalPulse = {
  title: string;
  description: string;
  rings: PulseRing[];
  signals: PulseSignal[];
};

/* =========================================================
   HELPERS
   ========================================================= */

const count = (value: unknown) => Math.max(0, Number(value) || 0);

const percentage = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

function getHealthStatus(value: number) {
  if (value >= 85) {
    return {
      label: "عالی",
      description: "وضعیت عملیاتی پایدار است",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      dotClassName: "bg-emerald-500",
    };
  }

  if (value >= 60) {
    return {
      label: "نیاز به توجه",
      description: "برخی بخش‌ها نیاز به بررسی دارند",
      icon: Info,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    label: "نیاز به اقدام",
    description: "موارد مهمی نیاز به رسیدگی دارند",
    icon: AlertTriangle,
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  };
}

/* =========================================================
   DATA ADAPTER
   ========================================================= */

export function operationalPulse(
  data: RoleDashboardData,
  copy: Record<string, string>,
): OperationalPulse | null {
  /* -------------------------------------------------------
     ORGANIZATION ADMIN
     ------------------------------------------------------- */

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
          detail: `${completed.toLocaleString()} / ${tasks.toLocaleString()} ${
            copy.completedTasks
          }`,
          tone: "green",
        },

        {
          id: "advisor-coverage",
          label: copy.advisorCoveragePulse,
          value: percentage(students - noAdvisor, students),
          detail: `${Math.max(
            0,
            students - noAdvisor,
          ).toLocaleString()} / ${students.toLocaleString()} ${copy.studentsMetric}`,
          tone: "blue",
        },

        {
          id: "reporting",
          label: copy.reportingPulse,
          value: percentage(students - noReport, students),
          detail: `${Math.max(
            0,
            students - noReport,
          ).toLocaleString()} / ${students.toLocaleString()} ${copy.studentsMetric}`,
          tone: "amber",
        },
      ],

      signals: [
        {
          id: "tasks",
          label: copy.plannedTasks,
          value: tasks,
          tone: "neutral",
        },

        {
          id: "completed",
          label: copy.completedTasks,
          value: completed,
          tone: "good",
        },

        {
          id: "no-plan",
          label: copy.noPlanMetric,
          value: noPlan,
          tone: noPlan > 0 ? "warning" : "good",
        },

        {
          id: "no-report",
          label: copy.noReportMetric,
          value: noReport,
          tone: noReport > 0 ? "danger" : "good",
        },
      ],
    };
  }

  /* -------------------------------------------------------
     PLATFORM ADMIN
     ------------------------------------------------------- */

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
          detail: `${enabledOrganizations.toLocaleString()} / ${organizations.toLocaleString()} ${
            copy.organizationsMetric
          }`,
          tone: "green",
        },

        {
          id: "account-security",
          label: copy.accountSecurityPulse,
          value: percentage(Math.max(0, users - lockedLogins), users),
          detail: `${Math.max(
            0,
            users - lockedLogins,
          ).toLocaleString()} / ${users.toLocaleString()} ${copy.usersMetric}`,
          tone: "blue",
        },

        {
          id: "assignment-readiness",
          label: copy.assignmentReadinessPulse,
          value: percentage(Math.max(0, users - pendingAssignments), users),
          detail: `${pendingAssignments.toLocaleString()} ${copy.pendingAssignmentsMetric}`,
          tone: "amber",
        },
      ],

      signals: [
        {
          id: "open-orgs",
          label: copy.signupOrganizationsMetric,
          value: enabledOrganizations,
          tone: "good",
        },

        {
          id: "capacity",
          label: copy.signupCapacityMetric,
          value: capacity,
          tone: capacity > 0 ? "good" : "warning",
        },

        {
          id: "assignments",
          label: copy.pendingAssignmentsMetric,
          value: pendingAssignments,
          tone: pendingAssignments > 0 ? "warning" : "good",
        },

        {
          id: "security",
          label: copy.securityEvents,
          value: securityEvents,
          tone: securityEvents > 0 ? "danger" : "good",
        },
      ],
    };
  }

  return null;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export function DashboardOperationalPulse({ data }: { data: RoleDashboardData }) {
  const { language, profile } = useLocale();

  const copy = dashboardCopy[language];

  const pulse = operationalPulse(data, copy);

  if (!pulse) return null;

  const averageHealth = Math.round(
    pulse.rings.reduce((total, ring) => total + ring.value, 0) / Math.max(1, pulse.rings.length),
  );

  const health = getHealthStatus(averageHealth);

  const HealthIcon = health.icon;

  return (
    <Card
      className="
        relative overflow-hidden
        border-[rgb(var(--border-subtle))]
        bg-[rgb(var(--surface-card))]
        p-0
      "
      aria-labelledby="dashboard-operational-pulse-title"
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header
        className="
          flex items-start justify-between gap-3
          border-b border-[rgb(var(--border-subtle))]
          px-3 py-3
          sm:px-4
        "
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="
              grid size-9 shrink-0
              place-items-center
              rounded-lg
              bg-brand/10
              text-brand
            "
          >
            <Activity size={17} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h2
              id="dashboard-operational-pulse-title"
              className="
                truncate
                text-sm font-black
                tracking-tight text-ink
              "
            >
              {pulse.title}
            </h2>

            <p
              className="
                mt-0.5
                hidden max-w-2xl
                text-[11px] leading-5
                text-slate-500
                dark:text-slate-400
                sm:block
              "
            >
              {pulse.description}
            </p>
          </div>
        </div>

        {/* Overall status */}
        <div
          className={`
            inline-flex shrink-0
            items-center gap-1.5
            rounded-full
            px-2 py-1
            text-[10px] font-bold
            ${health.className}
          `}
          title={health.description}
        >
          <span
            className={`
              size-1.5 rounded-full
              ${health.dotClassName}
            `}
          />

          <span>{health.label}</span>
        </div>
      </header>

      {/* =====================================================
          BODY
          ===================================================== */}

      <div
        className="
          grid min-w-0 gap-4
          p-3
          sm:p-4
          lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]
        "
      >
        {/* ===================================================
            HEALTH / RINGS
            =================================================== */}

        <section className="min-w-0" aria-label={pulse.title}>
          {/* Overall health */}
          <div
            className="
              mb-3 flex
              items-center justify-between gap-3
              rounded-lg
              bg-[rgb(var(--surface-muted))]
              px-3 py-2.5
            "
          >
            <div className="flex min-w-0 items-center gap-2">
              <HealthIcon
                size={16}
                className={
                  averageHealth >= 85
                    ? "text-emerald-600"
                    : averageHealth >= 60
                      ? "text-amber-600"
                      : "text-rose-600"
                }
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-[11px] font-bold text-ink">وضعیت کلی</p>

                <p
                  className="
                    truncate text-[10px]
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {health.description}
                </p>
              </div>
            </div>

            <strong
              className="
                shrink-0 text-lg
                font-black tabular-nums
                text-ink
              "
            >
              {averageHealth.toLocaleString(profile.locale)}%
            </strong>
          </div>

          {/* Mobile = horizontal scroll
              Tablet/Desktop = grid */}
          <div
            className="
              -mx-3 flex
              snap-x snap-mandatory
              gap-2
              overflow-x-auto
              px-3 pb-1
              overscroll-x-contain

              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden

              sm:mx-0
              sm:grid
              sm:grid-cols-3
              sm:overflow-visible
              sm:px-0
              sm:pb-0
            "
          >
            {pulse.rings.map((ring) => (
              <PulseRingView key={ring.id} ring={ring} locale={profile.locale} />
            ))}
          </div>
        </section>

        {/* ===================================================
            SIGNALS
            =================================================== */}

        <section
          className="
            min-w-0
            rounded-xl
            border border-[rgb(var(--border-subtle))]
            bg-[rgb(var(--surface-muted))]/45
            p-3
          "
          aria-labelledby="dashboard-operational-signals-title"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CircleCheck size={15} className="shrink-0 text-brand" aria-hidden="true" />

              <h3
                id="dashboard-operational-signals-title"
                className="
                  truncate
                  text-xs font-black
                  text-ink
                "
              >
                {copy.operationalSignals}
              </h3>
            </div>

            <TrendingUp
              size={15}
              className="
                shrink-0
                text-slate-400
              "
              aria-hidden="true"
            />
          </div>

          <p
            className="
              mt-1 hidden
              text-[10px] leading-4
              text-slate-500
              dark:text-slate-400
              sm:block
            "
          >
            {copy.operationalSignalsDescription}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {pulse.signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} locale={profile.locale} />
            ))}
          </div>

          {/* Data note */}
          <div
            className="
              mt-3 flex
              items-start gap-1.5
              border-t
              border-[rgb(var(--border-subtle))]
              pt-2.5
              text-[10px] leading-4
              text-slate-500
              dark:text-slate-400
            "
          >
            <ShieldCheck
              size={13}
              className="
                mt-0.5 shrink-0
                text-brand
              "
              aria-hidden="true"
            />

            <span>{copy.operationalPulseDataNote}</span>
          </div>
        </section>
      </div>
    </Card>
  );
}

/* =========================================================
   PULSE RING
   ========================================================= */

function PulseRingView({ ring, locale }: { ring: PulseRing; locale: string }) {
  const value = clampPercentage(ring.value);

  const radius = 34;
  const size = 86;

  const circumference = 2 * Math.PI * radius;

  const center = size / 2;

  const tones = {
    green: {
      stroke: "rgb(16 185 129)",
      text: "text-emerald-700 dark:text-emerald-300",
      background: "bg-emerald-500/5",
    },

    blue: {
      stroke: "rgb(14 165 233)",
      text: "text-sky-700 dark:text-sky-300",
      background: "bg-sky-500/5",
    },

    amber: {
      stroke: "rgb(245 158 11)",
      text: "text-amber-700 dark:text-amber-300",
      background: "bg-amber-500/5",
    },
  } as const;

  const tone = tones[ring.tone];

  return (
    <article
      className={`
        w-[138px] min-w-[138px]
        shrink-0 snap-start
        rounded-xl
        border border-[rgb(var(--border-subtle))]
        p-3
        text-center

        sm:w-auto
        sm:min-w-0
        sm:shrink

        ${tone.background}
      `}
    >
      <div
        className="
          relative mx-auto
          grid place-items-center
        "
        style={{
          inlineSize: size,
          blockSize: size,
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="
            absolute inset-0
            -rotate-90
          "
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgb(var(--border-subtle))"
            strokeWidth={7}
          />

          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeLinecap="round"
            strokeWidth={7}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
            className="
              transition-[stroke-dashoffset]
              duration-500
              motion-reduce:transition-none
            "
          />
        </svg>

        <strong
          className={`
            text-lg font-black
            tabular-nums
            ${tone.text}
          `}
        >
          {value.toLocaleString(locale)}%
        </strong>
      </div>

      <p
        className="
          mt-1 truncate
          text-[11px] font-bold
          text-ink
        "
        title={ring.label}
      >
        {ring.label}
      </p>

      <p
        className="
          mt-0.5
          line-clamp-2
          min-h-8
          text-[10px] leading-4
          text-slate-500
          dark:text-slate-400
        "
      >
        {ring.detail}
      </p>

      {/* Accessible progress */}
      <div
        role="progressbar"
        aria-label={ring.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="sr-only"
      />
    </article>
  );
}

/* =========================================================
   SIGNAL CARD
   ========================================================= */

function SignalCard({ signal, locale }: { signal: PulseSignal; locale: string }) {
  const styles = {
    good: {
      dot: "bg-emerald-500",
      value: "text-emerald-700 dark:text-emerald-300",
    },

    warning: {
      dot: "bg-amber-500",
      value: "text-amber-700 dark:text-amber-300",
    },

    danger: {
      dot: "bg-rose-500",
      value: "text-rose-700 dark:text-rose-300",
    },

    neutral: {
      dot: "bg-sky-500",
      value: "text-sky-700 dark:text-sky-300",
    },
  } as const;

  const style = styles[signal.tone ?? "neutral"];

  return (
    <div
      className="
        min-w-0
        rounded-lg
        border border-[rgb(var(--border-subtle))]
        bg-[rgb(var(--surface-card))]
        px-2.5 py-2
      "
    >
      <div
        className="
          flex items-center
          justify-between gap-2
        "
      >
        <span
          className={`
            size-1.5 shrink-0
            rounded-full
            ${style.dot}
          `}
          aria-hidden="true"
        />

        <strong
          className={`
            text-base font-black
            tabular-nums
            ${style.value}
          `}
        >
          {signal.value.toLocaleString(locale)}
        </strong>
      </div>

      <p
        className="
          mt-1 truncate
          text-[10px] font-medium
          text-slate-500
          dark:text-slate-400
        "
        title={signal.label}
      >
        {signal.label}
      </p>
    </div>
  );
}
