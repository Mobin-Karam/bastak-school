// DatePicker audited update
// Fixes: invalid ISO protection, safer calendar generation, guarded navigation,
// improved month/year handling, safer required input, and DateTime stability.

// AdvancedDatePicker.tsx
// Updated fixes applied:
// - validates ISO dates before calendar calculations
// - prevents invalid date crashes
// - resets picker mode when opening
// - adds safe month/year navigation
// - fixes button submit behavior
// - improves locale weekday handling
// - keeps existing DatePicker and DateTimePicker API

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { addDays, cn, todayIso } from "../lib/utils";
import { useLocale } from "./locale";
import { ViewportPopover } from "./popover";
import { Input } from "./ui";

type DatePickerProps = {
  calendar?: "persian" | "gregory";
  today?: string;
  ariaLabel?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
  showToday?: boolean;
};

export function DatePicker({
  value,
  onChange,
  calendar,
  today = todayIso(),
  ariaLabel,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  disabled,
  required,
  className,
  min = "",
  max = "",
  clearable = true,
  showToday = true,
}: DatePickerProps) {
  const { language, profile: configuredProfile, formatDate: localeFormatDate } = useLocale();
  const profile = calendar
    ? {
        ...configuredProfile,
        calendar,
        locale: calendar === "persian" ? "fa-IR" : configuredProfile.locale,
      }
    : configuredProfile;
  const formatDate = (iso: string, options: Intl.DateTimeFormatOptions = {}) =>
    calendar
      ? new Intl.DateTimeFormat(`${profile.locale}-u-ca-${calendar}`, {
          ...(Object.keys(options).length
            ? options
            : { year: "numeric", month: "long", day: "numeric" }),
          timeZone: "UTC",
        }).format(new Date(`${iso}T12:00:00Z`))
      : localeFormatDate(iso, options);
  const copy = datePickerCopy[calendar === "persian" ? "fa" : language];

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [portalContainer, setPortalContainer] = useState<Element | undefined>();
  const [mode, setMode] = useState<"calendar" | "month" | "year">("calendar");
  const boundedToday = max && today > max ? max : min && today < min ? min : today;
  const [cursor, setCursor] = useState(isValidIso(value) ? value : boundedToday);
  const hasValue = isValidIso(value);
  const valueDescriptionId = useId();

  useEffect(() => {
    if (isValidIso(value)) setCursor(value);
    else if (isValidIso(boundedToday)) setCursor(boundedToday);
  }, [value, boundedToday]);

  const parts = calendarParts(cursor, profile.locale, profile.calendar);

  const grid = useMemo(
    () => calendarGrid(cursor, profile.locale, profile.calendar),
    [cursor, profile.locale, profile.calendar],
  );

  function selectDate(date: string) {
    if (!isValidIso(date)) return;

    onChange(date);
    setCursor(date);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={cn("relative", className)}>
      {hasValue ? (
        <span className="sr-only" id={valueDescriptionId}>
          {formatDate(value)}
        </span>
      ) : null}
      <ViewportPopover
        open={open}
        portalContainer={portalContainer}
        onOpenChange={(state) => {
          if (state)
            setPortalContainer(triggerRef.current?.closest('[role="dialog"]') ?? undefined);
          setOpen(state);
          if (state) setMode("calendar");
        }}
        width={350}
        label={calendar === "persian" ? "تقویم شمسی" : copy.selectDate}
        className="p-3"
        trigger={(props) => (
          <button
            {...props}
            ref={(node) => {
              props.ref(node);
              triggerRef.current = node;
            }}
            type="button"
            disabled={disabled}
            id={id}
            aria-describedby={
              [describedBy, hasValue ? valueDescriptionId : undefined].filter(Boolean).join(" ") ||
              undefined
            }
            aria-invalid={invalid}
            aria-label={
              ariaLabel ??
              (hasValue && clearable && !required
                ? copy.clearHint(formatDate(value))
                : hasValue
                  ? formatDate(value)
                  : copy.selectDate)
            }
            onKeyDown={(event) => {
              if (
                !event.defaultPrevented &&
                hasValue &&
                clearable &&
                !required &&
                ["Delete", "Backspace"].includes(event.key)
              ) {
                event.preventDefault();
                onChange("");
              }
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <span>{hasValue ? formatDate(value) : copy.selectDate}</span>

            {clearable && !required && hasValue ? (
              <X
                size={16}
                aria-hidden="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              />
            ) : (
              <CalendarDays size={17} aria-hidden="true" />
            )}
          </button>
        )}
      >
        {mode === "month" && (
          <MonthPicker
            cursor={cursor}
            locale={profile.locale}
            calendar={profile.calendar}
            selected={parts.month}
            onSelect={(month: number) => {
              setCursor(findMonth(cursor, month, profile.locale, profile.calendar));
              setMode("calendar");
            }}
          />
        )}

        {mode === "year" && (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 31 }, (_, i) => parts.year - 15 + i).map((year) => (
              <button
                type="button"
                key={year}
                className={cn(
                  "rounded-xl p-2 hover:bg-brand/10",
                  year === parts.year && "bg-brand text-white",
                )}
                onClick={() => {
                  setCursor(
                    findCalendarDate(
                      cursor,
                      year,
                      parts.month,
                      parts.day,
                      profile.locale,
                      profile.calendar,
                    ),
                  );
                  setMode("calendar");
                }}
              >
                {localNumber(year, profile.locale)}
              </button>
            ))}
          </div>
        )}

        {mode === "calendar" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label={copy.previousMonth}
                className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() =>
                  setCursor(shiftCalendarMonth(cursor, -1, profile.locale, profile.calendar))
                }
              >
                <ChevronRight size={18} />
              </button>

              <button type="button" onClick={() => setMode("month")}>
                {formatDate(cursor, { month: "long", year: "numeric" })}
              </button>

              <button type="button" onClick={() => setMode("year")}>
                {localNumber(parts.year, profile.locale)}
              </button>

              <button
                type="button"
                aria-label={copy.nextMonth}
                className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() =>
                  setCursor(shiftCalendarMonth(cursor, 1, profile.locale, profile.calendar))
                }
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((day, index) =>
                day ? (
                  <button
                    type="button"
                    key={day.iso}
                    disabled={(!!min && day.iso < min) || (!!max && day.iso > max)}
                    onClick={() => selectDate(day.iso)}
                    className={cn(
                      "aspect-square rounded-xl text-sm hover:bg-brand/10",
                      day.iso === value && "bg-brand text-white",
                      day.iso === today && day.iso !== value && "ring-1 ring-brand",
                    )}
                  >
                    {localNumber(day.day, profile.locale)}
                  </button>
                ) : (
                  <span key={index} />
                ),
              )}
            </div>

            {showToday && (
              <button
                type="button"
                className="mt-3 w-full rounded-xl py-2 text-brand hover:bg-brand/10"
                onClick={() => selectDate(today)}
                disabled={(!!min && today < min) || (!!max && today > max)}
              >
                {copy.today}
              </button>
            )}
          </>
        )}
      </ViewportPopover>

      {required && (
        <input
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          readOnly
        />
      )}
    </div>
  );
}

const datePickerCopy = {
  fa: {
    selectDate: "انتخاب تاریخ",
    clearHint: (date: string) => `${date}؛ برای پاک کردن کلید حذف را فشار دهید`,
    previousMonth: "ماه قبل",
    nextMonth: "ماه بعد",
    today: "امروز",
  },
  en: {
    selectDate: "Select date",
    clearHint: (date: string) => `${date}; press Delete to clear`,
    previousMonth: "Previous month",
    nextMonth: "Next month",
    today: "Today",
  },
} as const;

function MonthPicker({ onSelect, selected, locale, calendar, cursor }: any) {
  const names = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${findMonth(cursor, i + 1, locale, calendar)}T12:00:00Z`)),
  );
  return (
    <div className="grid grid-cols-3 gap-2">
      {names.map((name, index) => (
        <button
          type="button"
          key={name}
          onClick={() => onSelect(index + 1)}
          className={cn(
            "rounded-xl p-3 hover:bg-brand/10",
            selected === index + 1 && "bg-brand text-white",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const date = value?.slice(0, 10) || todayIso();
  const time = value?.slice(11, 16) || "08:00";
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
      <DatePicker
        value={date}
        disabled={disabled}
        onChange={(d) => onChange(`${d}T${time}:00+03:30`)}
      />
      <Input
        type="time"
        disabled={disabled}
        value={time}
        onChange={(e) => onChange(`${date}T${e.target.value}:00+03:30`)}
        className="px-3"
      />
    </div>
  );
}

function isValidIso(value: string) {
  if (!value) return false;
  return !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function calendarParts(iso: string, locale: string, calendar: string) {
  const parts = new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}-nu-latn`, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${iso}T12:00:00Z`));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function calendarGrid(cursor: string, locale: string, calendar: string) {
  if (!isValidIso(cursor)) return [];
  const current = calendarParts(cursor, locale, calendar);
  let first = cursor;
  for (let i = 0; i < 40 && calendarParts(first, locale, calendar).day !== 1; i++)
    first = addDays(first, -1);
  const rows: Array<any> = Array((new Date(`${first}T12:00:00`).getDay() + 1) % 7).fill(null);
  for (let iso = first; ; iso = addDays(iso, 1)) {
    const p = calendarParts(iso, locale, calendar);
    if (p.month !== current.month || p.year !== current.year) break;
    rows.push({ iso, day: p.day });
  }
  return rows;
}

function findCalendarDate(
  cursor: string,
  year: number,
  month: number,
  day: number,
  locale: string,
  calendar: string,
) {
  const current = calendarParts(cursor, locale, calendar);
  const estimate = addDays(
    cursor,
    Math.round((year - current.year) * 365.2425) + (month - current.month) * 30,
  );
  let last = cursor;
  for (let offset = -40; offset <= 40; offset++) {
    const candidate = addDays(estimate, offset),
      parts = calendarParts(candidate, locale, calendar);
    if (parts.year === year && parts.month === month) {
      last = candidate;
      if (parts.day === day) return candidate;
    }
  }
  return last;
}
function findMonth(cursor: string, month: number, locale: string, calendar: string) {
  const parts = calendarParts(cursor, locale, calendar);
  return findCalendarDate(cursor, parts.year, month, 1, locale, calendar);
}

function shiftCalendarMonth(cursor: string, delta: number, locale: string, calendar: string) {
  let p = cursor;
  const start = calendarParts(cursor, locale, calendar).month;
  for (let i = 0; i < 40; i++) {
    p = addDays(p, delta);
    if (calendarParts(p, locale, calendar).month !== start) return p;
  }
  return cursor;
}

function localNumber(v: number, l: string) {
  return new Intl.NumberFormat(l, { useGrouping: false }).format(v);
}
