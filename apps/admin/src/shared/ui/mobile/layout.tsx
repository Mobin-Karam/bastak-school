import type { HTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MobilePageContainerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/** A page-level layout recipe; the app shell remains the only vertical-scroll owner. */
export function MobilePageContainer({ className, children, ...props }: MobilePageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-2xl px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}

export function SafeAreaContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-[env(safe-area-inset-left)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]",
        className,
      )}
      {...props}
    />
  );
}

export function MobileStack({
  gap = "md",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { gap?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        gap === "sm" ? "gap-2" : gap === "lg" ? "gap-6" : "gap-4",
        className,
      )}
      {...props}
    />
  );
}

export function MobileGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 min-[420px]:grid-cols-2", className)} {...props} />
  );
}

export function MobileSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("grid gap-3", className)}>
      {title ? (
        <header className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function MobileCard({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-[var(--shadow-surface)]",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  action,
  backAction,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  backAction?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start gap-3", className)}>
      {backAction}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-8 text-ink sm:text-2xl">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </div>
    </header>
  );
}

export function CollapsibleSection({
  title,
  children,
  open = false,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  open?: boolean;
  className?: string;
}) {
  return (
    <details
      open={open}
      className={cn(
        "rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]",
        className,
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <span>{title}</span>
        <ChevronDown
          className="size-5 transition-transform motion-reduce:transition-none group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-[rgb(var(--border-subtle))] p-4">{children}</div>
    </details>
  );
}
