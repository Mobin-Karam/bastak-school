import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

type TriggerProps = {
  ref: (node: HTMLElement | null) => void;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
};

type ViewportPopoverProps = {
  trigger: (props: TriggerProps) => ReactNode;
  children: ReactNode;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  className?: string;
  width?: number;

  align?: "start" | "center" | "end";
  /** Keep portals inside modal drawers so their focus and pointer boundaries apply. */
  portalContainer?: Element;
  label?: string;
};

export function ViewportPopover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  className,
  width = 320,
  align = "start",
  portalContainer,
  label,
}: ViewportPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;

  const anchor = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width,
    maxHeight: 320,
  });

  const change = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }

      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );

  const place = useCallback(() => {
    const triggerElement = anchor.current;

    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();

    const margin = 8;
    const gap = 8;

    const containerRect = portalContainer?.getBoundingClientRect();
    const containerBounds =
      containerRect && containerRect.width && containerRect.height ? containerRect : undefined;
    const boundsLeft = Math.max(0, containerBounds?.left ?? 0),
      boundsRight = Math.min(window.innerWidth, containerBounds?.right ?? window.innerWidth);
    const boundsTop = Math.max(0, containerBounds?.top ?? 0),
      boundsBottom = Math.min(window.innerHeight, containerBounds?.bottom ?? window.innerHeight);
    const calculatedWidth = Math.min(width, boundsRight - boundsLeft - margin * 2);

    const panelHeight = panel.current?.getBoundingClientRect().height ?? 320;

    const belowSpace = boundsBottom - rect.bottom - gap - margin;

    const aboveSpace = rect.top - boundsTop - gap - margin;

    const openBelow = belowSpace >= 180 || belowSpace >= aboveSpace;

    const maxHeight = Math.max(160, openBelow ? belowSpace : aboveSpace);

    let left = rect.left;

    if (align === "end") {
      left = rect.right - calculatedWidth;
    }

    if (align === "center") {
      left = rect.left + rect.width / 2 - calculatedWidth / 2;
    }

    if (document.documentElement.dir === "rtl" && align === "start") {
      left = rect.right - calculatedWidth;
    }

    left = Math.min(boundsRight - calculatedWidth - margin, Math.max(boundsLeft + margin, left));

    const top = openBelow
      ? rect.bottom + gap
      : Math.max(margin, rect.top - Math.min(panelHeight, maxHeight) - gap);

    setPosition({
      top: portalContainer ? top - (containerRect?.top ?? 0) + portalContainer.scrollTop : top,
      left: portalContainer ? left - (containerRect?.left ?? 0) + portalContainer.scrollLeft : left,
      width: calculatedWidth,
      maxHeight,
    });
  }, [align, width, portalContainer]);

  useLayoutEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(place);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const outside = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!anchor.current?.contains(target) && !panel.current?.contains(target)) {
        change(false);
      }
    };

    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        change(false);
        anchor.current?.focus();
      }
    };

    const update = () => {
      place();
    };

    window.addEventListener("resize", update);

    window.addEventListener("scroll", update, true);

    document.addEventListener("pointerdown", outside);

    document.addEventListener("keydown", keyboard, true);

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);

    if (panel.current) {
      observer?.observe(panel.current);
    }

    return () => {
      window.removeEventListener("resize", update);

      window.removeEventListener("scroll", update, true);

      document.removeEventListener("pointerdown", outside);

      document.removeEventListener("keydown", keyboard, true);

      observer?.disconnect();
    };
  }, [open, place, change]);

  return (
    <>
      {trigger({
        ref(node) {
          anchor.current = node;
        },

        onClick() {
          change(!open);
        },

        "aria-expanded": open,

        "aria-haspopup": "dialog",
      })}

      {open &&
        createPortal(
          <div
            ref={panel}
            data-viewport-popover=""
            role="dialog"
            aria-label={label}
            aria-modal="false"
            style={{
              position: portalContainer ? "absolute" : "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            className={cn(
              `
              z-[130]
              overflow-y-auto
              overscroll-contain
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-xl

              dark:border-slate-700
              dark:bg-slate-900
              `,
              className,
            )}
          >
            {children}
          </div>,
          portalContainer ?? document.body,
        )}
    </>
  );
}

/** An open child popover consumes Escape before its enclosing modal. */
export function preserveModalWhilePopoverOpen(event: KeyboardEvent) {
  const target = event.target instanceof Element ? event.target : document.activeElement;
  if (
    target?.closest("[data-viewport-popover]") ||
    target?.closest('[role="dialog"]')?.querySelector("[data-viewport-popover]")
  )
    event.preventDefault();
}
