import { Power, Save, Trash2 } from "lucide-react";
import { Button, Card, Field, Input } from "../../../shared/ui/ui";
import type { Quiz, QuizDraft } from "../model/quiz.types";
import { useQuizCopy } from "../model/quiz-locale";
export function QuizEditor({
  quiz,
  setQuiz,
  selected,
  busy,
  onSave,
  onToggle,
  onDelete,
}: {
  quiz: QuizDraft;
  setQuiz: (q: QuizDraft) => void;
  selected?: Quiz;
  busy: boolean;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const copy = useQuizCopy();
  return (
    <Card>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label={copy.language === "en" ? "Title" : "عنوان"}>
          <Input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} />
        </Field>
        <Field label={copy.subject}>
          <Input
            value={quiz.subject}
            onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })}
          />
        </Field>
        <Field label={copy.duration}>
          <Input
            type="number"
            value={quiz.durationMinutes}
            onChange={(e) => setQuiz({ ...quiz, durationMinutes: Number(e.target.value) })}
          />
        </Field>
        <Field label={copy.attempts}>
          <Input
            type="number"
            min={1}
            value={quiz.attemptLimit}
            onChange={(e) => setQuiz({ ...quiz, attemptLimit: Number(e.target.value) })}
          />
        </Field>
        <Field label={copy.openAt}>
          <Input
            type="datetime-local"
            value={quiz.openAt ? quiz.openAt.slice(0, 16) : ""}
            onChange={(e) =>
              setQuiz({
                ...quiz,
                openAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>
        <Field label={copy.closeAt}>
          <Input
            type="datetime-local"
            value={quiz.closeAt ? quiz.closeAt.slice(0, 16) : ""}
            onChange={(e) =>
              setQuiz({
                ...quiz,
                closeAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>
        <Field label={copy.resultPolicy}>
          <select
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={quiz.resultPolicy || "immediate"}
            onChange={(e) =>
              setQuiz({ ...quiz, resultPolicy: e.target.value as QuizDraft["resultPolicy"] })
            }
          >
            <option value="immediate">{copy.immediate}</option>
            <option value="manual">{copy.manual}</option>
          </select>
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          loading={busy}
          disabled={
            !quiz.title.trim() ||
            quiz.durationMinutes < 1 ||
            quiz.durationMinutes > 360 ||
            quiz.attemptLimit < 1 ||
            (!!quiz.openAt && !!quiz.closeAt && new Date(quiz.openAt) >= new Date(quiz.closeAt)) ||
            busy
          }
          onClick={onSave}
        >
          <Save size={16} />
          {copy.save}
        </Button>
        {selected ? (
          <Button variant="soft" onClick={onToggle}>
            <Power size={16} />
            {selected.active ? copy.inactive : copy.active}
          </Button>
        ) : null}
        {selected ? (
          <Button variant="ghost" className="text-rose-700" onClick={onDelete}>
            <Trash2 size={16} />
            {copy.delete}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
