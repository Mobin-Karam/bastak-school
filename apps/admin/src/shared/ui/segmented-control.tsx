import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
};

/** A compact, keyboard-native switch for mutually exclusive record views or filters. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-1",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.ariaLabel}
            aria-pressed={active}
            title={option.title}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex min-h-7 items-center justify-center gap-1 rounded-sm px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50",
              active
                ? "bg-[rgb(var(--surface-card))] text-[rgb(var(--color-ink))] shadow-sm"
                : "text-slate-500 hover:text-[rgb(var(--color-ink))] dark:text-slate-400",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
