"use client";

import { Download, X } from "lucide-react";
import { Button } from "../../shared/ui/ui";

export function PWAInstallBanner({
  visible,
  onInstall,
  onDismiss,
}: {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <aside
      dir="rtl"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] sm:px-4 md:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-card/85">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Download className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">زانین را نصب کنید</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            دسترسی سریع‌تر و تجربه بهتر روی موبایل
          </p>
        </div>
        <Button size="sm" className="min-h-10 rounded-xl px-4" onClick={onInstall}>
          نصب
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="بستن پیشنهاد نصب"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
