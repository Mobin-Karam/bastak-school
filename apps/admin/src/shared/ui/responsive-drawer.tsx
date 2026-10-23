import { X } from "lucide-react";
import type { ReactNode } from "react";

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
} from "./drawer";

type ResponsiveDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Desktop edge; mobile always uses a bottom sheet. */
  desktopSide?: "left" | "right";
  /** Enables snap-point behavior on the mobile bottom sheet. */
  snapPoints?: Array<number | string>;
  activeSnapPoint?: number | string | null;
  onSnapPointChange?: (snapPoint: number | string | null) => void;
  /** Lets the page remain interactive while the drawer is open. */
  modal?: boolean;
  dismissible?: boolean;
  /** Use inside another ResponsiveDrawer. */
  nested?: boolean;
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
}: ResponsiveDrawerProps) {
  const language = useOptionalAdminLanguage();
  const isMobile = useIsMobile();
  const DrawerRoot = nested ? DrawerNested : Drawer;
  return (
    <DrawerRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen || dismissible !== false) onOpenChange(nextOpen);
      }}
      swipeDirection={isMobile ? "down" : desktopSide === "left" ? "right" : "left"}
      snapPoints={isMobile ? snapPoints : undefined}
      snapPoint={isMobile ? activeSnapPoint : undefined}
      onSnapPointChange={
        isMobile && onSnapPointChange ? (point) => onSnapPointChange(point) : undefined
      }
      modal={modal ?? true}
      disablePointerDismissal={dismissible === false}
    >
      <DrawerContent className={className}>
        <DrawerHeader
          className="relative text-start sm:text-start"
          dir={language === "fa" ? "rtl" : "ltr"}
        >
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          <DrawerClose
            aria-label={language === "fa" ? "بستن" : "Close"}
            className="absolute end-3 top-3 grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={16} aria-hidden="true" />
          </DrawerClose>
        </DrawerHeader>
        <div
          dir={language === "fa" ? "rtl" : "ltr"}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-0 sm:p-5 sm:pt-0"
        >
          {children}
        </div>
      </DrawerContent>
    </DrawerRoot>
  );
}
