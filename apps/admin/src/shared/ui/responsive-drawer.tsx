import { preserveModalWhilePopoverOpen } from "./popover";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { cn } from "../lib/utils";
import { useOptionalAdminLanguage } from "./locale";

type ResponsiveDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** On larger screens the panel enters from the left edge. */
  desktopSide?: "left" | "right";
};

/**
 * Accessible detail drawer for operational views.
 *
 * It intentionally uses a bottom sheet on touch-sized screens and a side
 * drawer on desktop, so feature pages keep one interaction contract without
 * duplicating their content for each viewport.
 */
export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  desktopSide = "left",
}: ResponsiveDrawerProps) {
  const language = useOptionalAdminLanguage();
  const dragStart = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const desktopPosition =
    desktopSide === "left"
      ? "md:left-0 md:right-auto md:rounded-e-[1.75rem] md:rounded-s-none md:data-[state=open]:slide-in-from-left md:data-[state=closed]:slide-out-to-left"
      : "md:left-auto md:right-0 md:rounded-e-none md:rounded-s-[1.75rem] md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onEscapeKeyDown={preserveModalWhilePopoverOpen}
          dir={language === "fa" ? "rtl" : "ltr"}
          className={cn(
            "glass-navigation-sheet fixed inset-x-0 bottom-0 z-50 max-h-[min(88dvh,48rem)] overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-[rgb(var(--glass-border))] bg-[rgb(var(--glass-bg-strong))] shadow-[0_-20px_55px_-28px_rgba(10,42,70,.65)] outline-none supports-[backdrop-filter]:backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-200 data-[state=closed]:duration-150 motion-reduce:animate-none md:inset-y-0 md:bottom-auto md:max-h-none md:w-[min(28rem,92vw)] md:border-b md:shadow-[18px_0_48px_-26px_rgba(10,42,70,.55)] md:data-[state=open]:duration-200 md:data-[state=closed]:duration-150",
            desktopPosition,
            className,
          )}
          style={
            dragOffset
              ? {
                  transform: `translateY(${dragOffset}px)`,
                  transition: dragging ? "none" : "transform 160ms ease-out",
                }
              : undefined
          }
        >
          <div className="sticky top-0 z-10 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
            <button
              type="button"
              aria-label={language === "fa" ? "کشیدن برای بستن پنل" : "Drag to close panel"}
              className="mx-auto mb-3 block h-7 w-16 touch-none cursor-grab rounded-full p-2 active:cursor-grabbing md:hidden"
              onPointerDown={(event) => {
                dragStart.current = event.clientY;
                setDragging(true);
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (dragStart.current === null) return;
                setDragOffset(Math.max(0, event.clientY - dragStart.current));
              }}
              onPointerUp={(event) => {
                const shouldClose = event.clientY - (dragStart.current ?? event.clientY) > 72;
                dragStart.current = null;
                setDragging(false);
                setDragOffset(0);
                if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                  event.currentTarget.releasePointerCapture?.(event.pointerId);
                }
                if (shouldClose) onOpenChange(false);
              }}
              onPointerCancel={() => {
                dragStart.current = null;
                setDragging(false);
                setDragOffset(0);
              }}
            >
              <span className="block h-1.5 w-11 rounded-full bg-slate-300/80 dark:bg-slate-600" />
            </button>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-lg font-black text-ink">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              <DialogPrimitive.Close
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/10"
              >
                <X size={19} aria-hidden="true" />
                <span className="sr-only">{language === "fa" ? "بستن" : "Close"}</span>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-6">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
