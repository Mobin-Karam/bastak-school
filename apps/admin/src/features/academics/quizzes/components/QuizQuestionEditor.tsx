import { Button, Card, Field, Input, Select, Textarea } from "../../../shared/ui/ui";
import type { QuestionDraft } from "../../questions/question-model";
import { useQuizCopy } from "../model/quiz-locale";
export function QuizQuestionEditor({
  editingId,
  question,
  setQuestion,
  error,
  busy,
  onCancel,
  onSave,
}: {
  editingId: string;
  question: QuestionDraft;
  setQuestion: (q: QuestionDraft) => void;
  error: string;
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const copy = useQuizCopy();
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">{editingId ? copy.editQuestion : copy.newQuestion}</h3>
        {editingId ? (
          <Button className="h-8" variant="ghost" onClick={onCancel}>
            {copy.cancel}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Field label={copy.questionText}>
          <Textarea
            value={question.question}
            onChange={(e) => setQuestion({ ...question, question: e.target.value })}
          />
        </Field>
        {question.options.map((value, index) => (
          <Field key={index} label={copy.option(index + 1)}>
            <Input
              value={value}
              onChange={(e) =>
                setQuestion({
                  ...question,
                  options: question.options.map((item, i) => (i === index ? e.target.value : item)),
                })
              }
            />
          </Field>
        ))}
        <Field label={copy.answer}>
          <Select
            value={question.correctOption}
            onChange={(e) => setQuestion({ ...question, correctOption: e.target.value })}
          >
            {["a", "b", "c", "d"].map((key, index) => (
              <option key={key} value={key}>
                {copy.option(index + 1)}
              </option>
            ))}
          </Select>
        </Field>
        <Button loading={busy} disabled={!!error || busy} onClick={onSave}>
          {editingId ? copy.saveChanges : copy.addQuestion}
        </Button>
      </div>
    </Card>
  );
}
