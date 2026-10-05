import { ListFilter, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useSharedUiCopy } from "./locale";
import { Button, Card, EmptyState, ErrorState, LoadingState } from "./ui";

/**
 * Standard shell for management collections. Feature code owns its query,
 * filters and mutations; this component owns the consistent list states and
 * responsive hierarchy used by every conventional admin collection.
 */
export function AdminList<T>({
  label,
  description,
  items,
  loading = false,
  error = false,
  toolbar,
  actions,
  children,
  emptyTitle,
  emptyAction,
  errorTitle,
  onRetry,
  footer,
  className = "",
  contentClassName = "",
  stickyHeader = false,
  scrollable = false,
  stickyFooter = false,
  contentLabel,
}: {
  label: string;
  description?: string;
  items: readonly T[];
  loading?: boolean;
  error?: boolean;
  toolbar?: ReactNode;
  actions?: ReactNode;
  children: ReactNode | ((items: readonly T[]) => ReactNode);
  emptyTitle?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  onRetry?: () => void;
  footer?: ReactNode;
  className?: string;
  /** Enables fixed-height/scrolling consumers to keep the shared states in their viewport. */
  contentClassName?: string;
  /** Keeps the collection context and controls available inside a bounded scroll region. */
  stickyHeader?: boolean;
  /**
   * Gives the collection exactly one scrolling owner. Use only when the parent
   * supplies a bounded height; feature rows must not add a second vertical scroller.
   */
  scrollable?: boolean;
  /** Keeps pagination or bulk actions visible when this collection owns a bounded scroll region. */
  stickyFooter?: boolean;
  /** Names the scroll region for screen-reader users when `scrollable` is enabled. */
  contentLabel?: string;
}) {
  const copy = useSharedUiCopy();
  const content = typeof children === "function" ? children(items) : children;
  return (
    <Card
      className={`min-w-0 overflow-visible p-0 ${scrollable ? "flex min-h-0 flex-col" : ""} ${className}`}
    >
      <header
        className={`grid gap-3 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted)_/_95%)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-4 ${stickyHeader ? "sticky top-0 z-20" : ""}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
            <ListFilter size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">{label}</h2>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
        {toolbar ? <div className="sm:col-span-2">{toolbar}</div> : null}
      </header>
      <div
        className={`min-w-0 p-3 sm:p-4 ${scrollable ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" : ""} ${contentClassName}`}
        {...(scrollable
          ? { role: "region", "aria-label": contentLabel || label, tabIndex: 0 }
          : {})}
      >
        {loading ? (
          <LoadingState label={copy.loading(label)} />
        ) : error ? (
          <ErrorState
            title={errorTitle || copy.loadFailed(label)}
            action={
              onRetry ? (
                <Button variant="soft" onClick={onRetry}>
                  <RefreshCcw size={15} />
                  {copy.retry}
                </Button>
              ) : undefined
            }
          />
        ) : !items.length ? (
          <EmptyState title={emptyTitle || copy.emptyList(label)} action={emptyAction} />
        ) : (
          content
        )}
      </div>
      {footer ? (
        <footer
          className={`border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card)_/_96%)] p-3 ${stickyFooter ? "sticky bottom-0 z-10" : ""}`}
        >
          {footer}
        </footer>
      ) : null}
    </Card>
  );
}
