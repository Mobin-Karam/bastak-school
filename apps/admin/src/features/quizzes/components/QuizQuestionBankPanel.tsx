import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ClipboardCopy, Link2, Pencil, Plus, Search } from "lucide-react";
import { listOrganizations } from "../../access/api/access.api";
import {
  addBankItemToQuiz,
  archiveQuestionBankItem,
  copyExamItemsToQuizBank,
  createQuestionBankItem,
  listQuestionBank,
  type QuestionBankDraft,
  type QuestionBankItem,
  updateQuestionBankItem,
} from "../../questions/api/question-bank.api";
import { useQuizCopy } from "../model/quiz-locale";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../../shared/ui/ui";
import { DataTransferWorkspace } from "../../../shared/ui/data-transfer";
import {
  downloadQuestionBankWorkbook,
  readQuestionBankWorkbook,
} from "../../../shared/lib/question-bank-transfer";
import {
  exportQuestionBank,
  getQuestionBankTemplate,
  importQuestionBank,
  type QuestionBankTransfer,
} from "../../questions/api/question-bank.api";

export function QuizQuestionBankPanel({
  selectedQuizId,
  canManage,
}: {
  selectedQuizId: string;
  canManage: boolean;
}) {
  const copy = useQuizCopy();
  const modal = useModal();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const quizBank = useQuery({
    queryKey: ["question-bank", "quiz"],
    queryFn: () => listQuestionBank(undefined, "quiz"),
  });
  const examBank = useQuery({
    queryKey: ["question-bank", "exam", "quiz-import"],
    queryFn: () => listQuestionBank(undefined, "exam"),
    enabled: canManage,
  });
  const organizations = useQuery({
    queryKey: ["organizations", "quiz-question-bank"],
    queryFn: listOrganizations,
    enabled: canManage,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["question-bank"] });
  const save = useMutation({
    mutationFn: ({ id, draft }: { id?: string; draft: QuestionBankDraft }) =>
      id
        ? updateQuestionBankItem(id, draft)
        : createQuestionBankItem({ ...draft, bankType: "quiz" }),
    onSuccess: () => {
      refresh();
      modal.close();
      notify(copy.language === "en" ? "Quiz-bank question saved." : "سؤال بانک آزمونک ذخیره شد.");
    },
    onError: (error) =>
      notify(
        error instanceof Error
          ? error.message
          : copy.language === "en"
            ? "Could not save the question."
            : "ذخیره سؤال ناموفق بود.",
        "error",
      ),
  });
  const archive = useMutation({
    mutationFn: archiveQuestionBankItem,
    onSuccess: () => {
      refresh();
      notify(
        copy.language === "en" ? "Quiz-bank question archived." : "سؤال بانک آزمونک بایگانی شد.",
      );
    },
  });
  const importExam = useMutation({
    mutationFn: copyExamItemsToQuizBank,
    onSuccess: (result) => {
      refresh();
      setSelectedExamIds([]);
      notify(
        copy.language === "en"
          ? `${result.created.toLocaleString(copy.numberLocale)} questions copied to the quiz bank.${result.skipped ? ` ${result.skipped.toLocaleString(copy.numberLocale)} duplicates skipped.` : ""}`
          : `${result.created.toLocaleString(copy.numberLocale)} سؤال به بانک آزمونک کپی شد.${result.skipped ? ` ${result.skipped.toLocaleString(copy.numberLocale)} مورد تکراری بود.` : ""}`,
      );
    },
    onError: (error) =>
      notify(
        error instanceof Error
          ? error.message
          : copy.language === "en"
            ? "Could not copy from the exam bank."
            : "کپی از بانک آزمون ناموفق بود.",
        "error",
      ),
  });
  const addToQuiz = useMutation({
    mutationFn: ({ itemId, quizId }: { itemId: string; quizId: string }) =>
      addBankItemToQuiz(itemId, quizId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
      notify(copy.language === "en" ? "Question added to the quiz." : "سؤال به آزمونک افزوده شد.");
    },
    onError: (error) =>
      notify(
        error instanceof Error
          ? error.message
          : copy.language === "en"
            ? "Could not add the question to the quiz."
            : "افزودن سؤال به آزمونک ناموفق بود.",
        "error",
      ),
  });
  const rows = useMemo(
    () =>
      (quizBank.data || []).filter((item) =>
        `${item.text} ${item.subject} ${item.topic} ${item.tags.join(" ")}`
          .toLocaleLowerCase(copy.numberLocale)
          .includes(query.trim().toLocaleLowerCase(copy.numberLocale)),
      ),
    [copy.numberLocale, quizBank.data, query],
  );
  const openEditor = (item?: QuestionBankItem) =>
    modal.open({
      title: item ? copy.editBankQuestion : copy.newBankQuestion,
      description: copy.bankDescription,
      size: "xl",
      content: (
        <QuizBankEditor
          item={item}
          organizations={organizations.data || []}
          saving={save.isPending}
          onCancel={modal.close}
          onSave={(draft) => save.mutate({ id: item?.id, draft })}
        />
      ),
    });
  if (quizBank.isLoading)
    return (
      <LoadingState
        label={
          copy.language === "en" ? "Loading quiz question bank…" : "در حال دریافت بانک سؤال آزمونک…"
        }
      />
    );
  if (quizBank.isError)
    return (
      <EmptyState
        title={
          copy.language === "en"
            ? "Could not load the quiz question bank."
            : "دریافت بانک سؤال آزمونک ناموفق بود."
        }
      />
    );
  return (
    <div className="grid gap-4">
      <DataTransferWorkspace
        variant="question-bank"
        bankType="quiz"
        canManage={canManage}
        load={(kind) =>
          kind === "export" ? exportQuestionBank("quiz") : getQuestionBankTemplate("quiz")
        }
        readWorkbook={readQuestionBankWorkbook}
        writeWorkbook={(data, filename) =>
          downloadQuestionBankWorkbook(data as QuestionBankTransfer, filename)
        }
        onImport={(data) => importQuestionBank(data as QuestionBankTransfer)}
        onImported={refresh}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="grid gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black">{copy.bank}</h2>
              <p className="text-xs text-slate-500">{copy.bankDescription}</p>
            </div>
            <Badge tone="blue">{rows.length.toLocaleString(copy.numberLocale)}</Badge>
            {canManage ? (
              <Button size="sm" onClick={() => openEditor()}>
                <Plus size={15} />
                {copy.newQuestion}
              </Button>
            ) : null}
          </div>
          <label className="flex items-center gap-2 rounded-lg border px-3">
            <Search size={15} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.questionSearch}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((item) => (
              <article key={item.id} className="grid gap-2 rounded-xl border p-3">
                <div>
                  <strong className="block text-sm">{item.text}</strong>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone="blue">{item.subject || copy.noSubject}</Badge>
                    <Badge tone="neutral">
                      {item.difficulty
                        ? copy.difficulty[item.difficulty as keyof typeof copy.difficulty] ||
                          item.difficulty
                        : copy.medium}
                    </Badge>
                    {item.sourceQuestionBankItemId ? (
                      <Badge tone="neutral">{copy.copyFromExam}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedQuizId && canManage ? (
                    <Button
                      size="sm"
                      variant="soft"
                      loading={addToQuiz.isPending}
                      onClick={() => addToQuiz.mutate({ itemId: item.id, quizId: selectedQuizId })}
                    >
                      <Link2 size={14} />
                      {copy.addToQuiz}
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button size="sm" variant="ghost" onClick={() => openEditor(item)}>
                      <Pencil size={14} />
                      {copy.edit}
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-700"
                      loading={archive.isPending}
                      onClick={() =>
                        void modal
                          .confirm({
                            title: copy.archiveQuestionTitle,
                            description: copy.archiveQuestionDescription,
                            tone: "danger",
                            confirmLabel: "بایگانی",
                          })
                          .then((ok) => ok && archive.mutate(item.id))
                      }
                    >
                      <Archive size={14} />
                      {copy.archive}
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          {!rows.length ? <EmptyState title={copy.noBankQuestion} /> : null}
        </Card>
        <Card className="grid content-start gap-3 p-3">
          <div>
            <h2 className="text-sm font-black">{copy.copyFromExam}</h2>
            <p className="text-xs text-slate-500">{copy.examBankDescription}</p>
          </div>
          <div className="grid max-h-[32rem] gap-2 overflow-auto">
            {(examBank.data || []).map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer gap-2 rounded-xl border p-2 text-xs ${selectedExamIds.includes(item.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand"
                  checked={selectedExamIds.includes(item.id)}
                  onChange={() =>
                    setSelectedExamIds((ids) =>
                      ids.includes(item.id)
                        ? ids.filter((id) => id !== item.id)
                        : [...ids, item.id],
                    )
                  }
                />
                <span>
                  <strong className="block text-sm">{item.text}</strong>
                  <small className="text-slate-500">
                    {item.subject || copy.noSubject} ·{" "}
                    {item.difficulty
                      ? copy.difficulty[item.difficulty as keyof typeof copy.difficulty] ||
                        item.difficulty
                      : copy.medium}
                  </small>
                </span>
              </label>
            ))}
            {examBank.isLoading ? <LoadingState label={copy.loadingExamBank} /> : null}
            {!examBank.isLoading && !(examBank.data || []).length ? (
              <EmptyState title={copy.noExamBankQuestion} />
            ) : null}
          </div>
          {canManage ? (
            <Button
              loading={importExam.isPending}
              disabled={!selectedExamIds.length}
              onClick={() => importExam.mutate(selectedExamIds)}
            >
              <ClipboardCopy size={15} />
              {copy.copyFromExam} {selectedExamIds.length.toLocaleString(copy.numberLocale)}{" "}
              {copy.questions}
            </Button>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function QuizBankEditor({
  item,
  organizations,
  saving,
  onSave,
  onCancel,
}: {
  item?: QuestionBankItem;
  organizations: Array<{ id: string; name: string }>;
  saving: boolean;
  onSave: (draft: QuestionBankDraft) => void;
  onCancel: () => void;
}) {
  const copy = useQuizCopy();
  const [draft, setDraft] = useState<QuestionBankDraft>({
    organizationId:
      item?.organization?.id || (organizations.length === 1 ? organizations[0].id : ""),
    text: item?.text || "",
    options: item?.options || ["", "", "", ""],
    correctAnswer: item?.correctAnswer || "",
    explanation: item?.explanation || "",
    subject: item?.subject || "",
    topic: item?.topic || "",
    book: item?.book || "",
    grade: item?.grade || "",
    chapter: item?.chapter || "",
    lesson: item?.lesson || "",
    difficulty: item?.difficulty || "medium",
    source: item?.source || "",
    tags: item?.tags || [],
  });
  const set = <K extends keyof QuestionBankDraft>(key: K, value: QuestionBankDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const valid =
    !!draft.organizationId &&
    !!draft.text.trim() &&
    draft.options.every((option) => option.trim()) &&
    new Set(draft.options.map((option) => option.trim().toLocaleLowerCase("fa"))).size === 4 &&
    draft.options.includes(draft.correctAnswer);
  return (
    <div className="grid gap-3">
      <select
        className="h-10 rounded-lg border px-3 text-sm"
        value={draft.organizationId}
        onChange={(event) => set("organizationId", event.target.value)}
      >
        <option value="">{copy.chooseOrganization}</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-24 rounded-lg border p-3 text-sm"
        value={draft.text}
        onChange={(event) => set("text", event.target.value)}
        placeholder={copy.questionBody}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {draft.options.map((option, index) => (
          <label key={index} className="flex items-center gap-2 rounded-lg border p-2">
            <input
              type="radio"
              checked={draft.correctAnswer === option && !!option}
              onChange={() => set("correctAnswer", option)}
              aria-label={copy.correctOption(index + 1)}
            />
            <Input
              value={option}
              onChange={(event) => {
                const options = [...draft.options];
                const wasCorrect = draft.correctAnswer === options[index];
                options[index] = event.target.value;
                set("options", options);
                if (wasCorrect) set("correctAnswer", event.target.value);
              }}
              placeholder={copy.option(index + 1)}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          value={draft.subject}
          onChange={(event) => set("subject", event.target.value)}
          placeholder={copy.subject}
        />
        <Input
          value={draft.topic}
          onChange={(event) => set("topic", event.target.value)}
          placeholder={copy.topic}
        />
        <select
          className="h-10 rounded-lg border px-3 text-sm"
          value={draft.difficulty}
          onChange={(event) => set("difficulty", event.target.value)}
        >
          <option value="easy">{copy.difficulty.easy}</option>
          <option value="medium">{copy.difficulty.medium}</option>
          <option value="hard">{copy.difficulty.hard}</option>
        </select>
      </div>
      <Input
        value={draft.tags.join(", ")}
        onChange={(event) =>
          set(
            "tags",
            event.target.value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          )
        }
        placeholder={copy.tags}
      />
      <textarea
        className="min-h-16 rounded-lg border p-3 text-sm"
        value={draft.explanation}
        onChange={(event) => set("explanation", event.target.value)}
        placeholder={copy.optionalExplanation}
      />
      <div className="flex gap-2">
        <Button loading={saving} disabled={!valid} onClick={() => onSave(draft)}>
          {copy.saveQuestion}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
}
