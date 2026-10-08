export type PrayerSchedule = {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export type CurrentPrayer = {
  key: keyof PrayerSchedule;
  label: string;
  time: string;
  tomorrow: boolean;
};

const prayerOrder: ReadonlyArray<Pick<CurrentPrayer, "key" | "label">> = [
  { key: "fajr", label: "صبح" },
  { key: "sunrise", label: "طلوع" },
  { key: "dhuhr", label: "ظهر" },
  { key: "asr", label: "عصر" },
  { key: "maghrib", label: "مغرب" },
  { key: "isha", label: "عشاء" },
];

/**
 * The dashboard intentionally surfaces one clock target only. As a saved
 * time passes, its following time becomes the active target; after عشاء the
 * next morning's صبح is shown instead of a stale previous time.
 */
export function currentPrayer(
  schedule: PrayerSchedule | null | undefined,
  now = new Date(),
): CurrentPrayer | null {
  if (!schedule) return null;
  const nowMinutes = tehranMinutes(now);
  const entries = prayerOrder
    .map((entry) => ({ ...entry, time: schedule[entry.key] }))
    .filter((entry) => timeMinutes(entry.time) !== null)
    .sort((left, right) => timeMinutes(left.time)! - timeMinutes(right.time)!);
  if (!entries.length) return null;

  const active = entries.find((entry) => timeMinutes(entry.time)! >= nowMinutes);
  return active ? { ...active, tomorrow: false } : { ...entries[0], tomorrow: true };
}

export function tehranMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function timeMinutes(value: string): number | null {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const match = /^(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}
