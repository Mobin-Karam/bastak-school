import { Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";
import type { LivePanel, LiveStudent } from "../model/live.types";
import { StudentDetail } from "./StudentDetail";

export function StudentDetailPanel({
  panel,
  student,
  now,
  formatDateTime,
}: {
  panel: LivePanel;
  student?: LiveStudent;
  now: number;
  formatDateTime: (value?: string | Date) => string;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  return (
    <Card
      className={[
        panel === "details" ? "flex" : "hidden lg:flex",
        "min-h-0 flex-col overflow-hidden p-0",
      ].join(" ")}
    >
      <div className="border-b px-3 py-2">
        <strong>{copy.quickControls}</strong>

        <p className="text-xs text-slate-500">{copy.selectedDetails}</p>
      </div>

      {student ? (
        <StudentDetail student={student} now={now} formatDateTime={formatDateTime} />
      ) : (
        <EmptyState title={copy.noStudent} />
      )}
    </Card>
  );
}
