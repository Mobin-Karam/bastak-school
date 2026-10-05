import { CheckSquare, X } from "lucide-react";
import { useLocale } from "../../../shared/ui/locale";
import { plannerCopy } from "../model/planner-copy";

export function PlannerBatchToolbar({
  count,
  onClear,
  onAction,
}: {
  count: number;
  onClear: () => void;
  onAction: (action: string) => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  if (!count) return null;

  return (
    <div
      className="
      flex flex-wrap items-center gap-2
      rounded-xl border border-brand/20
      bg-brand/5 p-3
      dark:bg-brand/10
    "
    >
      <CheckSquare size={16} />

      <strong className="text-sm">
        {copy.selectedActivities.replace(
          "{count}",
          count.toLocaleString(language === "fa" ? "fa-IR" : "en-US"),
        )}
      </strong>

      <button
        onClick={() => onAction("shift")}
        className="rounded-lg bg-white px-3 py-1 text-xs font-bold dark:bg-slate-800"
      >
        {copy.moveTime}
      </button>

      <button
        onClick={() => onAction("publish")}
        className="rounded-lg bg-white px-3 py-1 text-xs font-bold dark:bg-slate-800"
      >
        {copy.changePublication}
      </button>

      <button
        onClick={onClear}
        className="ms-auto grid size-7 place-items-center rounded-lg"
        aria-label={copy.clearSelection}
      >
        <X size={15} />
      </button>
    </div>
  );
}
