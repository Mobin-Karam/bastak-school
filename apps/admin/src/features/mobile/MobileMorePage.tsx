import { Download, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { localizedNavigationForCapabilities } from "../../app/layout/navigation/admin-navigation";
import { openPWAInstall } from "../pwa";
import { useLocale } from "../../shared/ui/locale";

/** The mobile-only app hub; desktop continues to use the structured side rails. */
export function MobileMorePage() {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const groups = localizedNavigationForCapabilities(auth.capabilities, auth.activeRole, language);

  return (
    <section className="mx-auto grid max-w-xl gap-5 pb-4 lg:hidden" dir={profile.direction}>
      <section className="px-1 pt-1">
        <p className="text-xs font-bold text-brand">زانین</p>
        <h2 className="sr-only">بیشتر</h2>
        <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
          ابزارها و بخش‌هایی که با نقش فعلی شما در دسترس هستند.
        </p>
      </section>

      <div className="grid gap-4">
        {groups.map((group) => (
          <section key={group.section} aria-labelledby={`mobile-more-${group.section}`}>
            <h2
              id={`mobile-more-${group.section}`}
              className="mb-2 px-1 text-xs font-black text-slate-500 dark:text-slate-400"
            >
              {group.section}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map(({ path, title, description, icon: Icon }) => (
                <Link
                  key={path}
                  to={path ? `/admin/${path}` : "/admin"}
                  className="group flex min-h-28 flex-col rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 outline-none transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-brand/35 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.98]"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand transition duration-200 group-hover:bg-brand group-hover:text-white">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <strong className="mt-3 text-sm text-ink">{title}</strong>
                  <span className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                    {description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="grid gap-2 rounded-2xl border border-brand/15 bg-brand/5 p-3">
        <button
          type="button"
          onClick={openPWAInstall}
          className="flex min-h-12 items-center gap-3 rounded-xl px-2 text-start outline-none transition hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
            <Download size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm text-ink">نصب برنامه</strong>
            <span className="block text-[11px] text-slate-500">
              نصب یا مشاهده راهنمای Android و iPhone
            </span>
          </span>
        </button>
        <Link
          to="/admin/settings"
          className="flex min-h-12 items-center gap-3 rounded-xl px-2 outline-none transition hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-white text-brand shadow-sm dark:bg-slate-900">
            <Settings2 size={18} aria-hidden="true" />
          </span>
          <span className="text-sm font-bold text-ink">تنظیمات حساب و برنامه</span>
        </Link>
      </section>
    </section>
  );
}
