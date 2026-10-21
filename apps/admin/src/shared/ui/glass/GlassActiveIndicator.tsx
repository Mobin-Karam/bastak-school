import type { CSSProperties } from "react";

/**
 * A lightweight active-tab treatment for equally sized navigation slots.
 *
 * It uses logical CSS positioning, so its movement is correct in both RTL and
 * LTR without measurements, observers, or an animation dependency.
 */
export function GlassActiveIndicator({ index, count }: { index: number; count: number }) {
  if (index < 0 || count < 1) return null;

  const style = {
    "--glass-active-index": index,
    "--glass-active-count": count,
  } as CSSProperties & Record<"--glass-active-index" | "--glass-active-count", number>;

  return <span aria-hidden="true" className="glass-active-indicator" style={style} />;
}
