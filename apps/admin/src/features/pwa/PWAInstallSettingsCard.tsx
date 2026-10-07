import { Download, Smartphone } from "lucide-react";
import { Button, Card } from "../../shared/ui/ui";
import { openPWAInstall } from "./install-launcher";

export function PWAInstallSettingsCard() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <img
            src="/app-logo.png"
            width={42}
            height={42}
            alt="نشان زانین"
            decoding="async"
            className="size-10 shrink-0 object-contain"
          />
          <div>
            <h2 className="text-sm font-black text-ink">نصب اپلیکیشن زانین</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              دسترسی سریع‌تر از صفحه اصلی دستگاه، همراه با راهنمای تصویری Android و iPhone.
            </p>
          </div>
        </div>
        <Smartphone className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
      </div>
      <Button className="mt-4 min-h-11 w-full sm:w-auto" onClick={openPWAInstall}>
        <Download size={16} aria-hidden="true" />
        نصب یا راهنمای برنامه
      </Button>
    </Card>
  );
}
