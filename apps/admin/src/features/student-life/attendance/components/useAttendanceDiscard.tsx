import { useEffect, useState } from "react";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { Button } from "../../../../shared/ui/ui";

/** Keep a mounted draft until the user explicitly confirms a destructive navigation. */
export function useAttendanceDiscard(dirty: boolean, busy: boolean, scope: string) {
  const [action, setAction] = useState<(() => void) | null>(null);
  useEffect(() => setAction(null), [scope]);
  function request(next: () => void) {
    if (busy) return;
    if (dirty) setAction(() => next);
    else next();
  }
  const confirmation = (
    <ResponsiveDrawer
      open={Boolean(action)}
      dismissible={!busy}
      onOpenChange={(open) => {
        if (!open && !busy) setAction(null);
      }}
      title="تغییرات ذخیره نشده‌اند"
      description="با ادامه، انتخاب‌های ثبت‌نشده پاک می‌شوند. می‌خواهید ادامه دهید؟"
      desktopSide="left"
    >
      <div className="flex gap-2">
        <Button variant="soft" className="flex-1" disabled={busy} onClick={() => setAction(null)}>
          بازگشت و حفظ تغییرات
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          disabled={busy}
          onClick={() => {
            if (busy) return;
            const next = action;
            setAction(null);
            next?.();
          }}
        >
          ادامه و پاک‌کردن
        </Button>
      </div>
    </ResponsiveDrawer>
  );
  return { request, confirmation };
}
