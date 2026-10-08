import { Clock3, MapPin } from "lucide-react";
import { Card } from "../../../shared/ui/ui";
import { useCurrentPrayer } from "../hooks/use-current-prayer";
import type { PrayerSchedule } from "../model/current-prayer";

type CurrentPrayerCardProps = {
  times: PrayerSchedule | null | undefined;
  className?: string;
};

/** One live, school-timezone-aware prayer target for every dashboard role. */
export function CurrentPrayerCard({ times, className }: CurrentPrayerCardProps) {
  const active = useCurrentPrayer(times);

  return (
    <Card className={`p-3 ${className ?? ""}`} aria-label="اوقات شرعی" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <MapPin size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-ink">اوقات شرعی</h2>
          {active ? (
            <div className="mt-1 flex items-center gap-2 text-brand">
              <Clock3 size={14} aria-hidden="true" />
              <span className="text-xs font-bold">{active.tomorrow ? "صبح فردا" : "وقت فعلی"}</span>
              <strong className="text-sm text-ink">{active.label}</strong>
              <time dir="ltr" className="text-sm font-black text-ink" dateTime={active.time}>
                {active.time}
              </time>
            </div>
          ) : (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              اوقات شرعی مدرسه هنوز کامل ثبت نشده است.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
