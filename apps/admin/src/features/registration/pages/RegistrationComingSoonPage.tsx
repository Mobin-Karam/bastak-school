import { ArrowLeft, BellRing, CalendarClock, FileText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Capability-gated destination while the school-wide registration workflow is
 * being prepared. It deliberately does not fetch or mutate registration data.
 */
export function RegistrationComingSoonPage() {
  return (
    <section
      className="relative grid min-h-[min(34rem,calc(100dvh-10rem))] place-items-center overflow-hidden rounded-3xl border border-brand/15 bg-[rgb(var(--surface-card))] p-4 sm:p-6"
      aria-labelledby="registration-coming-soon-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--color-brand)_/_16%),transparent_46%),linear-gradient(145deg,rgb(var(--color-brand)_/_5%),transparent_55%,rgb(251_191_36_/_10%))]"
      />
      <div className="relative grid w-full max-w-md justify-items-center gap-5 text-center">
        <span className="grid size-[4.5rem] place-items-center rounded-[1.5rem] border border-white/50 bg-brand text-white shadow-[0_18px_36px_rgb(var(--color-brand)_/_30%)] dark:border-white/10">
          <CalendarClock size={32} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black tracking-wide text-brand">به‌زودی در زانین</p>
          <h1 id="registration-coming-soon-title" className="mt-1.5 text-2xl font-black tracking-tight text-ink">
            ثبت‌نام و پرونده
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-300">
            تکمیل، پیگیری و مدیریت پرونده‌های ثبت‌نام در نسخه بعدی فعال می‌شود.
            دسترسی نقش شما برای زمان انتشار، حفظ شده است.
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
