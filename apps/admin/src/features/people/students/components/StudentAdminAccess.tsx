import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  FileQuestion,
  LayoutDashboard,
  MessageCircle,
  NotebookTabs,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";

const destinations = [
  ["/admin/learning", "learning", "learningDescription", BookOpenCheck, "learning.read"],
  ["/admin/planner", "planner", "plannerDescription", CalendarDays, "plans.read"],
  ["/admin/exams", "exams", "examsDescription", NotebookTabs, "exams.read"],
  ["/admin/questions", "questions", "questionsDescription", FileQuestion, "questions.read"],
  ["/admin/communication/chat", "chat", "chatDescription", MessageCircle, "chat.read"],
  ["/admin/reports", "reports", "reportsDescription", BarChart3, "reports.read"],
  ["/admin", "dashboard", "dashboardDescription", LayoutDashboard, ""],
] as const;

export function StudentAdminAccess({ selectedId }: { selectedId: string }) {
  const auth = useAuth();
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  if (!selectedId) return null;
  const query = `studentId=${encodeURIComponent(selectedId)}`;
  return (
    <section className="grid gap-3" aria-labelledby="student-access-heading">
      <div>
        <h3 id="student-access-heading" className="text-sm font-black text-ink">
          {copy.workspace}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {copy.workspaceDescription}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {destinations
          .filter(([, , , , capability]) => !capability || auth.can(capability))
          .map(([path, label, description, Icon]) => (
            <Link
              key={path}
              className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              to={`${path}?${query}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand transition group-hover:bg-brand group-hover:text-white dark:bg-slate-800">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-slate-700 dark:text-slate-200">
                  {copy[label]}
                </strong>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {copy[description]}
                </span>
              </span>
              <ChevronRight
                className="shrink-0 text-slate-400 transition group-hover:text-brand rtl:rotate-180"
                size={14}
              />
            </Link>
          ))}
      </div>
    </section>
  );
}
