"use client";

import { CheckCircle2, CircleHelp, Download, Share2, Sparkles, Wifi, X } from "lucide-react";
import { useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/ui";
import { MobileSheet } from "@/shared/ui/mobile-sheet";

const benefits = [
  "باز شدن مانند یک اپلیکیشن مستقل",
  "دسترسی سریع از صفحه اصلی",
  "پشتیبانی بهتر از حالت آفلاین",
  "دریافت نسخه‌های جدید زانین",
];

export function PWAInstallModal({
  open,
  canInstall,
  installing,
  isAndroid,
  isIOS,
  onInstall,
  onDismiss,
  onOpenChange,
}: {
  open: boolean;
  canInstall: boolean;
  installing: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const guideIsIOS = isIOS;
  const guideImage = guideIsIOS ? "/pwa-install-ios-guide.webp" : "/pwa-install-android-guide.webp";
  const guideTitle = guideIsIOS
    ? "راهنمای تصویری نصب در iPhone و iPad"
    : "راهنمای تصویری نصب در Android";

  const close = () => {
    onOpenChange(false);
    onDismiss();
  };

  return (
    <MobileSheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <button
        type="button"
        onClick={close}
        className="absolute left-4 top-4 z-10 grid size-10 place-items-center rounded-xl bg-white/70 text-slate-600 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-brand dark:bg-slate-950/60 dark:text-slate-300"
        aria-label="بستن"
      >
        <X className="size-4" />
      </button>
      <div className="relative isolate overflow-hidden rounded-t-3xl bg-[rgb(var(--surface-muted))] p-5 pt-6 sm:rounded-3xl sm:p-7">
        <img
          src="/zanin-install-promo.webp"
          width={480}
          height={720}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover object-top opacity-20"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/65 via-white/90 to-[rgb(var(--surface-card))] dark:from-slate-950/60 dark:via-slate-950/90 dark:to-[rgb(var(--surface-card))]" />

        <DialogHeader className="items-start text-right">
          <div className="mb-3 flex items-center gap-3">
            <img
              src="/app-logo.png"
              width={56}
              height={56}
              alt="نشان زانین"
              decoding="async"
              className="size-14 rounded-2xl object-contain drop-shadow-sm"
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">
              <Sparkles size={13} aria-hidden="true" />
              تجربه اپلیکیشن زانین
            </span>
          </div>
          <DialogTitle className="pe-10 text-xl font-bold sm:text-2xl">
            {isIOS
              ? "نصب زانین در آیفون یا آیپد"
              : isAndroid
                ? "نصب زانین برای اندروید"
                : "زانین را به دستگاه خود اضافه کنید"}
          </DialogTitle>
          <DialogDescription className="text-right leading-7">
            زانین را روی دستگاه خود نصب کنید تا با دسترسی سریع‌تر، فضای بیشتر و تجربه‌ای شبیه
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
                className="flex items-center gap-3 rounded-2xl border bg-white/70 p-3 dark:bg-slate-900/60"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">
                  {step as string}
                </span>
                <Icon className="size-4 shrink-0 text-brand" />
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
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-brand" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {!isIOS && !canInstall ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50/80 p-3 text-xs leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Wifi className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            اگر دکمه نصب Chrome هنوز فعال نشده است، از راهنمای تصویری زیر برای نصب از منوی مرورگر
            استفاده کنید.
          </p>
        ) : null}

        {guideOpen ? (
          <section className="mt-5 overflow-hidden rounded-2xl border border-brand/15 bg-white/75 p-3 dark:bg-slate-900/60">
            <h2 className="text-sm font-bold text-ink">{guideTitle}</h2>
            <img
              src={guideImage}
              width={480}
              height={720}
              alt={guideTitle}
              decoding="async"
              className="mx-auto mt-3 max-h-72 w-auto max-w-full object-contain"
            />
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {guideIsIOS
                ? "در Safari دکمه Share را بزنید، سپس Add to Home Screen و در پایان Add را انتخاب کنید."
                : "در Chrome منوی سه‌نقطه را باز کنید و گزینه Install app یا Add to Home screen را انتخاب کنید."}
            </p>
          </section>
        ) : null}

        <div className="mt-7 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Button
            className="min-h-12 rounded-xl"
            disabled={installing || (!isIOS && !isAndroid && !canInstall)}
            loading={installing}
            onClick={canInstall || isIOS ? onInstall : () => setGuideOpen(true)}
          >
            <Download size={17} aria-hidden="true" />
            {isIOS
              ? "نمایش راهنمای نصب"
              : isAndroid && !canInstall
                ? "راهنمای نصب اندروید"
                : isAndroid
                  ? "نصب برای اندروید"
                  : "نصب زانین"}
          </Button>
          <Button
            variant="soft"
            className="min-h-12 rounded-xl"
            onClick={() => setGuideOpen((open) => !open)}
            aria-expanded={guideOpen}
          >
            <CircleHelp size={17} aria-hidden="true" />
            راهنمای تصویری
          </Button>
          <Button variant="ghost" className="min-h-12 rounded-xl" onClick={close}>
            فعلاً نه
          </Button>
        </div>
      </div>
    </MobileSheet>
  );
}
