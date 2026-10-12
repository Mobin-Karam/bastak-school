export const weekdayOrder = [6, 0, 1, 2, 3, 4, 5];
export function timetableToday(timeZone = "Asia/Tehran", instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  return ["year", "month", "day"]
    .map((kind) => parts.find((p) => p.type === kind)!.value)
    .join("-");
}
export function timetableAddDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function timetableWeekStart(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return timetableAddDays(date, -((day + 1) % 7));
}
export function timetableDateLabel(date: string, _timeZone = "Asia/Tehran") {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}
