import { Bell, MessageSquare, RefreshCw, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { localizedNavigationForCapabilities } from "../../../app/layout/admin-navigation";
import { DashboardWorkspace } from "../../../shared/ui/dashboard-workspace";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { useAuth } from "../../auth";
import { DashboardWorkQueue } from "../components/DashboardWorkQueue";
import { useDashboardData } from "../hooks/useDashboardData";
import { dashboardCopy } from "../model/dashboard-copy";
import { useRoleDashboardView } from "../model/dashboard-layout";

type SectionKey = "ارتباط" | "مدیریت";

const sectionConfig = {
  ارتباط: {
    icon: MessageSquare,
    fa: {
      title: "میز کار ارتباط و پیگیری",
      description: "گفتگوها، اعلان‌ها، پایش زنده و مواردی که نیاز به پاسخ دارند.",
      tools: "ابزارهای ارتباط",
      work: "کارهای ارتباطی باز",
    },
    en: {
      title: "Communication and follow-up workspace",
      description: "Conversations, notifications, live monitoring, and work that needs a response.",
      tools: "Communication tools",
      work: "Open communication work",
    },
    workTypes: ["unread_chat", "sync_failure"] as const,
  },
  مدیریت: {
    icon: UsersRound,
    fa: {
      title: "میز کار افراد و دسترسی",
      description: "افراد، سازمان‌ها، مجوزها و کارهای باز را از یک نقطه مدیریت کنید.",
      tools: "ابزارهای مدیریت",
      work: "کارهای مدیریتی باز",
    },
    en: {
      title: "People and access workspace",
      description: "Manage people, organizations, permissions, and open work from one place.",
      tools: "Management tools",
      work: "Open management work",
    },
    workTypes: ["recovery", "task_issue", "retry_request", "inactive_user"] as const,
  },
} as const;

export function SectionDashboardPage({ section }: { section: SectionKey }) {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const dashboard = useDashboardData();
  const config = sectionConfig[section];
  const copy = config[language];
  const Icon = config.icon;
  const { view, setDensity } = useRoleDashboardView(`${auth.activeRole || "default"}:${section}`);
  const group = localizedNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  ).find((item) => item.sectionKey === section);
  const destinations = (group?.items ?? []).filter(
    (item) => item.path !== "communication" && item.path !== "management",
  );
  const workItems = dashboard.workItems.filter((item) =>
    (config.workTypes as readonly string[]).includes(item.type),
  );

  return (
    <DashboardWorkspace
      title={copy.title}
      description={copy.description}
      freshness={
        <span className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5 text-brand" aria-hidden="true" />
          {dashboard.summary.data?.generatedAt
            ? new Intl.DateTimeFormat(profile.locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(dashboard.summary.data.generatedAt))
            : null}
        </span>
      }
      density={view.density}
      onDensityChange={setDensity}
      densityLabels={{
        label: dashboardCopy[language].dashboardDensity,
        comfortable: dashboardCopy[language].comfortableDensity,
        compact: dashboardCopy[language].compactDensity,
      }}
      actions={
        <Button
          variant="soft"
          size="sm"
          loading={dashboard.refreshing}
          onClick={() => void dashboard.refresh()}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {dashboardCopy[language].refresh}
        </Button>
      }
      summary={
        <section aria-label={copy.tools} className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            icon={Icon}
            label={copy.tools}
            value={destinations.length}
            locale={profile.locale}
          />
          <MetricCard
            icon={Bell}
            label={copy.work}
            value={workItems.length}
            locale={profile.locale}
          />
        </section>
      }
      primary={
        <DashboardWorkQueue
          items={workItems}
          loading={dashboard.workQueue.isLoading}
          error={dashboard.workQueue.isError}
          onRetry={() => void dashboard.workQueue.refetch()}
        />
      }
      secondary={
        destinations.length ? (
          <Card className="p-3">
            <h2 className="text-sm font-bold text-ink">{copy.tools}</h2>
            <div className="mt-3 grid gap-1.5">
              {destinations.map((item) => {
                const DestinationIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={`/admin/${item.path}`}
                    className="group flex min-h-12 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[rgb(var(--surface-muted))] text-slate-600 group-hover:text-brand dark:text-slate-300">
                      <DestinationIcon size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.title}</span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        ) : (
          <EmptyState title={dashboardCopy[language].noAttention} />
        )
      }
    />
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  locale,
}: {
  icon: typeof Bell;
  label: string;
  value: number;
  locale: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <strong className="block text-xl font-black tabular-nums text-ink">
          {value.toLocaleString(locale)}
        </strong>
      </span>
    </Card>
  );
}
