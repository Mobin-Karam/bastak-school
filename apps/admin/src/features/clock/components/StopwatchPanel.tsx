import { Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useStopwatch } from "../hooks/useStopwatch";
import { formatStopwatchDuration } from "../lib/time";
import { clockCopy } from "../model/clock-copy";
import { useLocale } from "../../../shared/ui/locale";

export function StopwatchPanel() {
  const { language } = useLocale();
  const copy = clockCopy[language];
  const stopwatch = useStopwatch(50);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 px-3 py-5 text-center dark:bg-slate-950/45">
        <div
          dir="ltr"
          className="font-mono text-[2rem] font-black tabular-nums tracking-wider text-slate-900 dark:text-white sm:text-4xl"
        >
          {formatStopwatchDuration(stopwatch.elapsedMs)}
        </div>
        <div className="mt-2 text-[10px] font-semibold text-slate-400">
          {stopwatch.running
            ? copy.runningAfterClose
            : stopwatch.elapsedMs > 0
              ? copy.pausedSaved
              : copy.ready}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={stopwatch.running ? stopwatch.pause : stopwatch.start}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {stopwatch.running ? (
            <>
              <Pause size={17} /> {copy.stop}
            </>
          ) : (
            <>
              <Play size={17} /> {stopwatch.elapsedMs > 0 ? copy.continue : copy.start}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={stopwatch.lap}
          disabled={stopwatch.elapsedMs <= 0}
          className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label={copy.lap}
        >
          <Flag size={17} />
        </button>
        <button
          type="button"
          onClick={stopwatch.reset}
          disabled={stopwatch.elapsedMs <= 0}
          className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label={copy.resetStopwatch}
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {stopwatch.laps.length > 0 && (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
          {stopwatch.laps.map((lap, index) => {
            const previousLap = stopwatch.laps[index + 1] ?? 0;
            return (
              <div
                key={`${lap}-${index}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs odd:bg-slate-50 dark:odd:bg-slate-800/60"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {copy.lapLabel} {stopwatch.laps.length - index}
                </span>
                <span
                  dir="ltr"
                  className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100"
                >
                  {formatStopwatchDuration(lap - previousLap)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
