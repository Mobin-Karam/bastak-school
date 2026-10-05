import { Activity } from "lucide-react";
import { Badge, Card, EmptyState } from "../../../shared/ui/ui";
import type { LiveEvent, LivePanel } from "../model/live.types";
import { CompactSkeleton } from "./CompactSkeleton";
import { TimelineItem } from "./TimelineItem";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";

export function TimelinePanel({
  panel,
  loading,
  events,
  formatDateTime,
}: {
  panel: LivePanel;
  loading: boolean;
  events: LiveEvent[];
  formatDateTime: (value?: string | Date) => string;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  return (
    <Card
      className={[
        panel === "timeline" ? "flex" : "hidden lg:flex",
        "min-h-0 flex-col overflow-hidden p-0",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-2">
          <Activity size={17} className="text-brand" />

          <strong>{copy.recentEvents}</strong>
        </span>

        <Badge>{events.length.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}</Badge>
      </div>

      {events.length ? (
        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain">
          {events.map((event) => (
            <TimelineItem key={event.id} event={event} formatDateTime={formatDateTime} />
          ))}
        </div>
      ) : !loading ? (
        <EmptyState title={copy.noEvents} />
      ) : (
        <CompactSkeleton />
      )}
    </Card>
  );
}
