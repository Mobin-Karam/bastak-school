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
  title?: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex min-h-14 items-center gap-2 px-4 pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="min-w-11">{start}</div>
      <div className="min-w-0 flex-1 text-center">{title}</div>
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
      className="mobile-menu-dock fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[460px] sm:inset-x-3"
    >
      {items.slice(0, 5).map((item) => (
        <button
          key={item.path}
          type="button"
          aria-current={currentPath === item.path ? "page" : undefined}
          onClick={item.onSelect}
          className={cn(
            "mobile-menu-dock__item",
            currentPath === item.path ? "mobile-menu-dock__item--active" : undefined,
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
