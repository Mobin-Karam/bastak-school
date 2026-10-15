import { Eye, EyeOff, LoaderCircle, Minus } from "lucide-react";
import {
  ComponentProps,
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  HTMLAttributes,
} from "react";
import { cn } from "../lib/utils";
import { useOptionalAdminLanguage, useSharedUiCopy } from "./locale";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "soft" | "danger" | "ghost";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
  loadingLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        `
          inline-flex
          h-11
          items-center
          justify-center

          gap-2

          rounded-lg

          px-[1.125rem]

          text-sm
          font-semibold

          transition-all
          duration-200

          active:scale-[0.98]

          disabled:pointer-events-none
          disabled:cursor-not-allowed
          disabled:opacity-50

          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-brand/20
          motion-reduce:transition-none
          motion-reduce:active:scale-100
          `,

        variant === "primary" &&
          `
            bg-brand
            text-[rgb(var(--primary-foreground))]

          shadow-none

            hover:brightness-95
            hover:shadow-sm
            `,

        variant === "soft" &&
          `
            border
            border-[rgb(var(--border-subtle))]

            bg-[rgb(var(--surface-card))]

            text-[rgb(var(--color-ink))]

            hover:bg-brand/5
            hover:border-brand/30

            dark:bg-slate-900
            `,

        variant === "danger" &&
          `
            bg-rosewood
            text-[rgb(var(--destructive-foreground))]

            hover:brightness-95
            hover:shadow-md
            `,

        variant === "ghost" &&
          `
            text-slate-600

            hover:bg-slate-100

            dark:text-slate-300
            dark:hover:bg-slate-800
            `,

        size === "sm" && "h-9 rounded-md px-2.5 text-xs",
        size === "icon" && "size-10 h-10 rounded-lg p-0",

        className,
      )}
      {...props}
    >
      {loading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}

      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
});

Button.displayName = "Button";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        `
        rounded-lg
        
        px-3

        py-3

        border

        border-[rgb(var(--border-subtle))]

        bg-[rgb(var(--surface-card))]

        shadow-[var(--shadow-surface)]

        transition-all
        duration-200

        `,

        className,
      )}
      {...props}
    />
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          `

h-10

w-full

rounded-lg


border

border-[rgb(var(--border-subtle))]


bg-[rgb(var(--surface-card))]


px-4


text-sm


text-[rgb(var(--color-ink))]


outline-none


transition-all


placeholder:text-slate-400


hover:border-brand/40

disabled:cursor-not-allowed disabled:opacity-60

read-only:bg-[rgb(var(--surface-muted))] read-only:text-slate-500

aria-[invalid=true]:border-rosewood aria-[invalid=true]:ring-rosewood/10


focus:border-brand

focus:ring-4

focus:ring-brand/10


dark:placeholder:text-slate-500


`,

          props.className,
        )}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function Textarea(props, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        className={cn(
          `

min-h-24

w-full


rounded-lg


border

border-[rgb(var(--border-subtle))]


bg-[rgb(var(--surface-card))]


px-4

py-3


text-sm


text-[rgb(var(--color-ink))]


outline-none


transition-all


placeholder:text-slate-400


hover:border-brand/40

disabled:cursor-not-allowed disabled:opacity-60

read-only:bg-[rgb(var(--surface-muted))] read-only:text-slate-500

aria-[invalid=true]:border-rosewood aria-[invalid=true]:ring-rosewood/10


focus:border-brand


focus:ring-4

focus:ring-brand/10


dark:placeholder:text-slate-500


`,

          props.className,
        )}
      />
    );
  },
);

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  /** A concise controlled-state callback for form code that does not need the DOM event. */
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * A native checkbox with the Admin focus, colour and disabled-state treatment.
 * Prefer CheckboxGroup when several independent choices answer one question.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, onChange, onCheckedChange, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.currentTarget.checked);
      }}
      className={cn(
        "size-5 shrink-0 cursor-pointer rounded border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-brand accent-brand transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
    />
  );
});

Checkbox.displayName = "Checkbox";

export type CheckboxGroupOption<T extends string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

/**
 * A labelled list of independent, multi-select choices.
 * Native checkboxes keep Tab, Space and assistive-technology behaviour predictable.
 */
export function CheckboxGroup<T extends string>({
  legend,
  description,
  options,
  value,
  onValueChange,
  selectAllLabel,
  selectAllDescription,
  disabled = false,
  className,
  listClassName,
}: {
  legend: ReactNode;
  description?: ReactNode;
  options: readonly CheckboxGroupOption<T>[];
  value: readonly T[];
  onValueChange: (value: T[]) => void;
  selectAllLabel?: ReactNode;
  selectAllDescription?: ReactNode;
  disabled?: boolean;
  className?: string;
  listClassName?: string;
}) {
  const groupId = useId();
  const descriptionId = `${groupId}-description`;
  const selectableOptions = options.filter((option) => !option.disabled);
  const selectedValues = new Set(value);
  const selectedCount = options.filter((option) => selectedValues.has(option.value)).length;
  const allSelected =
    selectableOptions.length > 0 &&
    selectableOptions.every((option) => selectedValues.has(option.value));
  const partiallySelected =
    !allSelected && selectableOptions.some((option) => selectedValues.has(option.value));

  const toggleOption = (option: CheckboxGroupOption<T>, checked: boolean) => {
    onValueChange(
      checked
        ? Array.from(new Set([...value, option.value]))
        : value.filter((selectedValue) => selectedValue !== option.value),
    );
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onValueChange(
        Array.from(new Set([...value, ...selectableOptions.map((option) => option.value)])),
      );
      return;
    }
    const selectableValues = new Set(selectableOptions.map((option) => option.value));
    onValueChange(value.filter((selectedValue) => !selectableValues.has(selectedValue)));
  };

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={description ? descriptionId : undefined}
      className={cn("min-w-0 space-y-3", className)}
    >
      <legend className="text-sm font-bold text-[rgb(var(--color-ink))]">{legend}</legend>
      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}

      {selectAllLabel ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-dashed border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-2.5 transition-colors hover:border-brand/45 disabled:cursor-not-allowed">
          <Checkbox
            checked={allSelected}
            aria-label={typeof selectAllLabel === "string" ? selectAllLabel : undefined}
            onChange={(event) => toggleAll(event.currentTarget.checked)}
            ref={(element) => {
              if (element) element.indeterminate = partiallySelected;
            }}
          />
          <span className="grid gap-0.5 text-sm text-[rgb(var(--color-ink))]">
            <span className="flex items-center gap-1.5 font-semibold">
              {partiallySelected ? <Minus size={14} aria-hidden="true" /> : null}
              {selectAllLabel}
            </span>
            {selectAllDescription ? (
              <span className="text-xs font-normal leading-5 text-slate-600 dark:text-slate-400">
                {selectAllDescription}
              </span>
            ) : null}
          </span>
        </label>
      ) : null}

      <div className={cn("grid gap-2", listClassName)}>
        {options.map((option) => {
          const checked = selectedValues.has(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-3 transition-colors hover:border-brand/45 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20",
                checked && "border-brand/60 bg-brand/5",
                (disabled || option.disabled) && "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={option.disabled}
                onCheckedChange={(nextChecked) => toggleOption(option, nextChecked)}
              />
              <span className="grid gap-0.5 text-sm text-[rgb(var(--color-ink))]">
                <span className="font-semibold">{option.label}</span>
                {option.description ? (
                  <span className="text-xs font-normal leading-5 text-slate-600 dark:text-slate-400">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
        {selectedCount} / {options.length}
      </p>
    </fieldset>
  );
}

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(
  function Select(props, ref) {
    return (
      <select
        ref={ref}
        {...props}
        className={cn(
          `

h-11


w-full


rounded-xl


border


border-[rgb(var(--border-subtle))]


bg-[rgb(var(--surface-card))]


px-4


text-sm


text-[rgb(var(--color-ink))]


outline-none


transition-all


hover:border-brand/40

disabled:cursor-not-allowed disabled:opacity-60

aria-[invalid=true]:border-rosewood aria-[invalid=true]:ring-rosewood/10


focus:border-brand


focus:ring-4


focus:ring-brand/10


`,

          props.className,
        )}
      />
    );
  },
);

type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

export function Badge({
  children,
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        `
inline-flex
items-center
rounded-md
px-2
py-0.5
text-xs
font-semibold
transition
`,
        tone === "neutral" &&
          `
bg-slate-100
text-slate-700
dark:bg-slate-800
dark:text-slate-300
`,
        tone === "green" &&
          `
bg-emerald-500/10
text-emerald-600
dark:text-emerald-400
`,
        tone === "amber" &&
          `
bg-amber-500/10
text-amber-600
dark:text-amber-400
`,
        tone === "red" &&
          `
bg-rose-500/10
text-rose-600
dark:text-rose-400
`,
        tone === "blue" &&
          `
bg-blue-500/10
text-blue-600
dark:text-blue-400
`,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex min-h-40 flex-col items-center justify-center gap-4",
        "rounded-2xl border border-dashed border-[rgb(var(--border-subtle))]",
        "bg-[rgb(var(--surface-muted))] p-6 text-center",
        "text-sm text-slate-500 dark:text-slate-400",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-slate-900"
        >
          {icon}
        </span>
      ) : null}

      <div className="grid gap-1.5">
        <strong className="text-base font-black text-ink">{title}</strong>

        {description ? <p className="mx-auto max-w-xl text-xs leading-6">{description}</p> : null}
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const copy = useSharedUiCopy();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="

animate-pulse


rounded-2xl


border

border-[rgb(var(--border-subtle))]


bg-[rgb(var(--surface-card))]


p-5


text-sm


text-slate-500


dark:text-slate-400

"
    >
      {label || copy.loading("")}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200"
    >
      <strong>{title}</strong>
      {description ? <p className="max-w-xl text-xs leading-5">{description}</p> : null}
      {action}
    </div>
  );
}

export function Field({
  label,
  children,
  description,
  error,
  required = false,
  id,
}: {
  label: string;
  children: ReactNode;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [description ? descriptionId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  type ControlProps = {
    id?: string;
    required?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  };
  const target = findFieldControl(children);
  const element = target as ReactElement<ControlProps> | null;
  const controlId = element ? element.props.id || fieldId : undefined;
  const control = element
    ? enhanceFieldControl(children, element, {
        id: controlId,
        required: element.props.required ?? required,
        "aria-describedby": element.props["aria-describedby"] || describedBy,
        "aria-invalid": element.props["aria-invalid"] ?? (error ? true : undefined),
      })
    : children;
  const labelContent = (
    <>
      {label}
      {required ? (
        <span className="ms-1 text-rosewood" aria-hidden="true">
          *
        </span>
      ) : null}
    </>
  );
  return (
    <div
      className="

grid

gap-2


text-sm


font-medium


text-[rgb(var(--color-ink))]

"
    >
      {controlId ? <label htmlFor={controlId}>{labelContent}</label> : <span>{labelContent}</span>}

      {control}

      {description ? (
        <span id={descriptionId} className="text-xs font-normal text-slate-500 dark:text-slate-400">
          {description}
        </span>
      ) : null}

      {error && (
        <span
          id={errorId}
          role="alert"
          className="

text-xs

font-medium

text-rosewood

"
        >
          {error}
        </span>
      )}
    </div>
  );
}

function isFieldControl(element: ReactElement) {
  return (
    (element.props as { "data-field-control"?: boolean })["data-field-control"] === true ||
    (typeof element.type === "string" && ["input", "textarea", "select"].includes(element.type)) ||
    element.type === Input ||
    element.type === PasswordInput ||
    element.type === Textarea ||
    element.type === Select
  );
}

function findFieldControl(node: ReactNode): ReactElement | null {
  let result: ReactElement | null = null;
  Children.forEach(node, (child) => {
    if (result || !isValidElement(child)) return;
    if (isFieldControl(child)) {
      result = child;
      return;
    }
    result = findFieldControl((child.props as { children?: ReactNode }).children);
  });
  return result;
}

function enhanceFieldControl(
  node: ReactNode,
  target: ReactElement,
  props: Record<string, unknown>,
): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    if (child === target) return cloneElement(child, props);
    const nested = (child.props as { children?: ReactNode }).children;
    return nested === undefined
      ? child
      : cloneElement(child, {}, enhanceFieldControl(nested, target, props));
  });
}

export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<"input">, "type">>(
  function PasswordInput({ className, id, disabled, dir = "ltr", ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = useState(false);
    const language = useOptionalAdminLanguage();
    const label =
      language === "fa"
        ? visible
          ? "پنهان کردن رمز عبور"
          : "نمایش رمز عبور"
        : visible
          ? "Hide password"
          : "Show password";
    return (
      <div className="relative" dir={dir}>
        <Input
          {...props}
          ref={ref}
          id={inputId}
          dir={dir}
          disabled={disabled}
          type={visible ? "text" : "password"}
          className={cn("pe-12", className)}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-controls={inputId}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 end-0 grid min-h-10 w-11 place-items-center rounded-e-lg text-slate-500 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
        >
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
    );
  },
);
