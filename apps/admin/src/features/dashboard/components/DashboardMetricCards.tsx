import {
  CalendarCheck2,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button, Card, Badge } from "../../../shared/ui/ui";

import { fa } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";

import type { AdminDashboardSummary } from "../model/dashboard.types";

type Metric = {
  label: string;

  value: number;

  hint: string;

  icon: LucideIcon;

  status: string;

  tone: "green" | "blue" | "amber" | "red";
};

const icons = {
  green: "bg-brand/10 text-brand",

  blue: "bg-blue-500/10 text-blue-600",

  amber: "bg-amber-500/10 text-amber-600",

  red: "bg-rose-500/10 text-rose-600",
};

export function DashboardMetricCards({
  summary,
  refreshing,
  onRefresh,
}: {
  summary: AdminDashboardSummary;
  refreshing?: boolean;
  onRefresh: () => void;
}) {
  const { language } = useLocale();
  const copy = dashboardCopy[language];
  const metrics: Metric[] = [
    {
      label: copy.activeStudents,
      value: summary.students,
      hint: copy.activeAccounts,
      icon: UsersRound,
      status: copy.active,
      tone: "green",
    },

    {
      label: copy.todayPlans,
      value: summary.todayPlans,
      hint: copy.readyPlans,
      icon: CalendarCheck2,
      status: copy.today,
      tone: "blue",
    },

    {
      label: copy.todayReports,
      value: summary.todayReports,
      hint: copy.submittedReports,
      icon: ClipboardCheck,
      status: copy.received,
      tone: "amber",
    },

    {
      label: copy.upcomingExams,
      value: summary.upcomingExams,
      hint: copy.futureExams,
      icon: GraduationCap,
      status: copy.pending,
      tone: "red",
    },
  ];

  return (
    <div
      className="
grid
gap-4

sm:grid-cols-2

xl:grid-cols-[160px_repeat(4,minmax(0,1fr))]

"
    >
      <Card
        className="
flex
items-center
justify-center
"
      >
        <Button
          variant="soft"
          loading={refreshing}
          onClick={onRefresh}
          className="
          h-9
          px-3
"
        >
          <RefreshCw size={17} />
          {copy.refresh}
        </Button>
      </Card>

      {metrics.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="group p-3 hover:border-brand/30 hover:shadow-sm">
            <div
              className="
flex
items-start
justify-between
"
            >
              <div>
                <p
                  className="
text-xs
font-semibold
text-slate-500
dark:text-slate-400
"
                >
                  {item.label}
                </p>

                <strong
                  className="
mt-3
block

                  text-3xl

                  font-bold

tracking-tight

text-[rgb(var(--color-ink))]

"
                >
                  {fa(item.value)}
                </strong>
              </div>

              <div
                className={`
grid
              size-9
              place-items-center
              rounded-md

transition

group-hover:scale-110

${icons[item.tone]}

`}
              >
                <Icon size={18} />
              </div>
            </div>

            <div
              className="
              mt-3
flex
items-center
justify-between
"
            >
              <p
                className="
text-[11px]
text-slate-400
"
              >
                {item.hint}
              </p>

              <Badge tone={item.tone}>● {item.status}</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
