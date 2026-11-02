import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { roleLabel } from "../../../../shared/lib/role-ui";
import type { AccountContext } from "../../../../shared/types/domain";

const PENDING_ROLE_CHOICE = "bastak.role-choice.pending";

export function RoleChooserPrompt({
  authenticated,
  roles,
  activeRole,
  choose,
}: {
  authenticated: boolean;
  roles: AccountContext["roles"];
  activeRole: AccountContext["roles"][number] | null;
  choose: (role: AccountContext["roles"][number]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!authenticated || roles.length < 2 || sessionStorage.getItem(PENDING_ROLE_CHOICE) !== "1")
      return;
    sessionStorage.removeItem(PENDING_ROLE_CHOICE);
    setOpen(true);
  }, [authenticated, roles.length]);
  async function select(role: AccountContext["roles"][number]) {
    setBusy(true);
    try {
      await choose(role);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={() => undefined}
      title="نقش فعال خود را انتخاب کنید"
      description="امکانات سامانه بر اساس نقش انتخاب‌شده نمایش داده می‌شود. برای تغییر نقش بعداً به تنظیمات بروید."
    >
      <div className="grid gap-3" dir="rtl">
        <p className="rounded-xl bg-brand/5 p-3 text-sm text-slate-700 dark:text-slate-200">
          <ShieldCheck className="ms-1 inline size-4 text-brand" /> یک نقش را برای این ورود انتخاب
          کنید.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              disabled={busy}
              onClick={() => void select(role)}
              className={`min-h-24 rounded-xl border p-4 text-start transition focus-visible:ring-2 focus-visible:ring-brand ${role === activeRole ? "border-brand bg-brand/10" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand/50"}`}
            >
              <strong className="block text-base font-black text-ink">
                {roleLabel(role, "fa")}
              </strong>
              <small className="mt-2 block text-slate-500">ورود با قابلیت‌های این نقش</small>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">تغییر نقش از تنظیمات حساب در دسترس است.</p>
      </div>
    </ResponsiveModal>
  );
}
