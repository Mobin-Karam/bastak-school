import {
  Activity,
  ArrowLeft,
  Check,
  Copy,
  LayoutGrid,
  Pencil,
  ShieldCheck,
  UserPlus,
  UserRound,
  Workflow,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Student } from "../../../shared/types/domain";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { Button, Card } from "../../../shared/ui/ui";
import { studentCopy } from "../model/student-locale";
import {
  formatStudentLastSeen,
  getStudentStatus,
  getStudentUsername,
  getStudentStatusCopy,
  type StudentDetailTab,
} from "./student-ui";
import { StudentWorkflowActions } from "./StudentWorkflowActions";

const tabOptions = [
  ["overview", "overview", LayoutGrid],
  ["activity", "activity", Activity],
  ["profile", "profile", Pencil],
  ["access", "access", Workflow],
  ["security", "security", ShieldCheck],
] as const;

export function StudentDetail({
  student,
  tab,
  onTabChange,
  onBack,
  children,
  dirty = false,
  visibleTabs,
  capabilities = [],
  onCreate,
}: {
  student: Student;
  tab: StudentDetailTab;
  onTabChange: (tab: StudentDetailTab) => void;
  onBack: () => void;
  children: ReactNode;
  dirty?: boolean;
  visibleTabs?: readonly StudentDetailTab[];
  capabilities?: readonly string[];
  onCreate?: () => void;
}) {
  const [copied, setCopied] = useState<"id" | "username" | "">("");
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const status = getStudentStatusCopy(getStudentStatus(student), language);

  async function copyToClipboard(value: string, type: "id" | "username") {
    if (!value || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  }

  return (
    <Card className="min-w-0 overflow-hidden p-0 xl:flex xl:max-h-[calc(100dvh-6rem)] xl:flex-col">
      <div className="z-[1] shrink-0 border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand xl:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {copy.backToList}
        </button>
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <UserRound size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-black text-ink">{student.name}</h2>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}>
                {status.label}
              </span>
              {dirty ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {copy.unsavedChanges}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {copy.lastActivity}: {formatStudentLastSeen(student.last_seen_at, language)}
            </p>
          </div>
          {onCreate ? (
            <Button size="sm" className="ms-auto shrink-0" onClick={onCreate}>
              <UserPlus size={15} />
              {copy.createStudent}
            </Button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void copyToClipboard(student.id, "id")}
            className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-start text-[11px] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
          >
            <span className="min-w-0">
              <span className="block text-slate-500 dark:text-slate-400">{copy.studentId}</span>
              <strong className="block truncate text-slate-700 dark:text-slate-200" dir="ltr">
                {student.id}
              </strong>
            </span>
            {copied === "id" ? (
              <Check size={14} className="text-brand" />
            ) : (
              <Copy size={14} className="text-slate-400" />
            )}
          </button>
          <button
            type="button"
            disabled={!getStudentUsername(student)}
            onClick={() => void copyToClipboard(getStudentUsername(student), "username")}
            className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-start text-[11px] hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
          >
            <span className="min-w-0">
              <span className="block text-slate-500 dark:text-slate-400">{copy.username}</span>
              <strong className="block truncate text-slate-700 dark:text-slate-200" dir="ltr">
                {getStudentUsername(student) || copy.usernameNotSet}
              </strong>
            </span>
            {copied === "username" ? (
              <Check size={14} className="text-brand" />
            ) : (
              <Copy size={14} className="text-slate-400" />
            )}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          {copied === "id" ? copy.idCopied : copied === "username" ? copy.usernameCopied : ""}
        </span>
        <StudentWorkflowActions studentId={student.id} capabilities={capabilities} />
      </div>

      <nav
        className="z-[1] shrink-0 overflow-x-auto border-b border-slate-200 bg-[rgb(var(--surface-card))] px-2 dark:border-slate-800"
        aria-label={copy.detailSections}
      >
        <div className="flex min-w-max items-center gap-1">
          {tabOptions
            .filter(([value]) => !visibleTabs || visibleTabs.includes(value))
            .map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-current={tab === value ? "page" : undefined}
                onClick={() => onTabChange(value)}
                className={`relative inline-flex h-11 items-center gap-1.5 px-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tab === value ? "text-brand after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand" : "text-slate-500 hover:text-ink dark:text-slate-400"}`}
              >
                <Icon size={14} />
                {copy[label]}
              </button>
            ))}
        </div>
      </nav>

      <div className="min-h-0 p-3 sm:p-4 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
        {children}
      </div>
    </Card>
  );
}
