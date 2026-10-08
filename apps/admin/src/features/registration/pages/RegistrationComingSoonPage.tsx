import { Clock3, FileText, ShieldCheck } from "lucide-react";

/**
 * Capability-gated destination while the school-wide registration workflow is
 * being prepared. It deliberately does not fetch or mutate registration data.
 */
export function RegistrationComingSoonPage() {
  return (
    <section
      className="relative grid min-h-[calc(100dvh-12rem)] place-items-center overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-5"
      aria-labelledby="registration-coming-soon-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-bl from-brand/10 via-transparent to-amber-100/50 dark:to-amber-950/20"
      />
      <div className="relative grid max-w-sm justify-items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand text-white shadow-[0_16px_32px_rgb(var(--color-brand)_/_28%)]">
          <Clock3 size={30} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold text-brand">به‌زودی</p>
          <h1 id="registration-coming-soon-title" className="mt-1 text-xl font-black text-ink">
            ثبت‌نام و پرونده
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            تکمیل، پیگیری و مدیریت پرونده‌های ثبت‌نام از همین بخش فعال می‌شود.
          </p>
        </div>
        <div className="grid w-full gap-2 text-right text-xs leading-5 text-slate-600 dark:text-slate-300">
          <p className="flex items-center gap-2 rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-2">
            <FileText size={16} className="shrink-0 text-brand" aria-hidden="true" />
            دسترسی شما برای زمان فعال‌شدن این بخش حفظ شده است.
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
            تا آن زمان هیچ پرونده‌ای از این صفحه تغییر نمی‌کند.
          </p>
        </div>
      </div>
    </section>
  );
}
