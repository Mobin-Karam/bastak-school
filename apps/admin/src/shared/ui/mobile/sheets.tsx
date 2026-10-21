import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { ResponsiveDrawer } from "../responsive-drawer";
import { Button } from "../ui";

export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {children}
    </ResponsiveDrawer>
  );
}
export const DetailSheet = MobileBottomSheet;
export function ActionSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <MobileBottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="grid gap-2">{children}</div>
    </MobileBottomSheet>
  );
}
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  tone = "primary",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  tone?: "primary" | "danger";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="w-[calc(100%_-_2rem)] max-w-sm rounded-2xl bg-[rgb(var(--surface-card))] p-5 text-start"
      >
        <DialogHeader className="text-start">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function FullScreenDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="inset-0 h-[var(--admin-viewport-height)] max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none bg-[rgb(var(--surface-card))] p-0"
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 text-start">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
