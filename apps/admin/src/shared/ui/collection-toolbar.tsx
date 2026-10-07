import { Search, SlidersHorizontal, X } from "lucide-react";

import type { ComponentProps, ReactNode } from "react";

import { useSharedUiCopy } from "./locale";
import { Button, Input } from "./ui";

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
  label?: string;
  sticky?: boolean;
}) {
  const copy = useSharedUiCopy();

  const resolvedPlaceholder =
    placeholder || (copy.locale.startsWith("en") ? "Search…" : "جست‌وجو…");

  const resolvedLabel =
    label || (copy.locale.startsWith("en") ? "Collection tools" : "ابزارهای فهرست");

  return (
    <div
      className={`
        collection-toolbar

        flex
        min-w-0
        flex-col
        gap-2.5

        sm:flex-row
        sm:flex-wrap
        sm:items-center

        ${
          sticky
            ? `
              sticky
              top-0
              z-20

              bg-[rgb(var(--surface-card)_/_96%)]

              py-2

              shadow-[
                0_1px_0_rgb(var(--border-subtle))
              ]

              backdrop-blur-md
            `
            : ""
        }
      `}
      aria-label={resolvedLabel}
    >
      {/* Search — primary mobile action */}
      {onSearchChange ? (
        <label
          className="
            relative
            order-1

            block
            w-full
            min-w-0

            sm:flex-1
            sm:basis-64
          "
        >
          <Search
            size={17}
            className="
              pointer-events-none

              absolute
              start-3.5
              top-1/2

              z-10

              -translate-y-1/2

              text-slate-400
            "
            aria-hidden="true"
          />

          <Input
            type={searchInputType}
            value={search || ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={resolvedPlaceholder}
            aria-label={searchLabel || resolvedPlaceholder}
            className="
              h-11
              w-full

              rounded-xl

              ps-10
              pe-3

              text-sm

              shadow-[
                0_2px_7px_rgb(15_23_42_/_5%)
              ]

              sm:h-9
              sm:text-xs
            "
          />
        </label>
      ) : null}

      {/* Result count */}
      {resultLabel ? (
        <span
          className="
            order-2

            flex
            min-h-6
            items-center

            text-[11px]
            font-medium

            text-slate-500

            sm:order-5
            sm:ms-auto
            sm:text-xs

            dark:text-slate-400
          "
          role="status"
          aria-live="polite"
        >
          {resultLabel}
        </span>
      ) : null}

      {/* View / collection actions */}
      {actions ? (
        <div
          className="
            order-3

            flex
            w-full
            min-w-0

            items-center

            [&>*]:w-full

            sm:order-2
            sm:w-auto
            sm:flex-none

            sm:[&>*]:w-auto
          "
        >
          {actions}
        </div>
      ) : null}

      {/* Active filters */}
      {filters ? (
        <div
          className="
            order-4

            flex
            min-h-10
            w-full
            max-w-full

            items-center
            gap-1

            overflow-x-auto
            overscroll-x-contain

            rounded-xl

            border
            border-[rgb(var(--border-subtle))]

            bg-[rgb(var(--surface-muted))]

            p-1

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden

            sm:order-3
            sm:min-h-9
            sm:w-auto
            sm:max-w-[32rem]
          "
          aria-label={copy.listFilters}
        >
          <SlidersHorizontal
            size={14}
            className="
              ms-1
              shrink-0
              text-slate-400
            "
            aria-hidden="true"
          />

          <div
            className="
              flex
              min-w-max
              items-center
              gap-1
            "
          >
            {filters}
          </div>
        </div>
      ) : null}

      {/* Clear */}
      {onClear ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          aria-label={copy.clearFilters}
          className="
            order-5

            min-h-10
            self-start

            sm:order-4
            sm:min-h-9
          "
        >
          <X size={14} aria-hidden="true" />

          <span>{copy.clearFilters}</span>
        </Button>
      ) : null}
    </div>
  );
}
