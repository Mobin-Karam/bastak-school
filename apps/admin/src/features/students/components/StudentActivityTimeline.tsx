import { Activity } from "lucide-react";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";

export function StudentActivityTimeline({ events }: { events: Array<Record<string, unknown>> }) {
  const language = useOptionalAdminLanguage() ?? "fa";
  const copy = studentCopy[language];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={17} className="text-brand" />
        <h3 className="font-black text-ink dark:text-white">{copy.timeline}</h3>
      </div>

      <div className="space-y-2">
        {events.map((event, index) => (
          <div
            key={String(event.id ?? index)}
            className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900"
          >
            <strong>{String(event.eventType ?? copy.activity)}</strong>
            <p className="text-xs text-slate-500">{String(event.createdAt ?? "")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
