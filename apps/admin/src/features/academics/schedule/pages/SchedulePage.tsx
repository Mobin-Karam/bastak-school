import { useState } from "react";
import { Button } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { LegacySchedulePage } from "./LegacySchedulePage";
/** Existing unversioned schedules remain available during gradual migration. */
export function SchedulePage() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  return (
    <div className="schedule-page grid w-full gap-3">
      <div className="timetable-controls flex gap-2" aria-label="نوع برنامه">
        <Button variant="soft" onClick={() => setShowComingSoon(true)}>
          برنامه درسی نسخه‌بندی‌شده
        </Button>
        <Button variant="primary" aria-current="page">
          برنامه قبلی
        </Button>
      </div>
      <LegacySchedulePage />
      <ResponsiveModal
        open={showComingSoon}
        onOpenChange={setShowComingSoon}
        title="برنامه درسی جدید به‌زودی"
        description="نسخه جدید برنامه درسی در حال آماده‌سازی است و فعلاً برای هیچ‌یک از کاربران فعال نیست."
      >
        <div className="flex justify-end">
          <Button onClick={() => setShowComingSoon(false)}>متوجه شدم</Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
