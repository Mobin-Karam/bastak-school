import type { ReactNode } from "react";
import { ArrowRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui";
import { SegmentedControl, type SegmentedControlOption } from "../segmented-control";
import { DetailSheet } from "./sheets";
export { SegmentedControl } from "../segmented-control";

export function MobileHeader({
  title,
  start,
  end,
  className,
}: {
  title: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex min-h-14 items-center gap-2 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="min-w-11">{start}</div>
      <h1 className="min-w-0 flex-1 truncate text-center text-base font-black text-ink">{title}</h1>
      <div className="flex min-w-11 justify-end">{end}</div>
    </header>
  );
}
export function MobileBottomNavigation({
  items,
  currentPath,
}: {
  items: readonly { path: string; label: ReactNode; icon: ReactNode; onSelect: () => void }[];
  currentPath: string;
}) {
  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--surface-card))]/85"
    >
      {items.slice(0, 5).map((item) => (
        <button
          key={item.path}
          type="button"
          aria-current={currentPath === item.path ? "page" : undefined}
          onClick={item.onSelect}
          className={cn(
            "grid min-h-14 flex-1 place-items-center gap-1 rounded-xl px-1 text-[11px] font-semibold",
            currentPath === item.path
              ? "text-[rgb(var(--mobile-primary))]"
              : "text-slate-500 dark:text-slate-300",
          )}
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
export function MobileTabs<T extends string | number>(props: {
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <SegmentedControl {...props} className={cn("flex w-full overflow-x-auto", props.className)} />
  );
}
export function NavigationSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange} title={title}>
      {children}
    </DetailSheet>
  );
}
export function BackButton({ label = "بازگشت", onClick }: { label?: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
      <ArrowRight className="size-5" aria-hidden="true" />
    </Button>
  );
}
export function ContextMenu({
  label = "گزینه‌های بیشتر",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
      <MoreHorizontal className="size-5" aria-hidden="true" />
    </Button>
  );
}
export function StickyActionBar({
  primaryAction,
  secondaryAction,
  className,
}: {
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex flex-col-reverse gap-2 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:flex-row sm:justify-end",
        className,
      )}
    >
      {secondaryAction}
      {primaryAction}
    </div>
  );
}
