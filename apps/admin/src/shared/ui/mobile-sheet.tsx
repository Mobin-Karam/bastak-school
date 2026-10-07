import type { ReactNode } from "react";
import { Dialog, DialogContent } from "./dialog";
import { cn } from "../lib/utils";

/**
 * A mobile-first bottom sheet with a centered-dialog fallback for larger
 * screens. Keep feature content inside this primitive rather than creating
 * one-off mobile dialogs with incompatible safe-area behavior.
 */
export function MobileSheet({
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className={cn(
          "bottom-0 top-auto max-h-[min(92dvh,720px)] w-full max-w-none translate-y-0 overflow-y-auto rounded-b-none rounded-t-3xl border-0 bg-card p-0 shadow-2xl sm:bottom-auto sm:top-1/2 sm:max-w-md sm:-translate-y-1/2 sm:rounded-3xl",
          className,
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
