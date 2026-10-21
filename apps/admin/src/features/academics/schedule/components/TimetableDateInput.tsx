import type { ComponentProps } from "react";
import { timetableToday } from "../lib/timetable-time";
import { DatePicker } from "../../../../shared/ui/date-picker";
export function TimetableDateInput({
  label,
  timeZone = "Asia/Tehran",
  ...props
}: Omit<ComponentProps<typeof DatePicker>, "calendar" | "ariaLabel"> & {
  label: string;
  timeZone?: string;
}) {
  return (
    <DatePicker
      {...props}
      today={timetableToday(timeZone)}
      calendar="persian"
      ariaLabel={label}
      clearable={false}
    />
  );
}
