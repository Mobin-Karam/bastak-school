import { Select } from "../../../../shared/ui/ui";

export type AttendanceSelectOption = { value: string; label: string };
type AttendanceSelectMode = "auto" | "native" | "menu";

/** A drawer-safe select whose option surface portals above the drawer. */
export function AttendanceSelect({
  value,
  options,
  onChange,
  label,
  disabled = false,
  className = "",
  mode = "auto",
}: {
  value: string;
  options: AttendanceSelectOption[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  mode?: AttendanceSelectMode;
}) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      disabled={disabled}
      className={className}
      menuMaxHeight={288}
      mode={mode}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
