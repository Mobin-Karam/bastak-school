import { useId, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export type FarsiChartConfig = Record<string, { label: string; color: string }>;

/** Responsive chart frame following FarsiUI's ChartContainer/config convention. */
export function ChartContainer({
  config,
  className,
  children,
  role,
  "aria-label": ariaLabel,
  style,
}: {
  config: FarsiChartConfig;
  className: string;
  children: ReactElement;
  role?: "img";
  "aria-label"?: string;
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const variables = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  );
  return (
    <div
      data-chart={`chart-${id}`}
      className={className}
      role={role}
      aria-label={ariaLabel}
      style={{ ...style, ...variables } as CSSProperties}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/** Compact RTL tooltip content compatible with the FarsiUI chart tooltip slot. */
export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType> & { label?: ReactNode }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      dir="rtl"
      className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2 text-xs shadow-lg"
    >
      {label ? <p className="mb-1 font-bold text-[rgb(var(--ink))]">{label}</p> : null}
      {payload.map((item, index) => (
        <p
          key={`${item.dataKey ?? item.name ?? "series"}-${index}`}
          className="flex items-center gap-2"
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="text-[rgb(var(--muted))]">{item.name}</span>
          <strong className="text-[rgb(var(--ink))]">
            {Number(item.value ?? 0).toLocaleString("fa-IR")}
          </strong>
        </p>
      ))}
    </div>
  );
}

export { Tooltip as ChartTooltip };
