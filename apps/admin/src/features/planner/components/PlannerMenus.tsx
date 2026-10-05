import { useEffect, useRef, useState } from "react";
import { Calendar, CalendarDays, Command, Plus } from "lucide-react";
import type { Plan, PlanTask } from "../../../shared/types/domain";
import { todayIso } from "../../../shared/lib/utils";
import type { PlannerMode, TaskFilter } from "../model/planner.types";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useLocale } from "../../../shared/ui/locale";
import { plannerCopy, plannerFilterLabel, plannerModeLabel } from "../model/planner-copy";

export function ViewSwitch({
  value,
  onChange,
}: {
  value: PlannerMode;
  onChange: (mode: PlannerMode) => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  return (
    <SegmentedControl
      ariaLabel={copy.view}
      value={value}
      onValueChange={onChange}
      options={(["day", "week", "month", "list"] as PlannerMode[]).map((mode) => ({
        value: mode,
        label: plannerModeLabel(mode, language),
      }))}
    />
  );
}
export function FilterMenu({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  return (
    <div className="w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <strong className="block px-2 py-1 text-xs">{copy.planStatus}</strong>
      {(["all", "published", "draft", "incomplete"] as TaskFilter[]).map((item) => (
        <button
          key={item}
          className={`mt-1 block w-full rounded-md px-3 py-2 text-start text-sm ${value === item ? "bg-indigo-50 text-brand" : "hover:bg-slate-50"}`}
          onClick={() => onChange(item)}
        >
          {plannerFilterLabel(item, language)}
        </button>
      ))}
    </div>
  );
}
export function MoreMenu({
  onClose,
  onPlan,
  onPublish,
  onTransfer,
}: {
  onClose: () => void;
  onPlan: () => void;
  onPublish: (value: boolean) => void;
  onTransfer: () => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  return (
    <div className="absolute start-0 top-11 z-40 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
      <button
        className="block w-full rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50"
        onClick={onPlan}
      >
        {copy.planSettings}
      </button>
      <button
        className="block w-full rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50"
        onClick={() => onPublish(true)}
      >
        {copy.publishRange}
      </button>
      <button
        className="block w-full rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50"
        onClick={() => onPublish(false)}
      >
        {copy.unpublishRange}
      </button>
      <button
        className="block w-full rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50"
        onClick={onTransfer}
      >
        {copy.importExportJson}
      </button>
      <button
        className="mt-1 block w-full border-t px-3 py-2 text-start text-xs text-slate-400"
        onClick={onClose}
      >
        {copy.close}
      </button>
    </div>
  );
}
export function CommandPalette({
  plans,
  onClose,
  onDate,
  onView,
  onTask,
  onCreate,
}: {
  plans: Plan[];
  onClose: () => void;
  onDate: (date: string) => void;
  onView: (mode: PlannerMode) => void;
  onTask: (plan: Plan, task: PlanTask) => void;
  onCreate?: () => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const tasks = plans
    .flatMap((plan) => plan.tasks.map((task) => ({ plan, task })))
    .filter((x) => [x.task.title, x.task.subject, x.plan.planDate].join(" ").includes(query))
    .slice(0, 12);
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-start bg-slate-950/55 px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={copy.commandPalette}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <label className="flex h-14 items-center gap-3 border-b px-4">
          <Command size={20} className="text-brand" />
          <input
            ref={input}
            className="min-w-0 flex-1 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.commandSearch}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
          <kbd className="text-xs text-slate-400">Esc</kbd>
        </label>
        <div className="max-h-[55vh] overflow-auto p-2">
          <div className="grid grid-cols-2 gap-2">
            {onCreate ? (
              <PaletteButton icon={Plus} label={copy.newActivity} onClick={onCreate} />
            ) : null}
            <PaletteButton
              icon={Calendar}
              label={copy.goToToday}
              onClick={() => onDate(todayIso())}
            />
            {(["day", "week", "month", "list"] as PlannerMode[]).map((mode) => (
              <PaletteButton
                key={mode}
                icon={CalendarDays}
                label={copy.viewMode.replace("{mode}", plannerModeLabel(mode, language))}
                onClick={() => onView(mode)}
              />
            ))}
          </div>
          {query ? (
            <>
              <h4 className="px-2 pb-1 pt-4 text-xs text-slate-400">{copy.results}</h4>
              {tasks.map(({ plan, task }) => (
                <button
                  key={task.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-slate-50"
                  onClick={() => onTask(plan, task)}
                >
                  <span className="font-mono text-xs text-slate-400">{task.start}</span>
                  <strong className="truncate text-sm">
                    {task.title || task.subject || task.type}
                  </strong>
                  <small className="ms-auto text-slate-400">{plan.planDate}</small>
                </button>
              ))}
              {!tasks.length ? (
                <p className="px-3 py-4 text-sm text-slate-500">{copy.noResults}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
function PaletteButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:border-brand hover:bg-indigo-50"
      onClick={onClick}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
