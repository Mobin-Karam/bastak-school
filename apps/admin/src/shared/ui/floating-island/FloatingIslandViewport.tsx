import {
  Bell,
  CalendarCheck2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Coins,
  Headphones,
  Pause,
  Play,
  GraduationCap,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { AdminPerformanceProfile } from "../../../app/layout/lib/device-performance";
import { useFloatingIsland } from "./FloatingIslandProvider";
import type { FloatingIslandActivity, FloatingIslandKind } from "./island.types";

const activityIcons: Record<FloatingIslandKind, typeof Bell> = {
  notification: Bell,
  system: CircleAlert,
  attendance: CalendarCheck2,
  class: GraduationCap,
  prayer: Clock3,
  reward: Coins,
  audio: Headphones,
};

function primaryActivity(activities: readonly FloatingIslandActivity[]) {
  return [...activities].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  )[0];
}

export function FloatingIslandViewport({
  direction,
  performance,
}: {
  direction: "rtl" | "ltr";
  performance: AdminPerformanceProfile;
}) {
  const island = useFloatingIsland();
  const ref = useRef<HTMLDivElement>(null);
  const activity = useMemo(() => primaryActivity(island.activities), [island.activities]);
  const expanded = activity ? island.expandedId === activity.id : false;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") island.collapse();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) island.collapse();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [expanded, island]);

  if (!activity) return null;
  const Icon = activityIcons[activity.kind];
  const compactLabel = activity.description
    ? `${activity.title}، ${activity.description}`
    : activity.title;
  const isAudio = activity.kind === "audio" && Boolean(activity.audioSrc);
  const toggleAudio = () => {
    if (!audio.current) return;
    if (audio.current.paused) void audio.current.play();
    else audio.current.pause();
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-[max(0.5rem,env(safe-area-inset-top))] z-40 flex justify-center"
      dir={direction}
    >
      <section
        ref={ref}
        aria-label="وضعیت برنامه"
        className={cn(
          "floating-island pointer-events-auto overflow-hidden border border-white/10 bg-[#050506] text-white shadow-[0_16px_42px_rgba(0,0,0,0.4),inset_0_1px_rgba(255,255,255,0.12)] transition-[width,max-height,border-radius,transform] duration-500 ease-[cubic-bezier(.2,.8,.17,1)] motion-reduce:transition-none",
          performance === "enhanced" && "backdrop-blur-xl",
          performance === "standard" && "backdrop-blur-md",
          expanded
            ? "w-[min(25rem,calc(100vw-1.5rem))] max-h-72 rounded-[1.8rem]"
            : isAudio
              ? "w-[min(13.75rem,calc(100vw-1.5rem))] max-h-12 rounded-[1.45rem]"
              : "w-[min(13.75rem,calc(100vw-1.5rem))] max-h-12 rounded-[1.45rem]",
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`floating-island-${activity.id}`}
          onClick={() => (expanded ? island.collapse() : island.expand(activity.id))}
          className="flex min-h-12 w-full items-center gap-2.5 px-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        >
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-[0.6rem] shadow-inner",
              isAudio ? "bg-violet-400/25 text-violet-100" : "bg-white/12 text-white",
            )}
          >
            <Icon size={16} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-bold tracking-[-0.01em]">
            {isAudio ? activity.title : compactLabel}
          </span>
          {isAudio ? (
            <span
              aria-label={playing ? "در حال پخش" : "آماده پخش"}
              className={cn("flex h-4 items-center gap-0.5", playing && "floating-audio-bars")}
            >
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : (
            <span className="size-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_10px_rgb(var(--brand))]" />
          )}
          <ChevronDown
            className={cn(
              "shrink-0 text-white/60 transition-transform duration-500 motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
            size={16}
            aria-hidden="true"
          />
        </button>
        <div
          id={`floating-island-${activity.id}`}
          hidden={!expanded}
          className="grid gap-4 border-t border-white/10 px-4 pb-4 pt-3"
        >
          <div className="flex gap-3">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-[0.9rem]",
                isAudio ? "bg-violet-400/20 text-violet-100" : "bg-white/10 text-white",
              )}
            >
              <Icon size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.08em] text-white/45">
                {isAudio ? "در حال پخش" : "فعالیت جدید"}
              </p>
              <h2 className="mt-1 text-sm font-black tracking-[-0.02em]">{activity.title}</h2>
              {activity.description ? (
                <p className="mt-1 text-xs leading-5 text-white/65">{activity.description}</p>
              ) : null}
            </div>
          </div>
          {isAudio ? (
            <div className="grid gap-2">
              <audio
                ref={audio}
                src={activity.audioSrc}
                preload="metadata"
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                  setPlaying(false);
                  setProgress(0);
                }}
                onTimeUpdate={(event) => {
                  const nextDuration = event.currentTarget.duration;
                  setDuration(nextDuration || 0);
                  setProgress(nextDuration ? event.currentTarget.currentTime / nextDuration : 0);
                }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                aria-label="موقعیت پخش"
                onChange={(event) => {
                  if (audio.current && duration)
                    audio.current.currentTime = Number(event.target.value) * duration;
                }}
                className="h-1 w-full cursor-pointer accent-white"
              />
              <div
                className="flex justify-between text-[10px] font-semibold tabular-nums text-white/45"
                dir="ltr"
              >
                <span>{formatAudioTime(progress * duration)}</span>
                <span>{formatAudioTime(duration)}</span>
              </div>
              <button
                type="button"
                onClick={toggleAudio}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-black outline-none transition hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? "توقف پخش" : "پخش صوت"}
              </button>
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            {activity.dismissible ? (
              <button
                type="button"
                onClick={() => island.dismiss(activity.id)}
                className="grid size-10 place-items-center rounded-xl text-white/55 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
                aria-label="بستن فعالیت"
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
            {activity.action ? (
              <Link
                to={activity.action.to}
                onClick={island.collapse}
                className="rounded-xl bg-brand px-3.5 py-2.5 text-xs font-black text-white outline-none transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {activity.action.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatAudioTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "۰:۰۰";
  const minutes = Math.floor(value / 60).toLocaleString("fa-IR");
  const seconds = Math.floor(value % 60).toLocaleString("fa-IR", { minimumIntegerDigits: 2 });
  return `${minutes}:${seconds}`;
}
