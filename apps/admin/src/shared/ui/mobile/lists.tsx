import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button, EmptyState } from "../ui";

export function MobileDataList({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="list" aria-label={label} className={cn("grid gap-2", className)}>
      {children}
    </div>
  );
}
export function MobileListItem({
  title,
  description,
  leading,
  trailing,
  onClick,
}: {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[rgb(var(--mobile-primary)/0.1)] text-[rgb(var(--mobile-primary))]">
        {leading}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-ink">{title}</span>
        {description ? (
          <span className="mt-1 block line-clamp-2 text-sm text-slate-500 dark:text-slate-300">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ??
        (onClick ? <ChevronLeft className="size-5 text-slate-400" aria-hidden="true" /> : null)}
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {content}
    </button>
  ) : (
    <div
      role="listitem"
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
    >
      {content}
    </div>
  );
}
export function MobileSelectionList({
  label,
  selected,
  onSelectedChange,
  children,
}: {
  label: string;
  selected: readonly string[];
  onSelectedChange: (ids: string[]) => void;
  children: readonly {
    id: string;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
  }[];
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-bold text-ink">{label}</legend>
      {children.map((item) => (
        <label
          key={item.id}
          className="flex min-h-11 items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] px-3 py-2"
        >
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            disabled={item.disabled}
            onChange={() =>
              onSelectedChange(
                selected.includes(item.id)
                  ? selected.filter((id) => id !== item.id)
                  : [...selected, item.id],
              )
            }
          />
          <span>
            <span className="font-semibold">{item.label}</span>
            {item.description ? (
              <span className="block text-xs text-slate-500">{item.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
export function FilterChips({
  options,
  value,
  onValueChange,
}: {
  options: readonly { value: string; label: ReactNode }[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="فیلترها">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value.includes(option.value)}
          onClick={() =>
            onValueChange(
              value.includes(option.value)
                ? value.filter((item) => item !== option.value)
                : [...value, option.value],
            )
          }
          className={cn(
            "min-h-11 shrink-0 rounded-full border px-3 text-sm font-semibold",
            value.includes(option.value)
              ? "border-[rgb(var(--mobile-primary))] bg-[rgb(var(--mobile-primary))] text-white"
              : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
export function SortSheet({ onOpen, label = "مرتب‌سازی" }: { onOpen: () => void; label?: string }) {
  return (
    <Button variant="soft" size="icon" aria-label={label} onClick={onOpen}>
      <SlidersHorizontal className="size-5" aria-hidden="true" />
    </Button>
  );
}
export function EmptyListState(props: ComponentProps<typeof EmptyState>) {
  return (
    <EmptyState
      className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))]"
      {...props}
    />
  );
}
