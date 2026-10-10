import { AlertTriangle, Bell } from "lucide-react";
import type { AdminShellModel } from "./use-admin-shell-model";
import { AdminMobileBottomNav } from "../navigation/AdminMobileNavigation";

export function MobileShell({ model }: { model: AdminShellModel }) {
  return (
    <>
      <header className="admin-mobile-masthead relative z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-end justify-center overflow-hidden bg-paper pb-2 pt-[env(safe-area-inset-top)] lg:hidden">
        <div>
          <img
            src="/right-left-angel.png"
            width={136}
            height={46}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute end-[calc(50%+3.5rem)] bottom-1 h-9 w-[8.5rem] max-w-[31vw] object-contain object-right"
          />
          <img
            src="/logo-bastak.webp"
            width={120}
            height={40}
            alt="زانین"
            decoding="async"
            className="relative z-10 h-10 w-auto max-w-[min(10rem,65vw)] object-contain"
          />
          <img
            src="/right-left-angel.png"
            width={136}
            height={46}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute start-[calc(50%+3.5rem)] bottom-1 h-9 w-[8.5rem] max-w-[31vw] scale-x-[-1] object-contain object-right"
          />
        </div>
      </header>
      {model.auth.activeRole === "PLATFORM_ADMIN" ? (
        <section
          className="mx-3 mt-2 flex shrink-0 items-start gap-2 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-100"
          role="status"
          aria-label="هشدار استفاده از مدیریت پلتفرم در موبایل"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
          <p>
            مدیریت پلتفرم برای صفحه‌نمایش بزرگ طراحی شده است. می‌توانید ادامه دهید، اما جدول‌ها و
            ابزارهای مدیریتی کامل‌تر در دسکتاپ در دسترس‌اند.
          </p>
        </section>
      ) : null}
      <AdminMobileBottomNav
        current={model.current}
        selectedStudentId={model.selectedStudentId}
        performance={model.performance}
      />
    </>
  );
}
