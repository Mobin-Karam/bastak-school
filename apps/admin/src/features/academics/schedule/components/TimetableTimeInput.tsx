import { forwardRef, type ComponentProps } from "react";
import { Input } from "../../../../shared/ui/ui";
import { normalizeTimetableClock } from "../lib/timetable-input";
export const TimetableTimeInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(
  ({ onBlur, onChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      dir="ltr"
      inputMode="text"
      placeholder="07:30"
      pattern="[0-9۰-۹٠-٩]{1,2}:[0-9۰-۹٠-٩]{2}"
      onChange={onChange}
      onBlur={(event) => {
        const value = normalizeTimetableClock(event.currentTarget.value);
        if (value !== event.currentTarget.value) {
          event.currentTarget.value = value;
          onChange?.(event);
        }
        onBlur?.(event);
      }}
    />
  ),
);
TimetableTimeInput.displayName = "TimetableTimeInput";
