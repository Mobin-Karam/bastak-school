import { ArrowUpLeft, BookOpenCheck, CalendarDays, FileBarChart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";
import { studentWorkflowActions } from "../model/student-workflow";

const actionIcons = {
  planner: CalendarDays,
  learning: Sparkles,
  reports: FileBarChart,
  exams: BookOpenCheck,
} as const;

export function StudentWorkflowActions({
  studentId,
  capabilities,
}: {
  studentId: string;
  capabilities: readonly string[];
}) {
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const actions = studentWorkflowActions(studentId, capabilities);
  if (!actions.length) return null;

  return (
    <section
      className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800"
      aria-labelledby="student-workflow-heading"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            id="student-workflow-heading"
            className="text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            {copy.workflowTitle}
          </h3>
          <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {copy.workflowDescription}
          </p>
        </div>
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = actionIcons[action.id];
          const title = copy[`workflow${action.id[0].toUpperCase()}${action.id.slice(1)}`];
          const description =
            copy[`workflow${action.id[0].toUpperCase()}${action.id.slice(1)}Description`];
          return (
            <Link
              key={action.id}
              to={action.destination}
              className="group flex min-w-0 items-center gap-2 rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-2.5 py-2 text-start outline-none transition hover:border-brand/40 hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`${title}: ${description}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
                <Icon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {title}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {description}
                </span>
              </span>
              <ArrowUpLeft
                size={13}
                className="shrink-0 text-slate-400 transition group-hover:text-brand rtl:rotate-90"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
