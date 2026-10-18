import {
  CalendarClock,
  FileQuestion,
  MoreHorizontal,
  Pencil,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Exam } from "../../../shared/types/domain";
import { useLocale } from "../../../shared/ui/locale";
import { Badge, Button } from "../../../shared/ui/ui";
import { examReadiness } from "../model/exam-model";
import { statusLabel } from "../lib/exam-formatters";
import { Metric } from "./Metric";
import { examsCopy } from "../exams-locale";

export function ExamCard({
  exam,
  checked,
  onCheck,
  onEdit,
  onDelete,
  onToggle,
  toggleBusy,
  onAddSyllabus,
  onDeleteSyllabus,
  studentId,
  showQuestions = false,
  onManageAssignments,
  onAnalytics,
}: {
  exam: Exam;
  checked: boolean;
  onCheck?: (value: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  toggleBusy: boolean;
  onAddSyllabus?: () => void;
  onDeleteSyllabus?: (id: string) => void;
  studentId: string;
  showQuestions?: boolean;
  onManageAssignments?: () => void;
  onAnalytics?: () => void;
}) {
  const { language, formatDate, formatDateTime } = useLocale();
  const copy = examsCopy(language);

  const readiness = examReadiness(exam);

  return (
    <article className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-[var(--shadow-surface)] transition hover:border-brand/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        {onCheck ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onCheck(event.target.checked)}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <strong className="block truncate">{exam.title}</strong>

          <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <CalendarClock size={14} />

            {exam.persianDate || formatDate(exam.isoDate)}
          </span>
        </div>

        <Badge tone={readiness.tone}>{readiness.label}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
        <Metric label={copy.status} value={statusLabel(exam.status) || copy.notAvailable} />

        <Metric label={copy.duration} value={exam.durationMinutes || 120} />

        <Metric label={copy.question} value={exam.delivery?.questionCount || 0} />

        <Metric label={copy.attempts} value={exam.maxAttempts || 1} />
      </div>

      <p className="mt-3 rounded-md bg-[rgb(var(--surface-muted))] px-3 py-2 text-xs leading-5 text-slate-500">
        {`${(exam.delivery?.assignmentCount || 0).toLocaleString(language === "fa" ? "fa-IR" : "en-US")} ${copy.assignments} • ${(exam.delivery?.attemptCount || 0).toLocaleString(language === "fa" ? "fa-IR" : "en-US")} ${copy.attempts} • ${(exam.delivery?.notStartedCount || 0).toLocaleString(language === "fa" ? "fa-IR" : "en-US")} ${copy.notStarted}`}
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Timer size={14} /> {formatDateTime(exam.openAt)} {copy.to} {formatDateTime(exam.closeAt)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {showQuestions ? (
          <Link
            to={`/admin/questions?examId=${encodeURIComponent(exam.id)}${studentId ? `&studentId=${encodeURIComponent(studentId)}` : ""}`}
          >
            <Button className="h-8 px-2 text-xs" variant="soft">
              <FileQuestion size={14} />
              {copy.questions}
            </Button>
          </Link>
        ) : null}

        {onEdit || onManageAssignments || onAnalytics || onToggle || onDelete ? (
          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border border-[rgb(var(--border-subtle))] px-2 text-xs text-slate-600">
              <MoreHorizontal size={15} />
              {copy.options}
            </summary>
            <div className="absolute start-0 z-10 mt-1 grid min-w-36 gap-1 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-1 shadow-lg">
              {onEdit ? (
                <Button className="justify-start" size="sm" variant="ghost" onClick={onEdit}>
                  <Pencil size={14} />
                  {copy.edit}
                </Button>
              ) : null}
              {onManageAssignments ? (
                <Button
                  className="justify-start"
                  size="sm"
                  variant="ghost"
                  onClick={onManageAssignments}
                >
                  <Users size={14} />
                  {copy.manageAssignments}
                </Button>
              ) : null}
              {onAnalytics ? (
                <Button className="justify-start" size="sm" variant="ghost" onClick={onAnalytics}>
                  {copy.analytics}
                </Button>
              ) : null}
              {onToggle ? (
                <Button
                  className="justify-start"
                  size="sm"
                  variant="ghost"
                  loading={toggleBusy}
                  onClick={onToggle}
                >
                  {exam.published ? copy.makeDraft : copy.publish}
                </Button>
              ) : null}
              {onDelete ? (
                <Button className="justify-start" size="sm" variant="danger" onClick={onDelete}>
                  <Trash2 size={14} />
                  {copy.delete}
                </Button>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>

      {exam.published && !exam.delivery?.questionCount ? (
        <p className="mt-3 rounded-md bg-rose-50 p-2 text-xs text-rose-700">
          {copy.publishedWithoutQuestions}
        </p>
      ) : null}

      <details className="mt-3 border-t border-[rgb(var(--border-subtle))] pt-3">
        <summary className="flex cursor-pointer list-none justify-between">
          <strong className="text-xs">{copy.syllabusCount(exam.syllabus?.length || 0)}</strong>

          {onAddSyllabus ? (
            <button
              type="button"
              className="text-xs text-brand"
              onClick={(event) => {
                event.preventDefault();
                onAddSyllabus();
              }}
            >
              + {copy.add}
            </button>
          ) : null}
        </summary>

        <div className="mt-2">
          {exam.syllabus?.map((item) => (
            <div
              key={item.id}
              className="mb-1 flex justify-between rounded-md bg-[rgb(var(--surface-muted))] p-2 text-xs"
            >
              <span>
                <strong>{item.subject}</strong>: {item.description}
                {item.track ? ` • ${item.track}` : ""}
              </span>

              {onDeleteSyllabus ? (
                <button className="text-rose-700" onClick={() => onDeleteSyllabus(item.id)}>
                  {copy.delete}
                </button>
              ) : null}
            </div>
          ))}

          {!exam.syllabus?.length ? (
            <p className="rounded-md bg-[rgb(var(--surface-muted))] p-2 text-xs text-slate-500">
              {copy.noSyllabus}
            </p>
          ) : null}
        </div>
      </details>
    </article>
  );
}
