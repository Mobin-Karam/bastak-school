import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getSchoolOccupancy } from "../../../student-life/exit-permissions/api/exit-permissions.api.ts";
import { useAuth } from "../../../identity/auth";
import { api } from "../../../../shared/api/api";

/**
 * Live, server-authoritative school occupancy. It deliberately does not render
 * for teachers or students: the API capability is the source of truth.
 */
export function SchoolOccupancyBanner() {
  const auth = useAuth();
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id;
  const enabled = auth.can("school.occupancy.read") && Boolean(organizationId);
  const occupancy = useQuery({
    queryKey: ["school", "occupancy", organizationId],
    queryFn: () => getSchoolOccupancy(organizationId),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled) return;
    const events = api.openEvents((type, event) => {
      if (type !== "school.occupancy.updated" || event.organizationId !== organizationId) return;
      void client.invalidateQueries({ queryKey: ["school", "occupancy", organizationId] });
    });
    return () => events.close();
  }, [client, enabled, organizationId]);

  if (!enabled) return null;
  const summary = occupancy.data?.[0];

  return (
    <section aria-label="تعداد فعلی دانش‌آموزان در مدرسه" className="p-1 sm:p-2">
      <div className="grid" dir="rtl">
        <div className="grid grid-cols-3 sm:min-w-[25rem]">
          <OccupancyMetric
            label="داخل مدرسه"
            value={summary?.currentlyInSchool ?? 0}
            tone="emerald"
          />
          <OccupancyMetric label="خارج از مدرسه" value={summary?.currentlyOut ?? 0} tone="amber" />
          <OccupancyMetric label="کل دانش‌آموزان" value={summary?.totalStudents ?? 0} tone="sky" />
        </div>
      </div>
    </section>
  );
}

function OccupancyMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "sky";
}) {
  const tones = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-rose-600 dark:text-rose-400",
    sky: "text-amber-600 dark:text-amber-400",
  };
  const icons = { emerald: Building2, amber: LogOut, sky: UsersRound };
  const Icon = icons[tone];
  return (
    <Link
      to="/admin/exit-permissions"
      className={`min-w-0 px-3 py-3 text-center transition hover:opacity-75 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${tones[tone]}`}
      aria-label={`${label}: ${value.toLocaleString("fa-IR")} نفر؛ مشاهده مدیریت تردد`}
    >
      <Icon className="mx-auto mb-1" size={19} aria-hidden="true" />
      <b className="block text-2xl font-black leading-none tabular-nums sm:text-3xl">
        {value.toLocaleString("fa-IR")}
      </b>
      <span className="mt-1.5 block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </Link>
  );
}
