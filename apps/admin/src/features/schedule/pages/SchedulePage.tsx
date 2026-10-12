import { useState } from "react";
import { Button } from "../../../shared/ui/ui";
import { TimetablePage } from "./TimetablePage";
import { LegacySchedulePage } from "./LegacySchedulePage";
/** Existing unversioned schedules remain available during gradual migration. */
export function SchedulePage() {
  const [legacy, setLegacy] = useState(false);
  return (
    <div className="grid gap-3">
      <div className="timetable-controls flex gap-2" aria-label="نوع برنامه">
        <Button variant={legacy ? "soft" : "primary"} onClick={() => setLegacy(false)}>
          برنامه درسی نسخه‌بندی‌شده
        </Button>
        <Button variant={legacy ? "primary" : "soft"} onClick={() => setLegacy(true)}>
          برنامه قبلی
        </Button>
      </div>
      {legacy ? <LegacySchedulePage /> : <TimetablePage />}
    </div>
  );
}
