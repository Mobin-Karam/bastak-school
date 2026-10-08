import { Clock3, LogOut, Sparkles } from "lucide-react";
import { roleLabel } from "../../../shared/lib/role-ui";
import { Button } from "../../../shared/ui/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../../shared/ui/dialog";
import { useAuth } from "../hooks/useAuth";

/** Blocks unreleased role workspaces immediately after a successful sign-in. */
export function UnsupportedRoleModal() {
  const auth = useAuth();
  const role = roleLabel(auth.activeRole);

  return (
    <div className="grid min-h-dvh place-items-center bg-paper p-4" dir="rtl">
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
            <p className="mt-4 text-xs font-bold text-brand">به‌زودی</p>
            <DialogTitle className="mt-1 text-xl font-black text-ink">
              نسخه نقش شما در راه است
            </DialogTitle>
            <DialogDescription
              id="unsupported-role-description"
              className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"
            >
              پنل اختصاصی <strong className="font-black text-ink">{role}</strong> در نسخه بعدی زانین
              فعال می‌شود. بابت این تأخیر پوزش می‌خواهیم.
            </DialogDescription>
          </div>

          <div className="mt-5 rounded-2xl bg-[rgb(var(--surface-muted))] p-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2 font-bold text-ink">
              <Sparkles size={16} className="text-brand" aria-hidden="true" />
              دسترسی شما حفظ شده است.
            </span>
            <p className="mt-1">پس از انتشار نسخه جدید، از همین حساب وارد شوید.</p>
          </div>

          <Button
            className="mt-5 w-full"
            loading={auth.status === "logging-out"}
            onClick={() => void auth.logout()}
          >
            <LogOut size={17} aria-hidden="true" />
            خروج از حساب
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
