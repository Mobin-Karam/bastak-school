import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, ChevronDown, CircleSlash2, Clock3, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import { Badge, Button, Card, ErrorState, LoadingState } from "../../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { useLocale } from "../../../../shared/ui/locale";
import { getAttendanceEncouragement } from "../api/attendance-operations.api";
import { StudentAttendanceWorkspace } from "../components/StudentAttendanceWorkspace";
import { StudentAttendanceHistoryList } from "../components/StudentAttendanceHistoryList";

/** Student accounts see encouragement and scoped tasks; detailed profiles belong to staff. */
export function MyAttendancePage() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [section, setSection] = useState<"lessons" | "dorm">("lessons");
  const scope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const query = useQuery({
    queryKey: ["attendance-encouragement", scope],
    queryFn: getAttendanceEncouragement,
    refetchInterval: 60000,
  });
  return (
    <section className="grid gap-5 pb-[calc(5rem+env(safe-area-inset-bottom))]" dir="rtl">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="خلاصه حضور من"
        description="وضعیت حضور، سابقه جلسات و کارهای حضوری شما در یک نگاه."
      />
      {query.isLoading ? (
        <LoadingState label="در حال دریافت خلاصه حضور…" />
      ) : query.isError ? (
        <ErrorState
          title="خلاصه حضور دریافت نشد."
          action={
            <button type="button" onClick={() => void query.refetch()}>
              تلاش دوباره
            </button>
          }
        />
      ) : query.data ? (
        <Card className="overflow-hidden rounded-3xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"><CalendarCheck2 size={23} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-200">وضعیت کلی حضور</p>
              <p className="mt-1 text-sm font-bold leading-6 text-ink">{query.data.message}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{query.data.totalSessions.toLocaleString("fa-IR")} جلسه ثبت‌شده{query.data.attendanceRate !== null ? ` · ${query.data.attendanceRate.toLocaleString("fa-IR")}٪ حضور` : ""}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ["حاضر", query.data.present, CalendarCheck2],
              ["غایب", query.data.absent, X],
              ["تأخیر", query.data.late, Clock3],
              ["موجه", query.data.excused, CircleSlash2],
            ] as const).map(([label, count, Icon]) => (
              <div key={String(label)} className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/80">
                <dt className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300"><Icon size={14} aria-hidden="true" />{label}</dt>
                <dd className="mt-1 text-2xl font-black tabular-nums text-ink">{Number(count).toLocaleString("fa-IR")}</dd>
              </div>
            ))}
          </dl>
          <Button variant="ghost" className="mt-3 min-h-11 w-full justify-between" onClick={() => setSummaryOpen(true)}><span>راهنمای وضعیت‌ها و آخرین ثبت</span><ChevronDown size={17} aria-hidden="true" /></Button>
        </Card>
      ) : null}
      <div role="tablist" aria-label="بخش‌های حضور و غیاب" className="grid grid-cols-2 gap-2 rounded-2xl bg-[rgb(var(--surface-muted))] p-1">
        {([["lessons", "حضور کلاس‌ها"], ["dorm", "خوابگاه و فراخوان"]] as const).map(([key, label]) => <button key={key} id={`attendance-tab-${key}`} type="button" role="tab" aria-selected={section === key} aria-controls={`attendance-panel-${key}`} onClick={() => setSection(key)} className={`min-h-11 rounded-xl px-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${section === key ? "bg-[rgb(var(--surface-card))] text-ink shadow-sm" : "text-slate-600 dark:text-slate-300"}`}>{label}</button>)}
      </div>
      {section === "lessons" ? <section id="attendance-panel-lessons" role="tabpanel" aria-labelledby="attendance-tab-lessons"><Card id="student-attendance-history" className="scroll-mt-4 rounded-3xl p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="font-black text-ink">تاریخچه حضور کلاس‌ها</h2><p className="mt-1 text-xs text-slate-500">جلسه‌ها را بر اساس تاریخ یا وضعیت پیدا کنید.</p></div><Badge tone="blue">شخصی</Badge></div><StudentAttendanceHistoryList scope={scope} /></Card></section> : <section id="attendance-panel-dorm" role="tabpanel" aria-labelledby="attendance-tab-dorm"><div className="mb-3 space-y-1 px-1"><h2 className="text-sm font-black text-ink">حضور خوابگاه و فراخوان‌ها</h2><p className="text-xs leading-5 text-slate-500">مسئولیت اتاق و فراخوان فعال را جدا از سابقه کلاس‌ها پیگیری کنید.</p></div><StudentAttendanceWorkspace key={scope} scope={scope} /></section>}
      <ResponsiveDrawer open={summaryOpen} onOpenChange={setSummaryOpen} title="خلاصه حضور" description="تعریف وضعیت‌های ثبت‌شده در پرونده حضور شما.">
        {query.data ? <div className="grid gap-3"><Card className="p-4"><p className="font-bold text-ink">{query.data.message}</p><p className="mt-2 text-sm text-slate-500">{query.data.totalSessions.toLocaleString("fa-IR")} جلسه ثبت‌شده · آخرین بروزرسانی {formatDate(new Date())}</p></Card>{[["حاضر", query.data.present, "در جلسه حضور داشته‌اید."], ["غایب", query.data.absent, "در جلسه غایب ثبت شده‌اید."], ["تأخیر", query.data.late, "با تأخیر در جلسه حاضر شده‌اید."], ["موجه", query.data.excused, "غیبت شما موجه ثبت شده است."]].map(([label, value, description]) => <Card key={String(label)} className="flex items-center justify-between gap-3 p-3"><div><strong className="text-sm text-ink">{label}</strong><p className="mt-1 text-xs text-slate-500">{description}</p></div><span className="text-xl font-black tabular-nums">{Number(value).toLocaleString("fa-IR")}</span></Card>)}</div> : null}
      </ResponsiveDrawer>
    </section>
  );
}
