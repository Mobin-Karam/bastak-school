import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, Save, Search, WandSparkles } from "lucide-react";
import { useState } from "react";
import { listOrganizations } from "../../access/api/access.api";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../../shared/ui/ui";
import { DataTransferWorkspace } from "../../../shared/ui/data-transfer";
import {
  downloadQuestionBankWorkbook,
  readQuestionBankWorkbook,
} from "../../../shared/lib/question-bank-transfer";
import {
  archiveQuestionBankItem,
  createQuestionBankItem,
  generateExamFromBank,
  listQuestionBank,
  type QuestionBankDraft,
  type QuestionBankItem,
  type QuestionBankTransfer,
  exportQuestionBank,
  getQuestionBankTemplate,
  importQuestionBank,
  updateQuestionBankItem,
} from "../api/question-bank.api";
import { getQuestionBankExams } from "../api/questions.api";
import { useQuestionBankCopy } from "../question-bank-copy";

export function QuestionBankPanel() {
  const copy = useQuestionBankCopy();
  const [query, setQuery] = useState("");
  const modal = useModal();
  const qc = useQueryClient();
  const bank = useQuery({
    queryKey: ["question-bank", "exam"],
    queryFn: () => listQuestionBank(undefined, "exam"),
  });
  const organizations = useQuery({
    queryKey: ["organizations", "question-bank"],
    queryFn: listOrganizations,
  });
  const exams = useQuery({
    queryKey: ["question-bank-exams", "generator"],
    queryFn: getQuestionBankExams,
  });
  const archive = useMutation({
    mutationFn: archiveQuestionBankItem,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["question-bank"] }),
  });
  const save = useMutation({
    mutationFn: ({ id, draft }: { id?: string; draft: QuestionBankDraft }) =>
      id
        ? updateQuestionBankItem(id, draft)
        : createQuestionBankItem({ ...draft, bankType: "exam" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["question-bank"] });
      modal.close();
    },
  });
  const openEditor = (item?: QuestionBankItem) =>
    modal.open({
      title: item ? copy.editTitle : copy.newTitle,
      description: copy.editDescription,
      size: "xl",
      content: (
        <QuestionBankEditor
          item={item}
          organizations={organizations.data || []}
          saving={save.isPending}
          onSave={(draft) => save.mutate({ id: item?.id, draft })}
          onCancel={modal.close}
        />
      ),
    });
  if (bank.isLoading) return <LoadingState label={copy.loading} />;
  if (bank.isError) return <EmptyState title={copy.failed} />;
  const rows = (bank.data || []).filter((item) =>
    `${item.text} ${item.subject} ${item.topic} ${item.tags.join(" ")}`
      .toLocaleLowerCase(copy.locale)
      .includes(query.toLocaleLowerCase(copy.locale)),
  );
  return (
    <div className="grid gap-4">
      <DataTransferWorkspace
        variant="question-bank"
        bankType="exam"
        load={(kind) =>
          kind === "export" ? exportQuestionBank("exam") : getQuestionBankTemplate("exam")
        }
        readWorkbook={readQuestionBankWorkbook}
        writeWorkbook={(data, filename) =>
          downloadQuestionBankWorkbook(data as QuestionBankTransfer, filename)
        }
        onImport={(data) => importQuestionBank(data as QuestionBankTransfer)}
        onImported={() => void qc.invalidateQueries({ queryKey: ["question-bank"] })}
      />
      <Card className="grid gap-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black">{copy.bank}</h2>
            <p className="text-xs text-slate-500">{copy.description}</p>
          </div>
          <Badge tone="blue">{rows.length.toLocaleString(copy.locale)}</Badge>
          <Button size="sm" onClick={() => openEditor()}>
            <Plus size={15} />
            {copy.newQuestion}
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              modal.open({
                title: copy.buildTitle,
                description: copy.buildDescription,
                size: "lg",
                content: <BankGenerator exams={exams.data || []} onClose={modal.close} />,
              })
            }
          >
            <WandSparkles size={15} />
            {copy.buildExam}
          </Button>
        </div>
        <label className="flex items-center gap-2 rounded-lg border px-3">
          <Search size={15} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.search}
          />
        </label>
        <div className="grid gap-2">
          {rows.map((item) => (
            <article
              key={item.id}
              className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div>
                <strong className="block text-sm">{item.text}</strong>
                <span className="mt-1 flex flex-wrap gap-1">
                  <Badge tone="blue">{item.subject || copy.noSubject}</Badge>
                  <Badge tone="neutral">
                    {item.difficulty
                      ? copy[item.difficulty as "easy" | "medium" | "hard"] || item.difficulty
                      : copy.medium}
                  </Badge>
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEditor(item)}>
                  <Pencil size={15} />
                  {copy.edit}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-700"
                  loading={archive.isPending}
                  onClick={() =>
                    void modal
                      .confirm({
                        title: copy.archiveTitle,
                        description: copy.archiveDescription,
                        tone: "danger",
                        confirmLabel: copy.archive,
                        confirmationText: item.text,
                      })
                      .then((ok) => ok && archive.mutate(item.id))
                  }
                >
                  <Archive size={15} />
                  {copy.archive}
                </Button>
              </div>
            </article>
          ))}
          {!rows.length ? <EmptyState title={copy.none} /> : null}
        </div>
      </Card>
    </div>
  );
}

function QuestionBankEditor({
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
  const copy = useQuestionBankCopy();
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
    draft.options.length === 4 &&
    draft.options.every((option) => option.trim()) &&
    new Set(draft.options.map((option) => option.trim().toLocaleLowerCase(copy.locale))).size ===
      4 &&
    draft.options.includes(draft.correctAnswer);
  return (
    <div className="grid gap-3">
      <select
        className="h-10 rounded-lg border px-3 text-sm"
        value={draft.organizationId}
        onChange={(e) => set("organizationId", e.target.value)}
      >
        <option value="">{copy.organization}</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-24 rounded-lg border p-3 text-sm"
        value={draft.text}
        onChange={(e) => set("text", e.target.value)}
        placeholder={copy.question}
      />{" "}
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
              onChange={(e) => {
                const options = [...draft.options];
                const wasCorrect = draft.correctAnswer === options[index];
                options[index] = e.target.value;
                set("options", options);
                if (wasCorrect) set("correctAnswer", e.target.value);
              }}
              placeholder={copy.option(index + 1)}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          value={draft.subject}
          onChange={(e) => set("subject", e.target.value)}
          placeholder={copy.subject}
        />
        <Input
          value={draft.topic}
          onChange={(e) => set("topic", e.target.value)}
          placeholder={copy.topic}
        />
        <select
          className="h-10 rounded-lg border px-3 text-sm"
          value={draft.difficulty}
          onChange={(e) => set("difficulty", e.target.value)}
        >
          <option value="easy">{copy.easy}</option>
          <option value="medium">{copy.medium}</option>
          <option value="hard">{copy.hard}</option>
        </select>
        <Input
          value={draft.grade}
          onChange={(e) => set("grade", e.target.value)}
          placeholder={copy.grade}
        />
        <Input
          value={draft.chapter}
          onChange={(e) => set("chapter", e.target.value)}
          placeholder={copy.chapter}
        />
        <Input
          value={draft.lesson}
          onChange={(e) => set("lesson", e.target.value)}
          placeholder={copy.lesson}
        />
      </div>
      <Input
        value={draft.tags.join(", ")}
        onChange={(e) =>
          set(
            "tags",
            e.target.value
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
        onChange={(e) => set("explanation", e.target.value)}
        placeholder={copy.explanation}
      />
      <div className="flex gap-2">
        <Button loading={saving} disabled={!valid} onClick={() => onSave(draft)}>
          <Save size={15} />
          {copy.save}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
}

function BankGenerator({
  exams,
  onClose,
}: {
  exams: Array<{ id: string; title: string }>;
  onClose: () => void;
}) {
  const copy = useQuestionBankCopy();
  const [examId, setExamId] = useState("");
  const [easy, setEasy] = useState(0);
  const [medium, setMedium] = useState(0);
  const [hard, setHard] = useState(0);
  const [preview, setPreview] = useState<Array<{ id: string; text: string; difficulty: string }>>(
    [],
  );
  const request = useMutation({
    mutationFn: (commit: boolean) => generateExamFromBank({ examId, easy, medium, hard, commit }),
    onSuccess: (result) => {
      if (result.preview) {
        setPreview(result.selected || []);
        if (!result.selected?.length) notify(copy.noMatches, "warning");
      } else {
        notify(copy.added(result.created || 0, result.skipped || 0, copy.locale));
        setPreview([]);
        onClose();
      }
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.failedBuild, "error"),
  });
  const total = easy + medium + hard;
  return (
    <div className="grid gap-3">
      <select
        className="h-10 rounded-lg border px-3 text-sm"
        value={examId}
        onChange={(event) => setExamId(event.target.value)}
      >
        <option value="">{copy.selectExam}</option>
        {exams.map((exam) => (
          <option key={exam.id} value={exam.id}>
            {exam.title}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <label className="grid gap-1 text-xs">
          {copy.easy}
          <Input
            type="number"
            min={0}
            value={easy}
            onChange={(event) => setEasy(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-1 text-xs">
          {copy.medium}
          <Input
            type="number"
            min={0}
            value={medium}
            onChange={(event) => setMedium(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-1 text-xs">
          {copy.hard}
          <Input
            type="number"
            min={0}
            value={hard}
            onChange={(event) => setHard(Number(event.target.value))}
          />
        </label>
      </div>
      {preview.length ? (
        <div className="grid max-h-56 gap-1 overflow-auto rounded-xl border p-2">
          {preview.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 text-xs">
              <span>{item.text}</span>
              <span className="text-slate-500">{item.difficulty}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button
          loading={request.isPending}
          disabled={!examId || total < 1}
          onClick={() => request.mutate(false)}
        >
          {copy.preview(total, copy.locale)}
        </Button>
        {preview.length ? (
          <Button variant="soft" loading={request.isPending} onClick={() => request.mutate(true)}>
            {copy.confirmAdd}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onClose}>
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
}
