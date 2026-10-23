import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
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
  /** Preferred value-only contract for controlled app state and form controllers. */
  onValueChange?: (value: string) => void;
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

const visuallyHiddenSelectStyle: CSSProperties = {
  clipPath: "inset(50%)",
  overflow: "hidden",
  whiteSpace: "nowrap",
  border: 0,
  padding: 0,
  width: 1,
  height: 1,
  margin: -1,
  position: "absolute",
};

function subscribeToViewport(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(max-width: 767px)");
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }
  query.addListener(onChange);
  return () => query.removeListener(onChange);
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

function createSelectChangeEvent(select: HTMLSelectElement): React.ChangeEvent<HTMLSelectElement> {
  const nativeEvent = new Event("change", { bubbles: true });
  let propagationStopped = false;

  return {
    nativeEvent,
    currentTarget: select,
    target: select,
    bubbles: nativeEvent.bubbles,
    cancelable: nativeEvent.cancelable,
    defaultPrevented: nativeEvent.defaultPrevented,
    eventPhase: nativeEvent.eventPhase,
    isTrusted: nativeEvent.isTrusted,
    timeStamp: nativeEvent.timeStamp,
    type: nativeEvent.type,
    preventDefault: () => nativeEvent.preventDefault(),
    isDefaultPrevented: () => nativeEvent.defaultPrevented,
    stopPropagation: () => {
      propagationStopped = true;
      nativeEvent.stopPropagation();
    },
    isPropagationStopped: () => propagationStopped,
    persist: () => undefined,
  };
}

/**
 * Shared value dropdown: native OS picker on mobile and an accessible portaled select on desktop.
 * A visually hidden native select remains the canonical form, ref, validation, and event control.
 */
export const AdaptiveSelect = forwardRef<HTMLSelectElement, AdaptiveSelectProps>(
  function AdaptiveSelect(
    {
      children,
      value,
      defaultValue,
      onChange,
      onValueChange,
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
      style,
      ...selectProps
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
    const initialValue = Array.isArray(defaultValue)
      ? String(defaultValue[0] ?? firstValue)
      : defaultValue == null
        ? firstValue
        : String(defaultValue);
    const [uncontrolledValue, setUncontrolledValue] = useState(() => {
      return initialValue;
    });
    const validUncontrolledValue = options.some((option) => option.value === uncontrolledValue)
      ? uncontrolledValue
      : firstValue;
    const selectedValue = value === undefined ? validUncontrolledValue : String(value ?? "");
    const selectedOption = options.find((option) => option.value === selectedValue);
    const [open, setOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [implicitLabel, setImplicitLabel] = useState<string>();
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const nativeSelectRef = useRef<HTMLSelectElement | null>(null);
    const setNativeSelectRef = useCallback(
      (element: HTMLSelectElement | null) => {
        nativeSelectRef.current = element;
        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else if (forwardedRef) {
          forwardedRef.current = element;
        }
      },
      [forwardedRef],
    );
    const setTriggerRef = useCallback((element: HTMLButtonElement | null) => {
      triggerRef.current = element;
      setPortalContainer(element?.closest<HTMLElement>('[role="dialog"]') ?? null);
      if (!element) return;
      const wrappingLabel = element?.closest("label");
      if (!wrappingLabel) {
        setImplicitLabel(undefined);
        return;
      }
      const labelParts: string[] = [];
      for (const node of wrappingLabel.childNodes) {
        if (node === nativeSelectRef.current || node === element) break;
        const text = node.textContent?.trim();
        if (text) labelParts.push(text);
      }
      setImplicitLabel(labelParts.join(" ") || undefined);
    }, []);
    const resolvedDir = dir ?? (language ? (language === "fa" ? "rtl" : "ltr") : undefined);

    useEffect(() => {
      const form = nativeSelectRef.current?.form;
      if (!form || multiple || (size ?? 0) > 1) return;
      const handleReset = () => {
        queueMicrotask(() => {
          if (value === undefined) {
            setUncontrolledValue(initialValue);
          } else if (nativeSelectRef.current) {
            nativeSelectRef.current.value = selectedValue;
          }
        });
      };
      form.addEventListener("reset", handleReset);
      return () => form.removeEventListener("reset", handleReset);
    }, [initialValue, multiple, selectedValue, size, value]);

    const handleNativeChange: NonNullable<AdaptiveSelectProps["onChange"]> = (event) => {
      if (value === undefined) setUncontrolledValue(event.currentTarget.value);
      onValueChange?.(event.currentTarget.value);
      onChange?.(event);
    };

    if (nativeMode) {
      const nativeListbox = multiple || (size ?? 0) > 1;
      return (
        <select
          ref={setNativeSelectRef}
          {...selectProps}
          value={nativeListbox ? value : selectedValue}
          defaultValue={nativeListbox && value === undefined ? defaultValue : undefined}
          onChange={nativeListbox ? onChange : handleNativeChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onInvalid={onInvalid}
          disabled={disabled}
          required={required}
          multiple={multiple}
          size={size}
          name={name}
          dir={resolvedDir}
          style={style}
          className={cn(triggerBaseClassName, "cursor-pointer", className)}
        >
          {children}
        </select>
      );
    }

    const handleValueChange = (nextValue: string | null) => {
      if (nextValue == null || disabled) return;
      const select = nativeSelectRef.current;
      if (!select || select.value === nextValue) {
        setOpen(false);
        return;
      }
      // Base UI already gives us the committed value. Notify React consumers
      // directly instead of redispatching a DOM event through nested portals;
      // React may suppress such programmatic changes on controlled form fields.
      select.value = nextValue;
      if (value === undefined) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
      onChange?.(createSelectChangeEvent(select));
      setOpen(false);
    };

    const dispatchFocusEvent = (
      type: "focusin" | "focusout",
      event: ReactFocusEvent<HTMLButtonElement>,
    ) => {
      nativeSelectRef.current?.dispatchEvent(
        new FocusEvent(type, { bubbles: true, relatedTarget: event.relatedTarget }),
      );
    };

    const {
      id: controlId,
      form,
      autoComplete,
      title,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...contractSelectProps
    } = selectProps;

    return (
      <>
        <select
          ref={setNativeSelectRef}
          {...contractSelectProps}
          id={controlId ? `${controlId}--native` : undefined}
          name={name}
          form={form}
          autoComplete={autoComplete}
          value={selectedValue}
          required={required}
          disabled={disabled}
          dir={resolvedDir}
          tabIndex={-1}
          aria-hidden="true"
          style={visuallyHiddenSelectStyle}
          onChange={handleNativeChange}
          onBlur={onBlur}
          onFocus={(event) => {
            onFocus?.(event);
            if (event.currentTarget === document.activeElement) triggerRef.current?.focus();
          }}
          onInvalid={(event) => {
            onInvalid?.(event);
            queueMicrotask(() => triggerRef.current?.focus());
          }}
        >
          {children}
        </select>
        <Select.Root
          value={selectedValue}
          disabled={disabled}
          open={open}
          onOpenChange={setOpen}
          onValueChange={handleValueChange}
        >
          <Select.Trigger
            ref={setTriggerRef}
            id={controlId}
            disabled={disabled}
            dir={resolvedDir}
            aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : implicitLabel)}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={required || undefined}
            title={title}
            style={style}
            onFocus={(event) => dispatchFocusEvent("focusin", event)}
            onBlur={(event) => dispatchFocusEvent("focusout", event)}
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
          </Select.Trigger>
          <Select.Portal container={portalContainer ?? undefined}>
            <Select.Positioner
              data-base-ui-swipe-ignore=""
              side={menuSide}
              sideOffset={5}
              align={menuAlign}
              alignItemWithTrigger={false}
              className="z-[140] w-[var(--anchor-width)] max-w-[min(92vw,32rem)]"
            >
              <Select.Popup
                dir={resolvedDir}
                className={cn(
                  "overflow-y-auto rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-1.5 text-sm text-[rgb(var(--color-ink))] shadow-xl outline-none",
                  menuClassName,
                )}
                style={{ maxHeight: menuMaxHeight }}
              >
                <Select.List>
                  <div className="grid gap-0.5">
                    {entries.map((entry) => {
                      if (entry.type === "group") {
                        return (
                          <Select.Group key={entry.key}>
                            {entry.label ? (
                              <Select.GroupLabel className="px-3 py-2 text-xs font-semibold text-slate-500">
                                {entry.label}
                              </Select.GroupLabel>
                            ) : null}
                            {entry.options
                              .filter((option) => !option.hidden)
                              .map((option, optionIndex) => (
                                <MenuOption
                                  key={`${entry.key}-${option.value}-${optionIndex}`}
                                  option={option}
                                />
                              ))}
                          </Select.Group>
                        );
                      }
                      if (entry.option.hidden) return null;
                      return <MenuOption key={entry.key} option={entry.option} />;
                    })}
                  </div>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </>
    );
  },
);

function MenuOption({ option }: { option: SelectOption }) {
  return (
    <Select.Item
      value={option.value}
      disabled={option.disabled}
      label={flattenText(option.label)}
      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-start outline-none data-[highlighted]:bg-[rgb(var(--surface-muted))] data-[selected]:font-semibold data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
    >
      <Select.ItemText className="min-w-0 flex-1">{option.label}</Select.ItemText>
      <Select.ItemIndicator>
        <Check size={16} className="shrink-0 text-brand" aria-hidden="true" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}
