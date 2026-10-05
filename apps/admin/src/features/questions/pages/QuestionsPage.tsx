import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, WandSparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useStudentSelection } from "../../../shared/hooks/useStudentSelection";
import { useAuth } from "../../auth/hooks/useAuth";
import { useModal } from "../../../shared/ui/modal";
import { Button, Card } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import {
  createExamQuestion,
  deleteExamQuestion,
  getExamQuestions,
  getQuestionBankExams,
  updateQuestion,
} from "../api/questions.api";
import { QuestionEditor } from "../components/QuestionEditor";
import { QuestionsList } from "../components/QuestionsList";
import { QuestionsSelector } from "../components/QuestionsSelector";
import { QuestionBankPanel } from "../components/QuestionBankPanel";
import { ExamAssignmentManager } from "../../exams/components/ExamAssignmentManager";
import {
  emptyQuestion,
  questionDraft,
  questionError,
  questionMatches,
  questionNumber,
  questionPayload,
} from "../model/question-model";
import type { QuestionDraft } from "../model/question-model";
import { questionsCopy } from "../questions-locale";
export function QuestionsPage() {
  const { language } = useLocale();
  const copy = questionsCopy(language);
  const [params, setParams] = useSearchParams();
  const auth = useAuth();
  const canReadStudents = auth.can("students.read");
  const students = useStudentSelection({
    clearOnChange: ["examId", "search"],
    enabled: canReadStudents,
  });
  const examId = params.get("examId") || "";
  const search = params.get("search") || "";
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [form, setForm] = useState(emptyQuestion);
  const qc = useQueryClient();
  const modal = useModal();
  const canCreate = auth.can("questions.create");
  const canUpdate = auth.can("questions.update");
  const canDelete = auth.can("questions.delete");
  const deferredSearch = useDeferredValue(search);
  useEffect(() => {
    setEditingId("");
    setSelected([]);
    setForm(emptyQuestion());
    setSubmitted(false);
  }, [students.studentId, examId]);
  const exams = useQuery({
    queryKey: ["question-bank-exams"],
    queryFn: getQuestionBankExams,
  });
  const questions = useQuery({
    queryKey: ["exam-questions", examId],
    enabled: !!examId,
    queryFn: () => getExamQuestions(examId),
  });
  const nextSortOrder =
    Math.max(0, ...(questions.data || []).map((item, index) => questionNumber(item, index + 1))) +
    1;
  const add = useMutation({
    mutationFn: ({ id, draft }: { id?: string; draft: QuestionDraft }) =>
      id
        ? updateQuestion(id, questionPayload(draft))
        : createExamQuestion(examId, questionPayload(draft)),
    onSuccess: (_, variables) => {
      setForm({
        ...emptyQuestion(),
        sortOrder: nextSortOrder + (editingId ? 0 : 1),
      });
      setEditingId("");
      notify(variables.id ? copy.saved : copy.created);
      setSubmitted(false);
      void qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
      void qc.invalidateQueries({ queryKey: ["question-bank-exams"] });
      void qc.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.saveFailed, "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteExamQuestion(examId, id),
    onSuccess: (_, id) => {
      setSelected((items) => items.filter((x) => x !== id));
      if (editingId === id) {
        setEditingId("");
        setForm(emptyQuestion());
      }
      notify(copy.deleted);
      void qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
      void qc.invalidateQueries({ queryKey: ["question-bank-exams"] });
      void qc.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.deleteFailed, "error"),
  });
  const visibleQuestions = useMemo(
    () => (questions.data ?? []).filter((item) => questionMatches(item, deferredSearch)),
    [questions.data, deferredSearch],
  );
  const validationError = questionError(form);
  const selectedExam = exams.data?.find((exam) => exam.id === examId);
  useEffect(() => {
    if (!examId || !exams.isSuccess || selectedExam) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("examId");
        next.delete("search");
        return next;
      },
      { replace: true },
    );
    notify(copy.selectedExamNotAvailable, "warning");
  }, [examId, exams.isSuccess, selectedExam, setParams]);
  const setSearch = (value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value ? next.set("search", value) : next.delete("search");
        return next;
      },
      { replace: true },
    );
  const openQuestionEditor = (question?: Parameters<typeof questionDraft>[0], index = 0) => {
    const isEditing = Boolean(question?.id);
    setEditingId(question?.id || "");
    setForm(
      question ? questionDraft(question, index) : { ...emptyQuestion(), sortOrder: nextSortOrder },
    );
    setSubmitted(false);
    modal.open({
      title: isEditing ? copy.editQuestion : copy.newQuestion,
      description: selectedExam?.title || "آزمون",
      size: "xl",
      content: (
        <QuestionEditorModal
          initial={
            question
              ? questionDraft(question, index)
              : { ...emptyQuestion(), sortOrder: nextSortOrder }
          }
          editingId={question?.id || ""}
          disabled={!examId}
          nextSortOrder={nextSortOrder}
          busy={add.isPending}
          onCancel={modal.close}
          onSave={async (draft) => {
            await add.mutateAsync({ id: question?.id, draft });
            modal.close();
          }}
        />
      ),
    });
  };
  return (
    <div className="grid gap-5">
      <QuestionsSelector
        students={students.students}
        showStudentPicker={canReadStudents}
        showExamsLink={auth.can("exams.read")}
        studentId={students.studentId}
        setStudentId={(studentId) => {
          students.selectStudent(studentId);
        }}
        examId={examId}
        setExamId={(value) => {
          setParams((current) => {
            const next = new URLSearchParams(current);
            value ? next.set("examId", value) : next.delete("examId");
            students.studentId
              ? next.set("studentId", students.studentId)
              : next.delete("studentId");
            next.delete("search");
            return next;
          });
          setSelected([]);
        }}
        exams={exams.data ?? []}
        loading={exams.isLoading}
        error={exams.isError}
        selectedExam={selectedExam}
        questionCount={questions.data?.length || 0}
      />
      {selectedExam && auth.can("exams.assign") ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div>
            <strong className="text-sm">{copy.audience}</strong>
            <p className="text-xs text-slate-500">{copy.audienceDescription(selectedExam.title)}</p>
          </div>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              modal.open({
                title: copy.audienceModal(selectedExam.title),
                description: copy.audienceModalDescription,
                size: "xl",
                content: (
                  <ExamAssignmentManager
                    examId={selectedExam.id}
                    initialRules={selectedExam.audienceRules}
                    students={students.students}
                  />
                ),
              })
            }
          >
            {copy.manageAudience}
          </Button>
        </Card>
      ) : null}
      {auth.can("question_bank.manage") ? (
        <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div>
            <strong className="text-sm">{copy.questionBank}</strong>
            <p className="text-xs text-slate-500">{copy.questionBankDescription}</p>
          </div>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              modal.open({
                title: copy.questionBankModal,
                description: copy.questionBankModalDescription,
                size: "xl",
                content: <QuestionBankPanel />,
              })
            }
          >
            <BookOpen size={15} />
            {copy.openBank} <WandSparkles size={14} />
          </Button>
        </Card>
      ) : null}
      <section className="grid min-h-0 gap-3">
        <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div>
            <strong className="text-sm">{copy.list}</strong>
            <p className="text-xs text-slate-500">{copy.listDescription}</p>
          </div>
          {canCreate ? (
            <Button size="sm" disabled={!examId} onClick={() => openQuestionEditor()}>
              <Plus size={15} />
              {copy.newQuestion}
            </Button>
          ) : null}
        </Card>
        <QuestionsList
          examId={examId}
          items={visibleQuestions}
          total={questions.data?.length || 0}
          loading={questions.isLoading}
          error={questions.isError}
          search={search}
          setSearch={setSearch}
          selected={selected}
          setSelected={setSelected}
          bulkBusy={bulkDeleting}
          onBulkDelete={() =>
            void modal
              .confirm({
                title: copy.bulkDeleteTitle(selected.length),
                tone: "danger",
                confirmLabel: copy.deleteAll,
              })
              .then(async (ok) => {
                if (!ok) return;
                setBulkDeleting(true);
                try {
                  const ids = [...selected];
                  const results = await Promise.allSettled(
                    ids.map((id) => deleteExamQuestion(examId, id)),
                  );
                  const failed = ids.filter((_, i) => results[i]?.status === "rejected");
                  setSelected(failed);
                  if (editingId && !failed.includes(editingId) && ids.includes(editingId)) {
                    setEditingId("");
                    setForm({ ...emptyQuestion(), sortOrder: nextSortOrder });
                  }
                  failed.length
                    ? notify(copy.bulkDeleteFailed(failed.length), "warning")
                    : notify(copy.bulkDeleted);
                  void qc.invalidateQueries({
                    queryKey: ["exam-questions", examId],
                  });
                  void qc.invalidateQueries({ queryKey: ["question-bank-exams"] });
                  void qc.invalidateQueries({ queryKey: ["exams"] });
                } finally {
                  setBulkDeleting(false);
                }
              })
          }
          onCopy={(q, index) => {
            openQuestionEditor({ ...q, id: "" }, index);
          }}
          onEdit={(q, index) => {
            openQuestionEditor(q, index);
          }}
          onDelete={(q) =>
            q.id &&
            void modal
              .confirm({
                title: copy.deleteQuestion,
                description: copy.deleteQuestionDescription,
                tone: "danger",
                confirmLabel: copy.delete,
              })
              .then((ok) => ok && remove.mutate(q.id!))
          }
          onRetry={() => void questions.refetch()}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </section>
    </div>
  );
}

function QuestionEditorModal({
  initial,
  editingId,
  disabled,
  nextSortOrder,
  busy,
  onCancel,
  onSave,
}: {
  initial: QuestionDraft;
  editingId: string;
  disabled: boolean;
  nextSortOrder: number;
  busy: boolean;
  onCancel: () => void;
  onSave: (draft: QuestionDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const validationError = questionError(draft);
  return (
    <QuestionEditor
      editingId={editingId}
      form={draft}
      setForm={setDraft}
      submitted={submitted}
      validationError={validationError}
      busy={busy}
      disabled={disabled}
      nextSortOrder={nextSortOrder}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (!validationError) void onSave(draft);
      }}
    />
  );
}
