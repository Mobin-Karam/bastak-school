import { X } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { ResponsiveDrawer } from "./responsive-drawer";
import { useOptionalAdminLanguage } from "./locale";

const mobileQuery = "(max-width: 767px)";
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const snapshot = () => window.matchMedia(mobileQuery).matches;
export function useMobileDialog() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/** Shared editor: mobile bottom sheet, desktop modal with one form and state. */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  const mobile = useMobileDialog();
  const language = useOptionalAdminLanguage();
  if (mobile)
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        dir={language === "fa" ? "rtl" : "ltr"}
        className="max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-xl bg-[rgb(var(--surface-card))] p-5 text-start"
      >
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogClose
          className="absolute end-3 top-3 grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/10"
          aria-label={language === "fa" ? "بستن" : "Close"}
        >
          <X size={16} />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
