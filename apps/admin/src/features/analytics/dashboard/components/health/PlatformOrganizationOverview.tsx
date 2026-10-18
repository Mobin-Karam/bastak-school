import { CalendarDays, GraduationCap, UsersRound, UserRoundCheck } from "lucide-react";

import type { RoleDashboardData } from "../../model/dashboard.types.ts";
import { OrganizationTag } from "../../../../../shared/ui/organization-tag";
import { Card, EmptyState } from "../../../../../shared/ui/ui";

export function PlatformOrganizationOverview({ data }: { data: RoleDashboardData }) {
  const organizations = data.platformOrganizations ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <header className="border-b border-[rgb(var(--border-subtle))] px-4 py-3">
        <h2 className="font-black">نمای سازمان‌های پلتفرم</h2>
        <p className="mt-1 text-xs text-slate-500">
          هر سطر یک محدوده داده مستقل است؛ شمارش‌ها فقط داده همان سازمان را نشان می‌دهند.
        </p>
      </header>
      {!organizations.length ? (
        <div className="p-4">
          <EmptyState title="هنوز سازمانی برای نمایش وجود ندارد." />
        </div>
      ) : (
        <ul className="divide-y divide-[rgb(var(--border-subtle))]">
          {organizations.map((organization) => (
            <li
              key={organization.id}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <OrganizationTag organization={organization} />
              <dl className="grid grid-cols-4 gap-2 text-center text-[11px] text-slate-500">
                <OrganizationStat icon={UsersRound} label="اعضا" value={organization.members} />
                <OrganizationStat
                  icon={GraduationCap}
                  label="دانش‌آموز"
                  value={organization.students}
                />
                <OrganizationStat
                  icon={UserRoundCheck}
                  label="کارکنان"
                  value={organization.staff}
                />
                <OrganizationStat
                  icon={CalendarDays}
                  label="برنامه"
                  value={organization.scheduleEntries}
                />
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function OrganizationStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <div>
      <dt className="flex items-center justify-center gap-1">
        <Icon size={13} aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-1 font-black tabular-nums text-ink">{value.toLocaleString("fa-IR")}</dd>
    </div>
  );
}
