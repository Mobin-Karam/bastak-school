import { Clock3, LogOut, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const key = `bastak-school:coming-soon:${auth.context?.user.id ?? auth.user?.id ?? "account"}:${auth.activeRole ?? "role"}`;
  const target = useMemo(() => {
    const stored = Number(localStorage.getItem(key));
    if (Number.isFinite(stored) && stored > Date.now()) return stored;
    const next = Date.now() + 10 * 24 * 60 * 60 * 1000;
    localStorage.setItem(key, String(next));
    return next;
  }, [key]);
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, target - Date.now()));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [target]);
  const time = {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
  };

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
              {isEnglish ? "This workspace is coming soon" : "حساب کاربری شما به‌زودی فعال می‌شود"}
            </DialogTitle>
            <DialogDescription
              id="unsupported-role-description"
              className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"
            >
              {isEnglish ? (
                <>
                  This workspace is still being prepared for your role. Your{" "}
                  <strong className="font-black text-ink">{role}</strong> account remains secure.
                </>
              ) : (
                <>
                  حساب <strong className="font-black text-ink">{role}</strong> شما ثبت و محفوظ است.
                  برای تکمیل فضای کاری این نقش کمی زمان لازم داریم؛ بابت تأخیر پوزش می‌خواهیم.
                </>
              )}
            </DialogDescription>
          </div>

          <section className="mt-5 grid grid-cols-4 gap-2" aria-label={isEnglish ? "Time remaining" : "زمان باقی‌مانده"} role="status">
            {([
              ["days", isEnglish ? "Days" : "روز"],
              ["hours", isEnglish ? "Hours" : "ساعت"],
              ["minutes", isEnglish ? "Minutes" : "دقیقه"],
              ["seconds", isEnglish ? "Seconds" : "ثانیه"],
            ] as const).map(([unit, label]) => (
              <div key={unit} className="rounded-2xl border border-brand/15 bg-brand/5 px-1 py-3 text-center">
                <strong className="block text-xl font-black tabular-nums text-ink" dir="ltr">{String(time[unit]).padStart(2, "0")}</strong>
                <span className="mt-1 block text-[11px] font-bold text-slate-500">{label}</span>
              </div>
            ))}
          </section>

          <div className="mt-5 rounded-2xl bg-[rgb(var(--surface-muted))] p-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2 font-bold text-ink">
              <Sparkles size={16} className="text-brand" aria-hidden="true" />
              {isEnglish ? "Your access is preserved." : "دسترسی شما حفظ شده است."}
            </span>
            <p className="mt-1">
              {isEnglish
                ? "Please sign in again with this same mobile number when the countdown ends."
                : "پس از پایان شمارش، با همین شماره همراه دوباره وارد شوید."}
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
