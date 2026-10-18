import { ChevronDown } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { QuestionDraft } from "../model/question-model";
import { questionsCopy } from "../questions-locale";
export function QuestionEditor({
  editingId,
  form,
  setForm,
  submitted,
  validationError,
  busy,
  disabled,
  nextSortOrder: _nextSortOrder,
  onCancel,
  onSubmit,
}: {
  editingId: string;
  form: QuestionDraft;
  setForm: (v: QuestionDraft) => void;
  submitted: boolean;
  validationError: string;
  busy: boolean;
  disabled: boolean;
  nextSortOrder: number;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { language } = useLocale();
  const copy = questionsCopy(language);
  return (
    <Card className="min-h-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">
          {editingId ? copy.editQuestionEditor : copy.newQuestionEditor}
        </h3>
        {editingId ? (
          <Button className="h-8" variant="ghost" onClick={onCancel}>
            {copy.cancel}
          </Button>
        ) : null}
      </div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") e.currentTarget.requestSubmit();
        }}
      >
        <Field label={copy.questionText}>
          <Textarea
            className="min-h-28"
            maxLength={2000}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
        </Field>
        {form.options.map((option, i) => {
          const key = ["a", "b", "c", "d"][i];
          const correct = form.correctOption === key;
          return (
            <Field key={key} label={copy.option(i + 1)}>
              <div
                className={`flex items-center gap-2 rounded-md border p-1 ${correct ? "border-emerald-300 bg-emerald-50" : "border-transparent"}`}
              >
                <input
                  aria-label={copy.selectCorrectOption(i + 1)}
                  type="radio"
                  name="correctOption"
                  checked={correct}
                  onChange={() => setForm({ ...form, correctOption: key })}
                />
                <Input
                  className="border-0 bg-transparent"
                  maxLength={1000}
                  value={option}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      options: form.options.map((x, index) => (index === i ? e.target.value : x)),
                    })
                  }
                />
              </div>
            </Field>
          );
        })}
        <p className="text-xs text-slate-500">{copy.selectCorrectHint}</p>
        <Field label={copy.explanation}>
          <Textarea
            className="min-h-20"
            maxLength={2000}
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          />
        </Field>
        <details className="rounded-md border border-slate-200 p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
            {copy.additionalReview} <ChevronDown size={16} />
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <Field label={copy.book}>
              <Input
                maxLength={200}
                value={form.book}
                onChange={(e) => setForm({ ...form, book: e.target.value })}
              />
            </Field>
            <Field label={copy.chapter}>
              <Input
                maxLength={200}
                value={form.chapter}
                onChange={(e) => setForm({ ...form, chapter: e.target.value })}
              />
            </Field>
            <Field label={copy.lesson}>
              <Input
                maxLength={200}
                value={form.lesson}
                onChange={(e) => setForm({ ...form, lesson: e.target.value })}
              />
            </Field>
            <Field label={copy.topic}>
              <Input
                maxLength={240}
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </Field>
            <Field label={copy.sortOrder}>
              <Input
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label={copy.futureReviewHint}>
            <Textarea
              className="min-h-20"
              maxLength={3000}
              value={form.hint}
              onChange={(e) => setForm({ ...form, hint: e.target.value })}
            />
          </Field>
        </details>
        {submitted && validationError ? (
          <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">
            {validationError}
          </p>
        ) : null}
        <div className="sticky bottom-0 z-10 -mx-1 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card)_/_96%)] px-1 pt-3 shadow-[0_-8px_16px_-16px_rgb(15_23_42_/_0.45)]">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="soft" disabled={busy} type="button" onClick={onCancel}>
              {copy.cancel}
            </Button>
            <Button loading={busy} disabled={disabled || busy} type="submit">
              {editingId ? copy.saveChanges : copy.addQuestion}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">{copy.quickSave}</p>
        </div>
      </form>
    </Card>
  );
}
