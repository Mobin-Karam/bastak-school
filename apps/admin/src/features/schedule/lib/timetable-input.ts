export function normalizeTimetableClock(value: string) {
  const clean = value
    .trim()
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
  const match = clean.match(/^(\d{1,2}):([0-5]\d)$/);
  return match && Number(match[1]) < 24 ? `${match[1].padStart(2, "0")}:${match[2]}` : clean;
}
export function assertTimetableRange(start: string, end: string, kind: "date" | "time") {
  if (kind === "time") {
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) ||
      end <= start
    )
      throw Error("ساعت پایان باید بعد از شروع و در قالب ۲۴ ساعته باشد؛ مثال ۰۷:۳۰ تا ۰۸:۲۰.");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start)
    throw Error("تاریخ شروع و پایان را از تقویم شمسی انتخاب کنید؛ پایان نباید قبل از شروع باشد.");
}
