import type { ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { EmptyState, ErrorState, LoadingState } from "../ui";
import { Button } from "../ui";
import { notifications } from "../notifications";
export { EmptyState, ErrorState, LoadingState };
export function MobileSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری" className={cn("grid gap-3", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700"
        />
      ))}
    </div>
  );
}
export function OfflineBanner({ message = "اتصال اینترنت برقرار نیست." }: { message?: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <WifiOff className="size-5" aria-hidden="true" />
      {message}
    </div>
  );
}
export const ToastNotification = notifications;
export function UndoAction({
  label = "بازگردانی",
  onUndo,
}: {
  label?: string;
  onUndo: () => void;
}) {
  return (
    <Button type="button" variant="soft" onClick={onUndo}>
      {label}
    </Button>
  );
}
