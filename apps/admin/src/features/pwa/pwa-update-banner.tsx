"use client";

import { useCallback, useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { cn } from "../../shared/lib/utils";

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
    <aside
      dir="rtl"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] px-3 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      <div className="pointer-events-auto mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3 p-3 sm:items-center sm:p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            {updating ? (
              <RefreshCw className="size-5 animate-spin" />
            ) : (
              <Sparkles className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold sm:text-base">نسخه جدید زانین آماده است</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              {updating
                ? "در حال آماده‌سازی نسخه جدید…"
                : "برای دریافت آخرین امکانات و اصلاحات، برنامه را به‌روزرسانی کنید."}
            </p>
            {(currentVersion || nextVersion) && (
              <p dir="ltr" className="mt-1.5 text-left text-[11px] text-muted-foreground">
                {currentVersion ?? "—"} → {nextVersion ?? "—"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={updating}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="بعداً"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex gap-2 border-t p-3 sm:justify-end">
          <button
            type="button"
            onClick={update}
            disabled={updating}
            className={cn(
              "min-h-11 flex-1 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition sm:flex-none",
              "disabled:cursor-wait disabled:opacity-70",
            )}
          >
            {updating ? "در حال به‌روزرسانی…" : "به‌روزرسانی اکنون"}
          </button>
        </div>
        {updating && (
          <div className="h-1 overflow-hidden bg-muted">
            <div className="h-full w-2/3 animate-pulse bg-primary" />
          </div>
        )}
      </div>
    </aside>
  );
}
