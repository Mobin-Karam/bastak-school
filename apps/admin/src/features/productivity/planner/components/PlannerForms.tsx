import { useState, type ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Exam, PlanTask } from "../../../shared/types/domain";
import { DatePicker } from "../../../shared/ui/date-picker";
import { Button, Field, Input, Select, Textarea } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { PlanDraft, TaskDraft } from "../model/planner.types";
import type { PlannerEducationBook } from "../api/planner.api";
import { errorMessage, validateTaskDraft } from "../lib/planner-model";
import { plannerCopy, plannerTaskTypeLabel } from "../model/planner-copy";

export function PlanForm({
  initial,
  lockDate,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: PlanDraft;
  lockDate: boolean;
  busy: boolean;
  onSubmit: (data: PlanDraft) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const isEmptyDay = !initial.title && !initial.dayLabel && !initial.motivationText;
  const applyStarter = (kind: "study" | "review") =>
    setData({
      ...data,
      title: kind === "study" ? copy.studyDayTitle : copy.reviewDayTitle,
      dayLabel: kind === "study" ? copy.studyDayLabel : copy.reviewDayLabel,
      motivationText: kind === "study" ? copy.studyDayMotivation : copy.reviewDayMotivation,
    });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        void Promise.resolve(onSubmit(data)).catch((reason) =>
          setError(errorMessage(reason, copy.savePlanFailed)),
        );
      }}
    >
      {isEmptyDay ? (
        <section className="grid gap-2 rounded-xl border border-dashed border-brand/40 bg-indigo-50/70 p-3 dark:bg-indigo-950/20">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {copy.startDaySetup}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">{copy.emptyDayHelp}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="soft"
              className="h-8"
              onClick={() => applyStarter("study")}
            >
              {copy.startStudyDay}
            </Button>
            <Button
              type="button"
              variant="soft"
              className="h-8"
              onClick={() => applyStarter("review")}
            >
              {copy.startReviewDay}
            </Button>
          </div>
        </section>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.planDate}>
          <DatePicker
            required
            disabled={lockDate}
            value={data.planDate}
            onChange={(planDate) => setData({ ...data, planDate })}
          />
        </Field>
        <Field label={copy.planTitle}>
          <Input
            value={data.title || ""}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
        </Field>
        <Field label={copy.dayLabel}>
          <Input
            value={data.dayLabel || ""}
            onChange={(e) => setData({ ...data, dayLabel: e.target.value })}
          />
        </Field>
        <Field label={copy.persianDate}>
          <Input
            value={data.persianDate || ""}
            onChange={(e) => setData({ ...data, persianDate: e.target.value })}
          />
        </Field>
        <Field label={copy.jalaliId}>
          <Input
            value={data.jalaliId || ""}
            onChange={(e) => setData({ ...data, jalaliId: e.target.value })}
          />
        </Field>
        <Field label={copy.status}>
          <Select
            value={data.published ? "1" : "0"}
            onChange={(e) => setData({ ...data, published: e.target.value === "1" })}
          >
            <option value="0">{copy.draft}</option>
            <option value="1">{copy.published}</option>
          </Select>
        </Field>
      </div>
      <Field label={copy.motivation}>
        <Textarea
          maxLength={600}
          rows={3}
          value={data.motivationText || ""}
          onChange={(e) => setData({ ...data, motivationText: e.target.value })}
        />
      </Field>
      {error ? (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Actions busy={busy} onCancel={onCancel} />
    </form>
  );
}

export function TaskForm({
  initial,
  exams,
  books = [],
  studentId,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: TaskDraft;
  exams: Exam[];
  books?: PlannerEducationBook[];
  studentId: string;
  busy: boolean;
  onSubmit: (data: TaskDraft) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const duration = durationLabel(data.start, data.end, copy, language);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const validation = validateTaskDraft(data);
        if (validation) {
          setError(validation);
          return;
        }
        setError("");
        void Promise.resolve(onSubmit(data)).catch((reason) =>
          setError(errorMessage(reason, copy.saveActivityFailed)),
        );
      }}
    >
      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div>
          <h4 className="text-sm font-black">{copy.timeAndType}</h4>
          <p className="text-xs text-slate-500">{copy.timeAndTypeHelp}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.start}>
            <Input
              required
              type="time"
              value={data.start}
              onChange={(e) => setData({ ...data, start: e.target.value })}
            />
          </Field>
          <Field label={copy.end}>
            <Input
              required
              type="time"
              value={data.end}
              onChange={(e) => setData({ ...data, end: e.target.value })}
            />
          </Field>
          <p className="self-end pb-1 text-xs font-bold text-brand" aria-live="polite">
            {duration}
          </p>
          <Field label={copy.type}>
            <Select
              value={data.type}
              onChange={(e) =>
                setData({
                  ...data,
                  type: e.target.value,
                  examId: e.target.value === "exam" ? data.examId : "",
                })
              }
            >
              {["study", "review", "test", "class", "prayer", "meal", "break", "exam"].map((x) => (
                <option key={x} value={x}>
                  {plannerTaskTypeLabel(x, language)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>
      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div>
          <h4 className="text-sm font-black">{copy.educationGoal}</h4>
          <p className="text-xs text-slate-500">{copy.educationGoalHelp}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.subject}>
            <Input
              list="planner-education-books"
              value={data.subject}
              onChange={(e) => setData({ ...data, subject: e.target.value })}
            />
            {books.length ? (
              <datalist id="planner-education-books">
                {books.map((book) => (
                  <option key={book.id} value={book.titleFa}>
                    {[book.category, book.textbookCode].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </datalist>
            ) : null}
            {books.length ? (
              <p className="mt-1 text-[11px] text-slate-500">{copy.subjectHelp}</p>
            ) : null}
          </Field>
          <Field label={copy.title}>
            <Input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </Field>
          {data.type === "exam" ? (
            <div className="grid gap-1">
              <Field label={copy.relatedExam}>
                <Select
                  value={data.examId}
                  onChange={(e) => setData({ ...data, examId: e.target.value })}
                >
                  <option value="">{copy.noExam}</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.persianDate || exam.isoDate} — {exam.title}
                    </option>
                  ))}
                </Select>
              </Field>
              {data.examId ? (
                <Link
                  className="text-xs font-bold text-brand hover:underline"
                  to={`/admin/questions?examId=${encodeURIComponent(data.examId)}&studentId=${encodeURIComponent(studentId)}`}
                >
                  {copy.openExamQuestionBank}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
      <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <summary className="cursor-pointer text-sm font-bold">{copy.optionalDetails}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={copy.pages}>
            <Input
              value={data.pages}
              onChange={(e) => setData({ ...data, pages: e.target.value })}
              placeholder={copy.pagesPlaceholder}
            />
          </Field>
          <Field label={copy.testCount}>
            <Input
              min={0}
              type="number"
              value={data.testCount}
              onChange={(e) => setData({ ...data, testCount: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={copy.note}>
              <Textarea
                rows={3}
                value={data.note}
                onChange={(e) => setData({ ...data, note: e.target.value })}
                placeholder={copy.notePlaceholder}
              />
            </Field>
          </div>
        </div>
      </details>
      {error ? (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Actions busy={busy} onCancel={onCancel} />
    </form>
  );
}

function durationLabel(
  start: string,
  end: string,
  copy: ReturnType<typeof plannerCopy>,
  language: "fa" | "en",
) {
  if (!start || !end || end <= start) return copy.completeTimeRange;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  const duration =
    minutes >= 60
      ? `${Math.floor(minutes / 60)} ${language === "fa" ? "ساعت" : "hours"}${minutes % 60 ? (language === "fa" ? ` و ${minutes % 60} دقیقه` : ` and ${minutes % 60} minutes`) : ""}`
      : `${minutes} ${language === "fa" ? "دقیقه" : "minutes"}`;
  return copy.duration.replace("{duration}", duration);
}
export function DateAction({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: string;
  onSubmit: (date: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  const [date, setDate] = useState(initial);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        void Promise.resolve(onSubmit(date)).catch((reason) =>
          setError(errorMessage(reason, copy.copyPlanFailed)),
        );
      }}
    >
      <Field label={copy.targetDate}>
        <DatePicker required value={date} onChange={setDate} />
      </Field>
      {error ? (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Actions busy={false} onCancel={onCancel} />
    </form>
  );
}
export function TaskDrawer({
  title,
  onClose,
  onDelete,
  children,
}: {
  title: string;
  onClose: () => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/45"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl md:inset-x-auto md:bottom-0 md:end-0 md:top-0 md:w-[460px] md:rounded-none"
      >
        <header className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand">{copy.activityDetails}</span>
            <h3 className="text-lg font-black">{title}</h3>
          </div>
          <div className="flex gap-1">
            {onDelete ? (
              <Button className="h-9 px-2" variant="ghost" onClick={onDelete}>
                <Trash2 size={17} className="text-rose-600" />
              </Button>
            ) : null}
            <Button className="h-9 px-2" variant="ghost" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </header>
        {children}
      </aside>
    </div>
  );
}
function Actions({ busy, onCancel }: { busy: boolean; onCancel: () => void }) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="soft" onClick={onCancel}>
        {copy.cancel}
      </Button>
      <Button loading={busy}>{copy.save}</Button>
    </div>
  );
}
export function toPlanDraft(
  date: string,
  plan?: import("../../../shared/types/domain").Plan,
): PlanDraft {
  return {
    planDate: date,
    title: plan?.title || "",
    dayLabel: plan?.dayLabel || "",
    persianDate: plan?.persianDate || "",
    jalaliId: plan?.jalaliId || "",
    motivationText: plan?.motivationText || "",
    published: plan?.published ?? false,
  };
}
export function toTaskDraft(task?: PlanTask, count = 0): TaskDraft {
  return {
    start: task?.start || "08:00",
    end: task?.end || "09:00",
    type: task?.type || "study",
    subject: task?.subject || "",
    title: task?.title || "",
    pages: task?.pages || "",
    testCount: task?.testCount || 0,
    note: task?.note || "",
    examId: task?.examId || "",
    sortOrder: task?.sortOrder || count + 1,
  };
}
