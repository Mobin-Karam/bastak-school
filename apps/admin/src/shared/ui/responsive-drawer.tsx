import { Maximize2, Minimize2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { useIsMobile } from "../hooks/use-mobile";
import { useOptionalAdminLanguage } from "./locale";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from "./drawer";

type ResponsiveDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Desktop edge; use bottom for a full-width operational sheet. */
  desktopSide?: "left" | "right" | "bottom";
  /** Enables snap-point behavior on the mobile bottom sheet. */
  snapPoints?: Array<number | string>;
  activeSnapPoint?: number | string | null;
  onSnapPointChange?: (snapPoint: number | string | null) => void;
  /** Lets the page remain interactive while the drawer is open. */
  modal?: boolean;
  dismissible?: boolean;
  /** Use inside another ResponsiveDrawer. */
  nested?: boolean;
  /** Start expanded inside the desktop workspace while preserving the navigation rail. */
  defaultDesktopExpanded?: boolean;
};

/** Responsive Base UI drawer adapter shared by operational panels and attendance flows. */
export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  desktopSide = "left",
  snapPoints,
  activeSnapPoint,
  onSnapPointChange,
  modal,
  dismissible,
  nested = false,
  defaultDesktopExpanded = false,
}: ResponsiveDrawerProps) {
  const language = useOptionalAdminLanguage();
  const isMobile = useIsMobile();
  const [desktopExpanded, setDesktopExpanded] = useState(defaultDesktopExpanded);
  const DrawerRoot = nested ? DrawerNested : Drawer;
  return (
    <DrawerRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen || dismissible !== false) onOpenChange(nextOpen);
      }}
      swipeDirection={
        isMobile
          ? "down"
          : desktopSide === "left"
            ? "right"
            : desktopSide === "right"
              ? "left"
              : "down"
      }
      snapPoints={isMobile ? snapPoints : undefined}
      snapPoint={isMobile ? activeSnapPoint : undefined}
      onSnapPointChange={
        isMobile && onSnapPointChange ? (point) => onSnapPointChange(point) : undefined
      }
      modal={modal ?? true}
      disablePointerDismissal={dismissible === false}
    >
      <DrawerVirtualKeyboardProvider>
        <DrawerContent
          className={`${className ?? ""} ${desktopExpanded ? "responsive-drawer-popup--expanded" : ""}`}
        >
          <DrawerHeader
            className="relative text-start sm:text-start"
            dir={language === "fa" ? "rtl" : "ltr"}
          >
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
            <button
              type="button"
              onClick={() => setDesktopExpanded((expanded) => !expanded)}
              aria-pressed={desktopExpanded}
              aria-label={
                desktopExpanded
                  ? language === "fa"
                    ? "بازگرداندن اندازه پنل"
                    : "Restore panel size"
                  : language === "fa"
                    ? "باز کردن پنل در فضای کاری"
                    : "Expand panel in workspace"
              }
              className="absolute end-14 top-3 hidden size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1200px]:grid"
            >
              {desktopExpanded ? (
                <Minimize2 size={16} aria-hidden="true" />
              ) : (
                <Maximize2 size={16} aria-hidden="true" />
              )}
            </button>
            <DrawerClose
              aria-label={language === "fa" ? "بستن" : "Close"}
              className="absolute end-3 top-3 grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={16} aria-hidden="true" />
            </DrawerClose>
          </DrawerHeader>
          <div
            data-drawer-scroll-body=""
            dir={language === "fa" ? "rtl" : "ltr"}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-0 sm:p-5 sm:pt-0"
          >
            {children}
          </div>
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </DrawerRoot>
  );
}
