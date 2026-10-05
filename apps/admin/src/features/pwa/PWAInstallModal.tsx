"use client";


import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/ui";
import { CheckCircle2, Download, Share2, Smartphone, X } from "lucide-react";

const benefits = [
  "باز شدن مانند یک اپلیکیشن مستقل",
  "دسترسی سریع از صفحه اصلی",
  "پشتیبانی بهتر از حالت آفلاین",
  "دریافت نسخه‌های جدید زانین",
];

export function PWAInstallModal({
  open,
  isIOS,
  onInstall,
  onDismiss,
  onOpenChange,
}: {
  open: boolean;
  isIOS: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => {
    onOpenChange(false);
    onDismiss();
  };
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="bottom-0 top-auto max-h-[min(90dvh,720px)] w-full max-w-none translate-y-0 overflow-y-auto rounded-b-none rounded-t-3xl border bg-card p-0 shadow-2xl sm:bottom-auto sm:top-1/2 sm:max-w-md sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute left-4 top-4 z-10 grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="بستن"
        >
          <X className="size-4" />
        </button>
        <div className="p-5 pt-6 sm:p-7">
          <DialogHeader className="items-start text-right">
            <div className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Smartphone className="size-6" />
            </div>
            <DialogTitle className="pe-10 text-xl font-bold sm:text-2xl">
              {isIOS ? "نصب زانین در آیفون یا آیپد" : "نصب پلتفرم زانین"}
            </DialogTitle>
            <DialogDescription className="text-right leading-7">
              زانین را روی دستگاه خود نصب کنید تا با فضای بیشتر، دسترسی سریع‌تر و تجربه‌ای شبیه
              اپلیکیشن از آن استفاده کنید.
            </DialogDescription>
          </DialogHeader>
          {isIOS ? (
            <ol className="mt-6 space-y-3">
              {[
                ["۱", "در Safari دکمه Share را بزنید", Share2],
                ["۲", "Add to Home Screen را انتخاب کنید", Download],
                ["۳", "Add را بزنید و زانین را از صفحه اصلی باز کنید", CheckCircle2],
              ].map(([step, text, Icon]) => (
                <li
                  key={step as string}
                  className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {step as string}
                  </span>
                  <Icon className="size-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium leading-6">{text as string}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="mt-6 grid gap-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button className="min-h-12 rounded-xl" onClick={isIOS ? close : onInstall}>
              {isIOS ? "متوجه شدم" : "نصب زانین"}
            </Button>
            <Button variant="ghost" className="min-h-12 rounded-xl" onClick={close}>
              بعداً
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
