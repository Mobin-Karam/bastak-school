import { CalendarDays, Clock3, MessageCircle, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import { getAccountProfile } from "../../../platform/settings/api/settings.api";
import { useQuery } from "@tanstack/react-query";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { Card } from "../../../../shared/ui/ui";

export function StudentProfilePage() {
  const auth = useAuth();
  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: getAccountProfile });
  const name =
    auth.user?.displayName || auth.user?.display_name || auth.user?.username || "دانش‌آموز";

  return (
    <section className="mx-auto grid w-full max-w-2xl gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="پروفایل من"
        description="اطلاعات نمایشی حساب خود را به‌روزرسانی کنید."
      />
      <Card className="flex items-center gap-3 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <UserRound size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-ink">{name}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {profile.isLoading
              ? "در حال دریافت شماره همراه…"
              : profile.data?.phoneNumber || "شماره همراه ثبت نشده"}
          </p>
        </div>
      </Card>
      <Link
        to="/admin/student-leave"
        className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 outline-none transition hover:border-brand/40 hover:bg-brand/[0.03] focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <CalendarDays size={21} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-ink">درخواست مرخصی</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            ثبت و پیگیری نتیجه درخواست مرخصی
          </span>
        </span>
      </Link>
      <Card className="relative overflow-hidden p-4" aria-labelledby="student-chat-coming-soon">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-brand/[0.05] backdrop-blur-[1px]"
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <MessageCircle size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="student-chat-coming-soon" className="text-sm font-black text-ink">
              گفت‌وگوی مدرسه
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              پیام‌رسانی دانش‌آموز به‌زودی از همین بخش فعال می‌شود.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <Clock3 size={12} aria-hidden="true" /> به‌زودی
          </span>
        </div>
      </Card>
    </section>
  );
}
