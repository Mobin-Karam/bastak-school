import { AlertTriangle, BookOpenCheck, Clock3, PauseCircle, Users, Wifi } from "lucide-react";
import type { LiveFilter, LiveSnapshot } from "../model/live.types";
import { SummaryCard } from "./SummaryCard";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";

export function LiveSummaryGrid({
  summary,
  filter,
  onFilterChange,
}: {
  summary: NonNullable<LiveSnapshot["summary"]> | undefined;
  filter: LiveFilter;
  onFilterChange: (filter: LiveFilter) => void;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  return (
    <section className="grid shrink-0 grid-cols-3 gap-2 lg:grid-cols-6">
      <SummaryCard
        icon={Users}
        label={copy.all}
        value={summary?.total}
        active={filter === "all"}
        onClick={() => onFilterChange("all")}
      />

      <SummaryCard
        icon={Wifi}
        label={copy.online}
        value={summary?.online}
        tone="green"
        active={filter === "online"}
        onClick={() => onFilterChange("online")}
      />

      <SummaryCard
        icon={BookOpenCheck}
        label={copy.studying}
        value={summary?.studying}
        tone="blue"
        active={filter === "studying"}
        onClick={() => onFilterChange("studying")}
      />

      <SummaryCard
        icon={PauseCircle}
        label={copy.paused}
        value={summary?.paused}
        tone="amber"
        active={filter === "paused"}
        onClick={() => onFilterChange("paused")}
      />

      <SummaryCard
        icon={Clock3}
        label={copy.takingExam}
        value={summary?.takingExam}
        tone="blue"
        active={filter === "taking_exam"}
        onClick={() => onFilterChange("taking_exam")}
      />

      <SummaryCard
        icon={AlertTriangle}
        label={copy.attention}
        value={summary?.attention}
        tone="red"
        active={filter === "attention"}
        onClick={() => onFilterChange("attention")}
      />
    </section>
  );
}
