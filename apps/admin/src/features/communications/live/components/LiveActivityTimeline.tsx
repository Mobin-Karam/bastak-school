import { Clock3 } from "lucide-react";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";

export function LiveActivityTimeline({ events }: { events: Array<Record<string, unknown>> }) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  if (!events.length) {
    return (
      <div className="rounded-xl border p-4 text-sm text-slate-500">{copy.noActivityRecorded}</div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div
          key={String(event.id ?? index)}
          className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
            <Clock3 size={15} />
          </span>
          <div>
            <strong className="text-sm text-ink dark:text-white">
              {String(event.eventType ?? copy.activity)}
            </strong>
            <p className="text-xs text-slate-500">{String(event.createdAt ?? "")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
