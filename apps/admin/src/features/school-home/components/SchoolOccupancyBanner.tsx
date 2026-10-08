import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getSchoolOccupancy } from "../../exit-permissions/api/exit-permissions.api";
import { useAuth } from "../../auth";
import { api } from "../../../shared/api/api";

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
    <section
      aria-label="تعداد فعلی دانش‌آموزان در مدرسه"
      className="relative isolate overflow-hidden rounded-[1.35rem] border border-emerald-200/70 bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_48%,#2dd4bf_100%)] p-4 text-white shadow-[0_16px_30px_-20px_rgba(15,118,110,0.9)] before:pointer-events-none before:absolute before:-left-16 before:-top-20 before:size-52 before:rounded-full before:bg-white/15 before:blur-2xl dark:border-teal-300/20 sm:p-5"
    >
      <div className="absolute inset-x-7 bottom-0 h-5 rounded-t-full bg-slate-950/10 blur-md" aria-hidden="true" />
      <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center" dir="rtl">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_10px_20px_-12px_rgba(0,0,0,.8)]">
            <UsersRound size={25} strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/85">حضور فعلی دانش‌آموزان</p>
            <p className="mt-0.5 text-xs text-white/75">
              {occupancy.isFetching ? "در حال همگام‌سازی با دروازه مدرسه…" : "بر پایه خروج و ورود تأییدشده"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-slate-950/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.16)] sm:min-w-[15.5rem]">
          <div>
            <b className="block text-3xl font-black leading-none tabular-nums sm:text-4xl">
              {(summary?.currentlyInSchool ?? 0).toLocaleString("fa-IR")}
            </b>
            <span className="mt-1 block text-xs text-white/80">نفر داخل مدرسه</span>
          </div>
          <div className="grid gap-1 text-left text-xs text-white/85">
            <span>کل: {(summary?.totalStudents ?? 0).toLocaleString("fa-IR")}</span>
            <span className="inline-flex items-center justify-end gap-1 text-amber-100">
              <DoorOpen size={14} aria-hidden="true" /> خارج: {(summary?.currentlyOut ?? 0).toLocaleString("fa-IR")}
            </span>
          </div>
        </div>

        <Link
          to="/admin/exit-permissions"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/35 bg-white/15 px-3 text-xs font-black text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:col-start-2"
        >
          <ShieldCheck size={16} aria-hidden="true" /> مدیریت تردد
        </Link>
      </div>
    </section>
  );
}
