"use client";

import { useCallback, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { ResponsiveModal } from "../../../shared/ui/responsive-modal";

export function PWAUpdateBanner({
  visible,
  currentVersion,
  nextVersion,
  onUpdate,
  onDismiss,
}: {
  visible: boolean;
  currentVersion?: string | null;
  nextVersion?: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const update = useCallback(() => {
    setUpdating(true);
    onUpdate();
  }, [onUpdate]);
  if (!visible) return null;
  return (
    <ResponsiveModal
      open={visible}
      onOpenChange={(open) => {
        if (!open && !updating) onDismiss();
      }}
      title="نسخه جدید آماده است"
      description="نسخه جدید فایل‌های برنامه را جایگزین می‌کند و سپس برنامه را دوباره باز می‌کند."
    >
      <section dir="rtl" aria-live="polite" className="mt-5 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            {updating ? (
              <RefreshCw className="size-5 animate-spin" />
            ) : (
              <Sparkles className="size-5" />
            )}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {updating
              ? "در حال آماده‌سازی نسخه جدید…"
              : "نسخه جدید هم‌اکنون روی دستگاه ذخیره می‌شود تا باز شدن صفحه‌ها سریع‌تر باشد."}
          </p>
        </div>
        {(currentVersion || nextVersion) && (
          <p dir="ltr" className="text-center text-[11px] text-muted-foreground">
            {currentVersion ?? "—"} → {nextVersion ?? "—"}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            disabled={updating}
            className="min-h-11 rounded-xl px-4 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            بعداً
          </button>
          <button
            type="button"
            onClick={update}
            disabled={updating}
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition disabled:cursor-wait disabled:opacity-70"
          >
            {updating ? "در حال به‌روزرسانی…" : "به‌روزرسانی اکنون"}
          </button>
        </div>
      </section>
    </ResponsiveModal>
  );
}
