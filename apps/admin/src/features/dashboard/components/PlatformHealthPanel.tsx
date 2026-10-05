import { Database, ShieldCheck, ServerCog } from "lucide-react";
import { Badge, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";
import type { RoleDashboardData } from "../model/dashboard.types";

export function PlatformHealthPanel({ data }: { data: RoleDashboardData }) {
  const { language } = useLocale();
  const copy = dashboardCopy[language];
  const healthy = data.systemHealth?.database === "ok";
  const version = data.releaseStatus?.version || copy.unknownVersion;
  const environment = data.releaseStatus?.environment || copy.unknownEnvironment;

  return (
    <Card className="p-0" aria-labelledby="platform-health-title">
      <header className="border-b border-[rgb(var(--border-subtle))] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="platform-health-title" className="text-sm font-bold text-ink">
            {copy.platformHealthTitle}
          </h2>
          <Badge tone={healthy ? "green" : "amber"}>
            {healthy ? copy.healthy : copy.needsReview}
          </Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {copy.platformHealthDescription}
        </p>
      </header>
      <dl className="divide-y divide-[rgb(var(--border-subtle))]">
        <HealthRow
          icon={Database}
          label={copy.database}
          value={healthy ? copy.operational : copy.needsReview}
        />
        <HealthRow icon={ServerCog} label={copy.runningVersion} value={version} ltr />
        <HealthRow icon={ShieldCheck} label={copy.environment} value={environment} ltr />
      </dl>
    </Card>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
  ltr = false,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <Icon size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
      <dt className="min-w-0 flex-1 text-xs text-slate-600 dark:text-slate-300">{label}</dt>
      <dd
        className="max-w-[11rem] truncate text-end text-xs font-semibold text-ink"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
