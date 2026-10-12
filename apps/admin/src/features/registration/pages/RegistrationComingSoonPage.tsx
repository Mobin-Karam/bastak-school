import { ArrowLeft, BellRing, CalendarClock, FileText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Capability-gated destination while the school-wide registration workflow is
 * being prepared. It deliberately does not fetch or mutate registration data.
 */
export function RegistrationComingSoonPage() {
  return (
    <section
      className="grid min-h-[min(28rem,calc(100dvh-10rem))] place-items-center rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 sm:p-6"
      aria-labelledby="registration-coming-soon-title"
    >
      <div className="grid w-full max-w-md justify-items-center gap-5 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand text-white">
          <CalendarClock size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black tracking-wide text-brand">به‌زودی در زانین</p>
          <h2 id="registration-coming-soon-title" className="sr-only">
            ثبت‌نام و پرونده
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-300">
            تکمیل، پیگیری و مدیریت پرونده‌های ثبت‌نام در نسخه بعدی فعال می‌شود. دسترسی نقش شما برای
            زمان انتشار، حفظ شده است.
          </p>
        </div>
        <div className="grid w-full gap-2 text-right text-xs leading-5 text-slate-600 dark:text-slate-300">
          <p className="flex items-start gap-2 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3.5 py-3">
            <FileText size={16} className="shrink-0 text-brand" aria-hidden="true" />
            این صفحه هیچ درخواست ثبت‌نامی ارسال نمی‌کند و هیچ پرونده‌ای را تغییر نمی‌دهد.
          </p>
          <p className="flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-3.5 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
            تا زمان انتشار، برای امور فوری با مدیریت مدرسه تماس بگیرید.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            to="/admin"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-[1.125rem] text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            بازگشت به خانه
          </Link>
          <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-500">
            <BellRing size={16} className="text-brand" aria-hidden="true" />
            اطلاع‌رسانی از طریق مدرسه
          </span>
        </div>
      </div>
    </section>
  );
}
