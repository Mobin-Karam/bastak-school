import { Clock3, LogOut, Sparkles } from "lucide-react";
import { roleLabel } from "../../../shared/lib/role-ui";
import { Button } from "../../../shared/ui/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../../shared/ui/dialog";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { useAuth } from "../hooks/useAuth";

/** Blocks unreleased role workspaces immediately after a successful sign-in. */
export function UnsupportedRoleModal() {
  const auth = useAuth();
  const language = useOptionalAdminLanguage();
  const isEnglish = language === "en";
  const role = roleLabel(auth.activeRole, language);

  return (
    <div className="grid min-h-dvh place-items-center bg-paper p-4" dir={isEnglish ? "ltr" : "rtl"}>
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          aria-describedby="unsupported-role-description"
          className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-5 text-right shadow-[0_24px_70px_rgb(15_23_42_/_24%)] sm:p-6"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="grid justify-items-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Clock3 size={28} aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-bold text-brand">
              {isEnglish ? "Your account is being prepared" : "حساب شما به‌زودی آماده می‌شود"}
            </p>
            <DialogTitle className="mt-1 text-xl font-black text-ink">
              {isEnglish ? "This role is not available yet" : "این نقش هنوز در دسترس نیست"}
            </DialogTitle>
            <DialogDescription
              id="unsupported-role-description"
              className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"
            >
              {isEnglish ? (
                <>
                  At this stage, access is available only to the Principal, School Supervisor, and
                  Student roles. Your <strong className="font-black text-ink">{role}</strong>{" "}
                  account remains secure and will be usable here when its workspace is ready.
                </>
              ) : (
                <>
                  در این مرحله، دسترسی فقط برای مدیر، ناظم و دانش‌آموز فعال است. حساب
                  <strong className="font-black text-ink"> {role}</strong> شما محفوظ می‌ماند و پس از
                  آماده شدن نسخه مربوط، از همین‌جا قابل استفاده خواهد بود.
                </>
              )}
            </DialogDescription>
          </div>

          <div className="mt-5 rounded-2xl bg-[rgb(var(--surface-muted))] p-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2 font-bold text-ink">
              <Sparkles size={16} className="text-brand" aria-hidden="true" />
              {isEnglish ? "Your access is preserved." : "دسترسی شما حفظ شده است."}
            </span>
            <p className="mt-1">
              {isEnglish
                ? "Use this same mobile number when your role is ready."
                : "پس از آماده شدن نقش شما، با همین شماره همراه وارد شوید."}
            </p>
          </div>

          <Button
            className="mt-5 w-full"
            loading={auth.status === "logging-out"}
            onClick={() => void auth.logout()}
          >
            <LogOut size={17} aria-hidden="true" />
            {isEnglish ? "Sign out" : "خروج از حساب"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
