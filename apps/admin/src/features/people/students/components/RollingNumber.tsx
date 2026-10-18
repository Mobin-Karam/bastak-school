import { useEffect, useRef, useState } from "react";

type RollingNumberProps = {
  value: number;
  label: string;
};

type DigitProps = {
  digit: string;
  duration?: number;
};

const ANIMATION_DURATION = 900;

function RollingDigit({ digit, duration = ANIMATION_DURATION }: DigitProps) {
  const [frame, setFrame] = useState({
    previous: digit,
    current: digit,
    phase: "idle" as "idle" | "start" | "moving",
  });

  const currentRef = useRef(digit);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (digit === currentRef.current) return;

    const oldDigit = currentRef.current;
    currentRef.current = digit;

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    // Step 1: Position the new digit above the visible area.
    setFrame({
      previous: oldDigit,
      current: digit,
      phase: "start",
    });

    // Step 2: After paint, move both digits downward.
    animationRef.current = requestAnimationFrame(() => {
      animationRef.current = requestAnimationFrame(() => {
        setFrame((state) => ({
          ...state,
          phase: "moving",
        }));
      });
    });

    // Step 3: Clean up when the movement finishes.
    timeoutRef.current = setTimeout(() => {
      setFrame({
        previous: digit,
        current: digit,
        phase: "idle",
      });
    }, duration + 35);
  }, [digit, duration]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isAnimating = frame.phase !== "idle";
  const isMoving = frame.phase === "moving";

  const timing = {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.45, 0, 0.2, 1)",
  };

  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-[1.3em] w-[0.75em] overflow-hidden align-middle"
    >
      {/* Old digit goes DOWN */}
      {isAnimating && (
        <span
          className="absolute inset-0 flex items-center justify-center will-change-transform motion-reduce:transition-none"
          style={{
            ...timing,
            transitionProperty: "transform, opacity",
            transform: isMoving ? "translateY(110%)" : "translateY(0%)",
            opacity: isMoving ? 0 : 1,
          }}
        >
          {frame.previous}
        </span>
      )}

      {/* New digit comes from TOP */}
      <span
        className="absolute inset-0 flex items-center justify-center will-change-transform motion-reduce:transition-none"
        style={{
          ...timing,
          transitionProperty: "transform",
          transform: isAnimating && !isMoving ? "translateY(-110%)" : "translateY(0%)",
        }}
      >
        {frame.current}
      </span>
    </span>
  );
}

export default function RollingNumber({ value, label }: RollingNumberProps) {
  const number = String(value).padStart(2, "0");

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-[#101c31] px-1 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] sm:rounded-2xl sm:py-4">
      {/* Top light */}
      <div
        aria-hidden="true"
        className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"
      />

      {/* Digital rolling numbers */}
      <div
        dir="ltr"
        aria-label={`${value} ${label}`}
        className="flex h-[1.3em] items-center justify-center whitespace-nowrap text-[clamp(19px,5vw,32px)] font-black leading-none tracking-[.03em] tabular-nums text-cyan-300 [text-shadow:0_0_13px_rgba(34,211,238,.28)]"
        style={{
          fontFamily: "Orbitron, ui-monospace, SFMono-Regular, monospace",
        }}
      >
        {number.split("").map((digit, index) => (
          <RollingDigit key={index} digit={digit} duration={ANIMATION_DURATION} />
        ))}
      </div>

      {/* Persian label */}
      <div className="mt-2 text-[10px] font-medium text-slate-400 sm:text-xs">{label}</div>

      {/* Bottom indicator */}
      <div aria-hidden="true" className="absolute inset-x-[30%] bottom-0 h-[2px] bg-cyan-400/50" />
    </div>
  );
}
