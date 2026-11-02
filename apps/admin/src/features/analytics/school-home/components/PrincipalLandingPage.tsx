import { Command, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../../../shared/ui/ui";

/**
 * A deliberately small first decision for Principals. Detailed operational
 * data remains on its own route, while search is delegated to the shared,
 * capability-aware shell command palette.
 */
export function PrincipalLandingPage() {
  return (
    <main className="mx-auto grid w-full max-w-4xl content-start gap-6 py-4" dir="rtl">
      <header className="grid gap-2">
        <p className="text-sm font-bold text-brand">میز کار مدیر مدرسه</p>
        <h1 className="text-2xl font-black text-ink sm:text-3xl">از کجا شروع می‌کنید؟</h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          نمای عملیاتی مدرسه را باز کنید یا مستقیماً به صفحه، دانش‌آموز و اقدام موردنظر بروید.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="شروع کار مدیر مدرسه">
        <Card className="group min-h-56 p-0">
          <Link
            to="/admin/dashboard/principal"
            className="flex h-full min-h-56 flex-col items-start justify-between rounded-[inherit] p-6 outline-none transition hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white shadow-sm">
              <LayoutDashboard aria-hidden="true" size={24} />
            </span>
            <span className="grid gap-2 text-right">
              <strong className="text-xl text-ink">رفتن به داشبورد</strong>
              <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                حضور و غیاب، درخواست‌ها و وضعیت عملیاتی امروز مدرسه
              </span>
            </span>
          </Link>
        </Card>

        <Card className="group min-h-56 p-0">
          <Link
            to="/admin?command=search"
            className="flex h-full min-h-56 flex-col items-start justify-between rounded-[inherit] p-6 outline-none transition hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[rgb(var(--surface-muted))] text-brand">
              <Command aria-hidden="true" size={24} />
            </span>
            <span className="grid gap-2 text-right">
              <strong className="text-xl text-ink">جست‌وجو در سامانه</strong>
              <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                صفحه‌ها، دانش‌آموزان، کاربران و اقدام‌های مجاز را جست‌وجو کنید
              </span>
            </span>
          </Link>
        </Card>
      </section>
    </main>
  );
}
