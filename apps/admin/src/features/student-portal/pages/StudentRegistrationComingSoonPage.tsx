import { Clock3, ShieldAlert } from "lucide-react";

/** Reserved student-registration destination until the school enrollment workflow is released. */
export function StudentRegistrationComingSoonPage() {
  return (
    <section
      className="relative grid min-h-[calc(100dvh-12rem)] place-items-center overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-5"
      aria-labelledby="student-registration-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-amber-100/50 blur-2xl dark:to-amber-950/20"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-paper/45 backdrop-blur-sm" />
      <div className="relative z-10 grid max-w-sm justify-items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand text-white shadow-[0_16px_32px_rgb(var(--color-brand)_/_28%)]">
          <Clock3 size={30} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold text-brand">به‌زودی</p>
          <h2 id="student-registration-title" className="sr-only">
            ثبت‌نام و پرونده دانش‌آموز
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            تکمیل و پیگیری پرونده از همین صفحه در نسخه بعدی فعال می‌شود.
          </p>
        </div>
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert size={16} aria-hidden="true" />
          اطلاعات فعلی شما بدون تغییر باقی می‌ماند.
        </p>
      </div>
    </section>
  );
}
