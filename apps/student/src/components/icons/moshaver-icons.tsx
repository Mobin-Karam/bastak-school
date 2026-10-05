import type { SVGProps } from "react";

/**
 * Product-specific marks only. Generic navigation and actions stay on Lucide;
 * these describe Moshaver concepts that have no equally clear generic symbol.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconFrame({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** A day card, study line, and completed check-in for the daily report flow. */
export function DailyCheckInIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="3" />
      <path d="M8 3.5v3M16 3.5v3M7.5 10h9" />
      <path d="m9 15 2 2 4-4" />
    </IconFrame>
  );
}

/** A planned route recovering after an interruption; used for recovery flows. */
export function PlanRecoveryIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M5 6.5A8 8 0 0 1 19 8" />
      <path d="M19 4.5V8h-3.5" />
      <path d="M19 17.5A8 8 0 0 1 5 16" />
      <path d="M5 19.5V16h3.5" />
      <path d="M9 12h6" />
    </IconFrame>
  );
}

/** A small upward study path for streak/progress contexts. */
export function StudyStreakIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M5 18.5h14" />
      <path d="m6.5 15 3-3 3 2 5-6" />
      <path d="M14.5 8h3v3" />
      <circle cx="6.5" cy="15" r="1" />
    </IconFrame>
  );
}
