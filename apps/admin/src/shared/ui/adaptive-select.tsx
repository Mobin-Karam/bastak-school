import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "../lib/utils";
import { useOptionalAdminLanguage } from "./locale";

type SelectMode = "auto" | "native" | "menu";
type MenuSide = "top" | "bottom";
type MenuAlign = "start" | "center" | "end";

export type AdaptiveSelectProps = Omit<ComponentProps<"select">, "size"> & {
  /** Force a presentation for exceptional surfaces; auto is native on mobile. */
  mode?: SelectMode;
  menuSide?: MenuSide;
  menuAlign?: MenuAlign;
  menuClassName?: string;
  menuMaxHeight?: number;
  /** HTML listboxes remain native because they are not popup dropdowns. */
  size?: number;
};

type SelectOption = {
  value: string;
  label: ReactNode;
  disabled: boolean;
  hidden: boolean;
};

type SelectEntry =
  | { type: "option"; key: string; option: SelectOption }
  | { type: "group"; key: string; label: ReactNode; disabled: boolean; options: SelectOption[] };

const triggerBaseClassName =
  "inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-start text-sm text-[rgb(var(--color-ink))] shadow-sm outline-none transition-colors hover:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rosewood";

function subscribeToViewport(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(max-width: 767px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getIsMobileSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(max-width: 767px)").matches;
}

function flattenText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) return flattenText(value.props.children);
  return "";
}

function readOption(element: React.ReactElement, inheritedDisabled = false): SelectOption {
  const props = element.props as {
    value?: string | number;
    children?: ReactNode;
    disabled?: boolean;
    hidden?: boolean;
  };
  return {
    value: String(props.value ?? flattenText(props.children)),
    label: props.children,
    disabled: inheritedDisabled || Boolean(props.disabled),
    hidden: Boolean(props.hidden),
  };
}

function parseEntries(children: ReactNode): SelectEntry[] {
  const entries: SelectEntry[] = [];
  let index = 0;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      entries.push({
        type: "option",
        key: `option-${index++}`,
        option: readOption(child as React.ReactElement),
      });
      return;
    }
    if (child.type === "optgroup") {
      const props = child.props as { label?: ReactNode; disabled?: boolean; children?: ReactNode };
      const options: SelectOption[] = [];
      Children.forEach(props.children, (optionChild) => {
        if (isValidElement(optionChild) && optionChild.type === "option") {
          options.push(readOption(optionChild as React.ReactElement, Boolean(props.disabled)));
        }
      });
      entries.push({
        type: "group",
        key: `group-${index++}`,
        label: props.label,
        disabled: Boolean(props.disabled),
        options,
      });
    }
  });
  return entries;
}

function dispatchChange(onChange: AdaptiveSelectProps["onChange"], button: HTMLButtonElement) {
  if (!onChange) return;
  const event = {
    currentTarget: button,
    target: button,
    type: "change",
    bubbles: true,
    defaultPrevented: false,
    preventDefault() {},
    stopPropagation() {},
  } as unknown as ChangeEvent<HTMLSelectElement>;
  onChange(event);
}

/**
 * Shared value dropdown: native OS picker on mobile, accessible portaled menu on desktop.
 * Keeps the familiar HTMLSelectElement props/children contract for existing form consumers.
 */
export const AdaptiveSelect = forwardRef<HTMLSelectElement, AdaptiveSelectProps>(
  function AdaptiveSelect(
    {
      children,
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      onInvalid,
      className,
      disabled = false,
      required,
      multiple = false,
      size,
      mode = "auto",
      menuSide = "bottom",
      menuAlign = "start",
      menuClassName,
      menuMaxHeight = 288,
      dir,
      name,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const language = useOptionalAdminLanguage();
    const mobile = useSyncExternalStore(subscribeToViewport, getIsMobileSnapshot, () => true);
    const nativeMode =
      mode === "native" || (mode === "auto" && (mobile || multiple || (size ?? 0) > 1));
    const entries = useMemo(() => parseEntries(children), [children]);
    const options = useMemo(
      () => entries.flatMap((entry) => (entry.type === "option" ? [entry.option] : entry.options)),
      [entries],
    );
    const firstValue = options.find((option) => !option.hidden)?.value ?? "";
    const [uncontrolledValue, setUncontrolledValue] = useState(() => {
      if (Array.isArray(defaultValue)) return defaultValue[0] ?? firstValue;
      return defaultValue == null ? firstValue : String(defaultValue);
    });
    const selectedValue = value === undefined ? uncontrolledValue : String(value ?? "");
    const selectedOption = options.find((option) => option.value === selectedValue);
    const [open, setOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const setTriggerRef = useCallback(
      (element: HTMLButtonElement | null) => {
        triggerRef.current = element;
        setPortalContainer(element?.closest<HTMLElement>('[role="dialog"]') ?? null);
        if (typeof forwardedRef === "function") {
          forwardedRef(element as unknown as HTMLSelectElement);
        } else if (forwardedRef) {
          forwardedRef.current = element as unknown as HTMLSelectElement;
        }
      },
      [forwardedRef],
    );
    const resolvedDir = dir ?? (language ? (language === "fa" ? "rtl" : "ltr") : undefined);

    if (nativeMode) {
      return (
        <select
          ref={forwardedRef}
          value={selectedValue}
          onChange={(event) => {
            if (value === undefined) setUncontrolledValue(event.target.value);
            onChange?.(event);
          }}
          onBlur={onBlur}
          onFocus={onFocus}
          onInvalid={onInvalid}
          disabled={disabled}
          required={required}
          multiple={multiple}
          size={size}
          name={name}
          dir={resolvedDir}
          {...buttonProps}
          className={cn(triggerBaseClassName, "cursor-pointer", className)}
        >
          {children}
        </select>
      );
    }

    const handleValueChange = (nextValue: string) => {
      if (value === undefined) setUncontrolledValue(nextValue);
      if (triggerRef.current) {
        triggerRef.current.value = nextValue;
        dispatchChange(onChange, triggerRef.current);
      }
      setOpen(false);
    };

    return (
      <Menu.Root open={open} onOpenChange={setOpen}>
        <Menu.Trigger
          {...(buttonProps as unknown as ComponentProps<typeof Menu.Trigger>)}
          name={name}
          value={selectedValue}
          disabled={disabled}
          aria-required={required || undefined}
          dir={resolvedDir}
          ref={setTriggerRef}
          onBlur={onBlur as React.FocusEventHandler<HTMLButtonElement> | undefined}
          onFocus={onFocus as React.FocusEventHandler<HTMLButtonElement> | undefined}
          onInvalid={onInvalid as React.FormEventHandler<HTMLButtonElement> | undefined}
          render={
            <button
              type="button"
              className={cn(
                triggerBaseClassName,
                "cursor-pointer disabled:cursor-not-allowed",
                className,
              )}
            />
          }
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedOption?.label ?? (selectedValue ? selectedValue : "—")}
          </span>
          <ChevronDown size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
        </Menu.Trigger>
        {name ? (
          <input type="hidden" name={name} value={selectedValue} disabled={disabled} />
        ) : null}
        <Menu.Portal container={portalContainer ?? undefined}>
          <Menu.Positioner
            side={menuSide}
            sideOffset={5}
            align={menuAlign}
            className="z-[140] w-[var(--anchor-width)] max-w-[min(92vw,32rem)]"
          >
            <Menu.Popup
              dir={resolvedDir}
              aria-label={buttonProps["aria-label"]}
              className={cn(
                "overflow-y-auto rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-1.5 text-sm text-[rgb(var(--color-ink))] shadow-xl outline-none",
                menuClassName,
              )}
              style={{ maxHeight: menuMaxHeight }}
            >
              <Menu.RadioGroup value={selectedValue} onValueChange={handleValueChange}>
                <div className="grid gap-0.5">
                  {entries.map((entry) => {
                    if (entry.type === "group") {
                      return (
                        <Menu.Group key={entry.key}>
                          {entry.label ? (
                            <Menu.GroupLabel className="px-3 py-2 text-xs font-semibold text-slate-500">
                              {entry.label}
                            </Menu.GroupLabel>
                          ) : null}
                          {entry.options
                            .filter((option) => !option.hidden)
                            .map((option, optionIndex) => (
                              <MenuOption
                                key={`${entry.key}-${option.value}-${optionIndex}`}
                                option={option}
                              />
                            ))}
                        </Menu.Group>
                      );
                    }
                    if (entry.option.hidden) return null;
                    return <MenuOption key={entry.key} option={entry.option} />;
                  })}
                </div>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  },
);

function MenuOption({ option }: { option: SelectOption }) {
  return (
    <Menu.RadioItem
      value={option.value}
      disabled={option.disabled}
      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-start outline-none data-[highlighted]:bg-[rgb(var(--surface-muted))] data-[checked]:font-semibold data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
    >
      <span className="min-w-0 flex-1">{option.label}</span>
      <Menu.RadioItemIndicator>
        <Check size={16} className="shrink-0 text-brand" aria-hidden="true" />
      </Menu.RadioItemIndicator>
    </Menu.RadioItem>
  );
}
