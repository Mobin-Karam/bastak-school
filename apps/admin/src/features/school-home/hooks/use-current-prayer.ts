import { useEffect, useState } from "react";
import { currentPrayer, type PrayerSchedule } from "../model/current-prayer";

/** Re-evaluates locally so the active tile changes immediately after each saved prayer time. */
export function useCurrentPrayer(schedule: PrayerSchedule | null | undefined) {
  const scheduleKey = schedule
    ? [
        schedule.fajr,
        schedule.sunrise,
        schedule.dhuhr,
        schedule.asr,
        schedule.maghrib,
        schedule.isha,
      ].join("|")
    : "";
  const [active, setActive] = useState(() => currentPrayer(schedule));

  useEffect(() => {
    const update = () => setActive(currentPrayer(schedule));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, [schedule, scheduleKey]);

  return active;
}
