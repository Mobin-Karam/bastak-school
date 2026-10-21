import type { ComponentProps, ReactNode } from "react";
import { Search, Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import { DatePicker } from "../date-picker";
import { Checkbox, Field, Input, Select } from "../ui";

export interface MobileTextFieldProps extends ComponentProps<typeof Input> {
  label: string;
  help?: string;
  error?: string;
}
export function MobileTextField({
  label,
  help,
  error,
  id,
  className,
  ...props
}: MobileTextFieldProps) {
  return (
    <Field label={label} description={help} error={error} id={id}>
      <Input id={id} className={cn("min-h-11 text-base", className)} {...props} />
    </Field>
  );
}
export function MobileSelect({
  label,
  help,
  error,
  id,
  className,
  children,
  ...props
}: ComponentProps<typeof Select> & { label: ReactNode; help?: string; error?: string }) {
  return (
    <Field label={label} description={help} error={error} id={id}>
      <Select id={id} className={cn("min-h-11 text-base", className)} {...props}>
        {children}
      </Select>
    </Field>
  );
}
export function MobileSearchableSelect({ label, ...props }: MobileTextFieldProps) {
  return <MobileTextField label={label} role="combobox" autoComplete="off" {...props} />;
}
export function PersianDatePicker({
  label,
  help,
  error,
  ...props
}: ComponentProps<typeof DatePicker> & { label: string; help?: string; error?: string }) {
  return (
    <Field label={label} description={help} error={error} id={props.id}>
      <DatePicker calendar="persian" {...props} />
    </Field>
  );
}
export function PhoneNumberField(props: Omit<MobileTextFieldProps, "inputMode" | "type">) {
  return <MobileTextField inputMode="tel" autoComplete="tel" dir="ltr" type="tel" {...props} />;
}
export function NationalCodeField(props: Omit<MobileTextFieldProps, "inputMode" | "maxLength">) {
  return <MobileTextField inputMode="numeric" maxLength={10} dir="ltr" {...props} />;
}
export function MobileCheckbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<typeof Checkbox> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex min-h-11 items-start gap-3 rounded-xl p-1 text-sm", className)}>
      <Checkbox className="mt-1" {...props} />
      <span className="grid gap-1">
        <span className="font-semibold text-ink">{label}</span>
        {description ? (
          <span className="text-xs leading-5 text-slate-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
export function MobileRadioGroup({
  label,
  value,
  onValueChange,
  options,
}: {
  label: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly {
    value: string;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
  }[];
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-bold text-ink">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-h-11 items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] px-3 py-2 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
        >
          <input
            type="radio"
            name={String(label)}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onValueChange(option.value)}
          />
          <span>
            <span className="font-semibold">{option.label}</span>
            {option.description ? (
              <span className="block text-xs text-slate-500">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
export function SearchBar({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <Input type="search" className={cn("h-11 ps-11 text-base", className)} {...props} />
    </div>
  );
}
export function FormStepper({
  steps,
  currentStep,
}: {
  steps: readonly string[];
  currentStep: number;
}) {
  return (
    <ol className="flex items-center gap-2" aria-label="مراحل فرم">
      {steps.map((step, index) => (
        <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
              index <= currentStep
                ? "bg-brand text-white"
                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
            )}
          >
            {index + 1}
          </span>
          <span className="truncate text-xs font-semibold">{step}</span>
          {index < steps.length - 1 ? (
            <span className="h-px flex-1 bg-[rgb(var(--border-subtle))]" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
export function MobileFileUpload({
  label,
  accept,
  onChange,
  disabled,
}: {
  label: ReactNode;
  accept?: string;
  onChange: (files: FileList | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-4 text-center text-sm font-semibold text-ink focus-within:ring-2 focus-within:ring-brand">
      <Upload className="size-5" aria-hidden="true" />
      {label}
      <input
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => onChange(event.target.files)}
      />
    </label>
  );
}
