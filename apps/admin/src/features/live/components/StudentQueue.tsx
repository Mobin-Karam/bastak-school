import { Badge, Card, EmptyState } from "../../../shared/ui/ui";
import { fa } from "../../../shared/lib/utils";
import { needsAttention } from "../lib/live-helpers";
import type { LivePanel, LiveStudent } from "../model/live.types";
import { CompactSkeleton } from "./CompactSkeleton";
import { StudentRow } from "./StudentRow";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";

export function StudentQueue({
  panel,
  loading,
  students,
  selectedId,
  now,
  onSelect,
}: {
  panel: LivePanel;
  loading: boolean;
  students: LiveStudent[];
  selectedId?: string;
  now: number;
  onSelect: (id: string) => void;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  return (
    <Card
      className={[
        panel === "students" ? "flex" : "hidden lg:flex",
        "min-h-0 flex-col overflow-hidden p-0",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <strong>{copy.operationsQueue}</strong>

        <Badge tone={students.some(needsAttention) ? "red" : "green"}>
          {language === "fa"
            ? fa(students.filter(needsAttention).length)
            : students.filter(needsAttention).length.toLocaleString("en-US")}{" "}
          {copy.attention}
        </Badge>
      </div>

      {loading ? (
        <CompactSkeleton />
      ) : students.length ? (
        <div className="min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain">
          {students.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              active={selectedId === student.id}
              now={now}
              onClick={() => onSelect(student.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={copy.noMatches} />
      )}
    </Card>
  );
}
