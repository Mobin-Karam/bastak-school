import { ArrowDown, ArrowUp, CheckSquare2, Minus, Square, X } from "lucide-react";
import type { ReactNode } from "react";

import { useSharedUiCopy } from "./locale";
import { Button, EmptyState, ErrorState, LoadingState } from "./ui";

export type AdminDataColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  sortLabel?: string;
};

export function AdminDataTable<T>({
  rows,
  rowId,
  columns,
  label,

  loading = false,
  error = false,

  emptyTitle,
  errorTitle,
  errorDescription,

  onRetry,
  onRowClick,
  activeId,

  selectedIds = [],
  onSelectionChange,
  batchActions,

  sortId,
  sortDirection = "asc",
  onSort,

  mobileCard,
  displayMode = "auto",

  emptyAction,

  tableClassName = "",
  scrollClassName = "",

  footer,
}: {
  rows: T[];
  rowId: (row: T) => string;
  columns: AdminDataColumn<T>[];
  label: string;

  loading?: boolean;
  error?: boolean;

  emptyTitle?: string;
  errorTitle?: string;
  errorDescription?: ReactNode;

  onRetry?: () => void;
  onRowClick?: (row: T) => void;

  activeId?: string;

  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  batchActions?: ReactNode | ((selectedRows: T[]) => ReactNode);

  sortId?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (id: string) => void;

  /**
   * Compact feature-owned row representation.
   * Used below the md breakpoint when displayMode is "auto".
   */
  mobileCard?: (row: T) => ReactNode;

  /**
   * Controls responsive presentation.
   */
  displayMode?: "auto" | "table" | "cards";

  /**
   * Contextual recovery action for an empty state.
   */
  emptyAction?: ReactNode;

  /**
   * Allows feature-specific table sizing.
   */
  tableClassName?: string;

  /**
   * Classes applied directly to the table scroll container.
   */
  scrollClassName?: string;

  /**
   * Optional fixed footer rendered below the scrolling
   * table area. Useful for pagination.
   */
  footer?: ReactNode;
}) {
  const copy = useSharedUiCopy();

  const showCards = Boolean(mobileCard && displayMode !== "table");

  const showTable = displayMode !== "cards" || !mobileCard;

  const selectable = Boolean(onSelectionChange);

  const visibleIds = rows.map(rowId);
  const selected = new Set(selectedIds);

  const selectedVisible = visibleIds.filter((id) => selected.has(id));

  const allSelected = rows.length > 0 && selectedVisible.length === rows.length;

  const partiallySelected = selectedVisible.length > 0 && !allSelected;

  const selectedRows = rows.filter((row) => selected.has(rowId(row)));

  const toggleAll = () =>
    onSelectionChange?.(
      allSelected
        ? selectedIds.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...selectedIds, ...visibleIds])),
    );

  const toggleOne = (id: string) =>
    onSelectionChange?.(
      selected.has(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id],
    );

  if (loading) {
    return (
      <div className="p-5">
        <LoadingState label={copy.loading(label)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <ErrorState
          title={errorTitle || copy.loadFailed(label)}
          description={errorDescription}
          action={
            onRetry ? (
              <Button variant="soft" onClick={onRetry}>
                {copy.retry}
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-5">
        <EmptyState title={emptyTitle || copy.emptyRecords} action={emptyAction} />
      </div>
    );
  }

  return (
    <div
      className={[
        "min-w-0",
        "rounded-lg",
        "border",
        "border-[rgb(var(--border-subtle))]",
        "bg-[rgb(var(--surface-card))]",
        "shadow-[var(--shadow-surface)]",

        scrollClassName ? "flex h-full min-h-0 flex-col overflow-hidden" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Selection / batch actions */}
      {selectable && selectedIds.length ? (
        <div
          className="
            z-10
            flex min-h-10 shrink-0
            flex-wrap items-center gap-3
            border-b border-brand/20
            bg-[rgb(var(--surface-card))]
            px-3 py-2
            shadow-[0_1px_0_rgb(var(--border-subtle))]
          "
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-brand">
            <CheckSquare2 size={17} />

            {copy.selected(selectedIds.length)}
          </span>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            {typeof batchActions === "function" ? batchActions(selectedRows) : batchActions}
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="ms-auto"
            onClick={() => onSelectionChange?.([])}
          >
            <X size={14} />

            {copy.clearSelection}
          </Button>
        </div>
      ) : null}

      {/* Mobile cards */}
      {showCards ? (
        <div
          className={["grid gap-3", displayMode === "auto" ? "md:hidden" : ""]
            .filter(Boolean)
            .join(" ")}
          aria-label={copy.cardView(label)}
        >
          {rows.map((row) => {
            const id = rowId(row);
            const checked = selected.has(id);
            const active = activeId === id;

            return (
              <article
                key={id}
                className={[
                  "rounded-lg",
                  "border",
                  "border-[rgb(var(--border-subtle))]",
                  "bg-[rgb(var(--surface-card))]",
                  "p-3",
                  "shadow-[var(--shadow-surface)]",

                  checked || active ? "ring-2 ring-brand/30" : "",

                  onRowClick ? "cursor-pointer" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => {
                  if (
                    !onRowClick ||
                    event.target !== event.currentTarget ||
                    !["Enter", " "].includes(event.key)
                  ) {
                    return;
                  }

                  event.preventDefault();
                  onRowClick(row);
                }}
                data-active={checked || active || undefined}
              >
                {selectable ? (
                  <label
                    className="
                      mb-3
                      flex items-center gap-2
                      border-b border-slate-100
                      pb-3
                      text-xs font-bold text-slate-600
                      dark:border-slate-800
                      dark:text-slate-300
                    "
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-brand"
                      checked={checked}
                      aria-label={copy.selectRow(id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleOne(id)}
                    />

                    {copy.selectItem}
                  </label>
                ) : null}

                {mobileCard?.(row)}
              </article>
            );
          })}
        </div>
      ) : null}

      {/* Horizontal scroll hint */}
      {!mobileCard ? (
        <p
          className="
            shrink-0
            border-b
            border-[rgb(var(--border-subtle))]
            px-3 py-2
            text-xs text-slate-500
            md:hidden
          "
        >
          {copy.horizontalScrollHint}
        </p>
      ) : null}

      {/* Table */}
      {showTable ? (
        <div
          className={[
            "scroll-reveal",
            "min-w-0",

            scrollClassName ? "min-h-0 flex-1" : "",

            "overflow-x-auto",
            "overscroll-x-contain",

            mobileCard && displayMode === "auto" ? "hidden md:block" : "",

            scrollClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          role="region"
          aria-label={copy.scrollableTable(label)}
          tabIndex={0}
        >
          <table
            className={`
              w-full
              min-w-[720px]
              text-sm
              ${tableClassName}
            `}
          >
            <caption className="sr-only">{label}</caption>

            <thead className={scrollClassName ? "sticky top-0 z-[2]" : undefined}>
              <tr
                className="
                  border-b
                  border-[rgb(var(--border-subtle))]
                  bg-[rgb(var(--surface-muted))]
                  text-start
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {selectable ? (
                  <th className="w-12 px-3 py-2.5">
                    <button
                      type="button"
                      className="
                        grid size-8
                        place-items-center
                        rounded-md
                        hover:bg-slate-200/60
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-brand
                        dark:hover:bg-slate-800
                      "
                      aria-label={allSelected ? copy.clearAllSelection : copy.selectAll}
                      aria-pressed={allSelected}
                      onClick={toggleAll}
                    >
                      {partiallySelected ? (
                        <Minus size={17} />
                      ) : allSelected ? (
                        <CheckSquare2 size={17} className="text-brand" />
                      ) : (
                        <Square size={17} />
                      )}
                    </button>
                  </th>
                ) : null}

                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={`
                      px-3 py-2.5
                      font-medium
                      ${column.className || ""}
                    `}
                    aria-sort={
                      sortId === column.id
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {column.sortLabel && onSort ? (
                      <button
                        type="button"
                        className="
                          inline-flex
                          items-center
                          gap-1
                          rounded-md
                          px-1 py-1
                          hover:text-ink
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-brand
                        "
                        onClick={() => onSort(column.id)}
                        aria-label={copy.sortBy(column.sortLabel)}
                        aria-pressed={sortId === column.id}
                      >
                        {column.header}

                        {sortId === column.id ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody
              className="
                divide-y
                divide-[rgb(var(--border-subtle))]
              "
            >
              {rows.map((row) => {
                const id = rowId(row);
                const checked = selected.has(id);
                const active = activeId === id;

                return (
                  <tr
                    key={id}
                    className={[
                      onRowClick ? "cursor-pointer" : "",

                      "transition-colors",

                      checked || active
                        ? "bg-brand/5 dark:bg-brand/10"
                        : "hover:bg-[rgb(var(--surface-muted))]",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onRowClick?.(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(event) => {
                      if (
                        !onRowClick ||
                        event.target !== event.currentTarget ||
                        !["Enter", " "].includes(event.key)
                      ) {
                        return;
                      }

                      event.preventDefault();
                      onRowClick(row);
                    }}
                    aria-selected={checked || active || undefined}
                  >
                    {selectable ? (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          className="size-4 accent-brand"
                          checked={checked}
                          aria-label={copy.selectRow(id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`
                            px-3 py-2.5
                            ${column.className || ""}
                          `}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Fixed footer / pagination */}
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
