"use client";

import { RefreshCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main dir="rtl" className="grid min-h-[100dvh] place-items-center bg-background p-4 text-foreground">
      <section className="w-full max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted"><WifiOff className="size-7" /></div>
        <h1 className="mt-5 text-xl font-bold sm:text-2xl">اتصال اینترنت در دسترس نیست</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">بخش‌های ذخیره‌شده زانین همچنان قابل استفاده‌اند. پس از بازگشت اینترنت دوباره تلاش کنید.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground">
          <RefreshCw className="size-4" /> تلاش دوباره
        </button>
      </section>
    </main>
  );
}
