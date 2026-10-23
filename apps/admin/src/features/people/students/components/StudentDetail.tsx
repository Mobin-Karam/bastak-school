import {
  Activity,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LayoutGrid,
  Pencil,
  ShieldCheck,
  UserRound,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Student } from "../../../../shared/types/domain";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";
import {
  formatStudentLastSeen,
  getStudentStatus,
  getStudentStatusCopy,
  getStudentUsername,
  type StudentDetailTab,
} from "./student-ui";
import { StudentWorkflowActions } from "./StudentWorkflowActions";

const tabs = [
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
  onEdit,
  onPrevious,
  onNext,
}: {
  student: Student;
  tab: StudentDetailTab;
  onTabChange: (tab: StudentDetailTab) => void;
  onBack: () => void;
  children: ReactNode;
  dirty?: boolean;
  visibleTabs?: readonly StudentDetailTab[];
  capabilities?: readonly string[];
  onEdit?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const [copied, setCopied] = useState<"id" | "username" | "">("");
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const status = getStudentStatusCopy(getStudentStatus(student), language);
  const username = getStudentUsername(student);
  const locale = language === "fa" ? "fa-IR" : "en-US";
  async function copyValue(value: string, field: "id" | "username") {
    if (!value || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  }
  return (
    <article className="min-w-0 text-ink" aria-labelledby="student-record-title">
      <header className="border-b border-[rgb(var(--border-subtle))] pb-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-600 hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowLeft size={15} className="rtl:rotate-180" />
            {copy.backToList}
          </button>
          <div
            className="flex items-center gap-1"
            aria-label={language === "fa" ? "پیمایش دانش‌آموزان" : "Student navigation"}
          >
            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              aria-label={language === "fa" ? "دانش‌آموز قبلی" : "Previous student"}
              className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight size={18} className="ltr:rotate-180" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label={language === "fa" ? "دانش‌آموز بعدی" : "Next student"}
              className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={18} className="ltr:rotate-180" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white">
            <UserRound size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="student-record-title" className="truncate text-lg font-black">
                {student.name}
              </h2>
              <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}>
                {status.label}
              </span>
              {dirty ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                  {copy.unsavedChanges}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {copy.lastActivity}: {formatStudentLastSeen(student.last_seen_at, language)}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
              <UsersRound size={14} />
              {(student.guardians?.length || 0).toLocaleString(locale)}{" "}
              {language === "fa" ? "سرپرست پیوندخورده" : "linked guardians"}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["id", copy.studentId, student.id],
              ["username", copy.username, username || copy.usernameNotSet],
            ] as const
          ).map(([field, label, value]) => (
            <button
              key={field}
              type="button"
              disabled={!value || (field === "username" && !username)}
              onClick={() => void copyValue(value, field)}
              className="flex min-h-11 items-center justify-between rounded-lg bg-[rgb(var(--surface-muted))] px-3 text-start text-xs disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span>
                <span className="block text-slate-500">{label}</span>
                <strong dir="ltr">{value}</strong>
              </span>
              {copied === field ? (
                <Check size={15} className="text-brand" />
              ) : (
                <Copy size={15} className="text-slate-400" />
              )}
            </button>
          ))}
        </div>
        <StudentWorkflowActions studentId={student.id} capabilities={capabilities} />
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil size={15} aria-hidden="true" />
            {copy.editProfile}
          </button>
        ) : null}
      </header>
      <nav
        className="mt-4 flex shrink-0 gap-1 overflow-x-auto border-b border-[rgb(var(--border-subtle))]"
        aria-label={copy.detailSections}
      >
        {tabs
          .filter(([value]) => !visibleTabs || visibleTabs.includes(value))
          .map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => onTabChange(value)}
              aria-current={tab === value ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-bold focus-visible:ring-2 focus-visible:ring-brand ${tab === value ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-ink"}`}
            >
              <Icon size={14} />
              {copy[label]}
            </button>
          ))}
      </nav>
      <div className="min-[1200px]:flex-1 min-[1200px]:overflow-y-auto py-5">{children}</div>
      <span className="sr-only" aria-live="polite">
        {copied === "id" ? copy.idCopied : copied === "username" ? copy.usernameCopied : ""}
      </span>
    </article>
  );
}
