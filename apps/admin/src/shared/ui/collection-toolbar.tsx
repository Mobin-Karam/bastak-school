import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useSharedUiCopy } from "./locale";
import { Button, Input } from "./ui";

/** Compact collection controls modelled after CRM record-index toolbars. */
export function CollectionToolbar({
  search,
  onSearchChange,
  placeholder,
  searchLabel,
  searchInputType = "search",
  filters,
  actions,
  resultLabel,
  onClear,
  label,
  sticky = false,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  searchLabel?: string;
  searchInputType?: ComponentProps<"input">["type"];
  filters?: ReactNode;
  actions?: ReactNode;
  resultLabel?: ReactNode;
  onClear?: () => void;
  /** Gives screen readers a feature-specific name for this collection's controls. */
  label?: string;
  /** Use inside a bounded scrolling collection when filters must remain reachable. */
  sticky?: boolean;
}) {
  const copy = useSharedUiCopy();
  const resolvedPlaceholder =
    placeholder || (copy.locale.startsWith("en") ? "Search…" : "جست‌وجو…");
  const resolvedLabel =
    label || (copy.locale.startsWith("en") ? "Collection tools" : "ابزارهای فهرست");
  return (
    <div
      className={`collection-toolbar min-w-0 ${sticky ? "sticky top-0 z-20 bg-[rgb(var(--surface-card))] py-2 shadow-[0_1px_0_rgb(var(--border-subtle))]" : ""}`}
      aria-label={resolvedLabel}
    >
      {onSearchChange ? (
        <label className="relative min-w-0 flex-1 basis-52">
          <Search
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type={searchInputType}
            value={search || ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={resolvedPlaceholder}
            className="h-9 ps-9 text-xs"
            aria-label={searchLabel || resolvedPlaceholder}
          />
        </label>
      ) : null}
      {filters ? (
        <div
          className="flex min-h-9 max-w-full items-center gap-1 overflow-x-auto rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-1 scroll-reveal"
          aria-label={copy.listFilters}
        >
          <SlidersHorizontal size={14} className="ms-1 text-slate-400" aria-hidden="true" />
          {filters}
        </div>
      ) : null}
      {onClear ? (
        <Button size="sm" variant="ghost" onClick={onClear} aria-label={copy.clearFilters}>
          <X size={14} /> {copy.clearFilters}
        </Button>
      ) : null}
      {actions ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2 sm:flex-none sm:justify-end">
          {actions}
        </div>
      ) : null}
      {resultLabel ? (
        <span
          className="basis-full text-xs text-slate-500 sm:ms-auto sm:basis-auto"
          role="status"
          aria-live="polite"
        >
          {resultLabel}
        </span>
      ) : null}
    </div>
  );
}
