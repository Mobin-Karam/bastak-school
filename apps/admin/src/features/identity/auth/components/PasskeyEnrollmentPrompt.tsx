import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { passkeyRegistrationOptions, verifyPasskeyRegistration } from "../api/auth.api";

const OFFER_KEY = "bastak.passkey.offer.dismissed";
const PENDING_OFFER_KEY = "bastak.passkey.offer.pending";

/** One voluntary post-password sign-in offer; a device can use biometrics or its PIN. */
export function PasskeyEnrollmentPrompt({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supported = typeof window !== "undefined" && "PublicKeyCredential" in window;

  useEffect(() => {
    if (
      !authenticated ||
      !supported ||
      localStorage.getItem(OFFER_KEY) ||
      sessionStorage.getItem(PENDING_OFFER_KEY) !== "1"
    )
      return;
    sessionStorage.removeItem(PENDING_OFFER_KEY);
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [authenticated, supported]);

  const dismiss = () => {
    localStorage.setItem(OFFER_KEY, "1");
    setOpen(false);
  };

  async function enroll() {
    setBusy(true);
    setError("");
    try {
      const { challengeId, options } = await passkeyRegistrationOptions();
      const response = await startRegistration({ optionsJSON: options as never });
      await verifyPasskeyRegistration(challengeId, response);
      dismiss();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فعال‌سازی کلید دستگاه انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => !next && dismiss()}
      title="ورود سریع با دستگاه"
      description="می‌توانید در ورودهای بعدی از اثر انگشت، تشخیص چهره یا قفل دستگاه استفاده کنید؛ رمز عبور و اطلاعات بیومتریک شما در سامانه ذخیره نمی‌شود."
    >
      <div className="grid gap-4 py-2" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-slate-700 dark:text-slate-200">
          <Fingerprint className="shrink-0 text-brand" /> این قابلیت اختیاری است و بعداً از تنظیمات
          حساب هم قابل فعال‌سازی است.
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-sm text-rosewood dark:bg-rose-950/30"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="soft" disabled={busy} onClick={dismiss}>
            فعلاً نه
          </Button>
          <Button type="button" loading={busy} onClick={() => void enroll()}>
            فعال‌سازی
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
