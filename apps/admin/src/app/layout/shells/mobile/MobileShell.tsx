import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AdminShellModel } from "../../hooks/use-admin-shell-model";
import { AdminMobileBottomNav } from "../../navigation/mobile/AdminMobileNavigation";
import { BackButton, MobileHeader } from "../../../../shared/ui/mobile";

export function MobileShell({ model }: { model: AdminShellModel }) {
  const navigate = useNavigate();
  const isRoot = model.current.path === "";

  return (
    <>
      <MobileHeader
        title={model.current.title}
        start={
          isRoot ? undefined : (
            <BackButton
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate("/admin");
              }}
            />
          )
        }
        end={
          <img
            src="/logo-bastak.webp"
            width={88}
            height={32}
            alt="مدرسه دینی سلطان العلماء بستک"
            decoding="async"
            className="h-8 w-auto max-w-[5.5rem] object-contain"
          />
        }
        className="admin-mobile-masthead relative z-30 shrink-0 lg:hidden"
      />
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
