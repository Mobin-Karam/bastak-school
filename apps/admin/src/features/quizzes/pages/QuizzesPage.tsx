import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useModal } from "../../../shared/ui/modal";
import {
  AssessmentMetric,
  AssessmentWorkspaceIntro,
} from "../../../shared/ui/assessment-workspace-intro";
import { BookOpen, CircleHelp, Pencil, Plus } from "lucide-react";
import { notify } from "../../../shared/ui/notifications";
import { useAuth } from "../../auth/hooks/useAuth";
import { listStudents } from "../../students/api/students.api";
import { listClasses } from "../../education/api/classes.api";
import { StudentAllocationControl } from "../../../shared/ui/student-allocation-control";
import { Button, Card } from "../../../shared/ui/ui";
import {
  emptyQuestion,
  questionDraft,
  questionError,
  questionMatches,
} from "../../questions/question-model";
import {
  createQuiz,
  createQuizQuestion,
  deleteQuiz,
  deleteQuizQuestion,
  getQuizAssignments,
  getQuizAnalytics,
  getQuizClassAssignments,
  getQuizQuestions,
  getQuizzes,
  releaseQuizResults,
  setQuizAssignments,
  setQuizAudienceRules,
  setQuizClassAssignments,
  updateQuiz,
  updateQuizQuestion,
} from "../api/quizzes.api";
import { QuizEditor } from "../components/QuizEditor";
import { QuizQuestionEditor } from "../components/QuizQuestionEditor";
import { QuizQuestionsList } from "../components/QuizQuestionsList";
import { QuizSidebar } from "../components/QuizSidebar";
import { QuizQuestionBankPanel } from "../components/QuizQuestionBankPanel";
import type { QuizDraft } from "../model/quiz.types";
import { useQuizCopy } from "../model/quiz-locale";
import { normalizePersianText } from "../../../shared/lib/utils";
export function QuizzesPage() {
  const copy = useQuizCopy();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [quizId, setQuizIdState] = useState(params.get("quizId") || "");
  const [search, setSearch] = useState(params.get("question") || "");
  const [quizSearch, setQuizSearch] = useState(params.get("q") || "");
  const [status, setStatus] = useState(params.get("status") || "all");
  const [view, setView] = useState<"quizzes" | "bank">("quizzes");
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [audienceRules, setAudienceRules] = useState({
    gradeIds: [] as number[],
    educationTypeIds: [] as string[],
    trackIds: [] as string[],
    learnerProfiles: [] as string[],
    independentTypes: [] as string[],
  });
  const modal = useModal();
  const auth = useAuth();
  const canCreate = auth.can("quizzes.create");
  const canUpdate = auth.can("quizzes.update");
  const canManageQuestions = auth.can("quiz_questions.manage");
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: getQuizzes });
  const questions = useQuery({
    queryKey: ["quiz-questions", quizId],
    enabled: !!quizId,
    queryFn: () => getQuizQuestions(quizId),
  });
  const students = useQuery({
    queryKey: ["students", "quiz-allocation"],
    queryFn: listStudents,
    enabled: !!quizId && canUpdate,
  });
  const assignments = useQuery({
    queryKey: ["quiz-assignments", quizId],
    queryFn: () => getQuizAssignments(quizId),
    enabled: !!quizId && canUpdate,
  });
  const classes = useQuery({
    queryKey: ["classes", "quiz-allocation"],
    queryFn: () => listClasses(),
    enabled: !!quizId && canUpdate,
  });
  const classAssignments = useQuery({
    queryKey: ["quiz-class-assignments", quizId],
    queryFn: () => getQuizClassAssignments(quizId),
    enabled: !!quizId && canUpdate,
  });
  const analytics = useQuery({
    queryKey: ["quiz-analytics", quizId],
    queryFn: () => getQuizAnalytics(quizId),
    enabled: !!quizId && auth.can("quizzes.read"),
  });
  const selected = quizzes.data?.find((item) => item.id === quizId);
  const normalizeSearch = (value: string) =>
    copy.language === "fa"
      ? normalizePersianText(value).toLocaleLowerCase(copy.numberLocale)
      : value.toLocaleLowerCase(copy.numberLocale);
  const visibleQuizzes = (quizzes.data || []).filter(
    (item) =>
      normalizeSearch(`${item.title} ${item.subject || ""} ${item.exam?.title || ""}`).includes(
        normalizeSearch(quizSearch.trim()),
      ) &&
      (status === "all" || (status === "active" ? !!item.active : !item.active)),
  );
  function setQuizId(value: string) {
    setQuizIdState(value);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value ? next.set("quizId", value) : next.delete("quizId");
        return next;
      },
      { replace: true },
    );
  }
  function syncFilter(key: "q" | "status" | "question", value: string, fallback = "") {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value && value !== fallback ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  useEffect(() => {
    if (!quizId && quizzes.data?.[0]) setQuizId(quizzes.data[0].id);
  }, [quizId, quizzes.data]);
  useEffect(() => {
    if (quizId && quizzes.isSuccess && !selected) {
      setQuizId("");
      notify(copy.selectedQuizMissing, "warning");
    }
  }, [copy.language, quizId, quizzes.isSuccess, selected]);
  useEffect(
    () => setAssignedStudentIds((assignments.data || []).map((item) => item.studentId)),
    [assignments.data],
  );
  useEffect(
    () => setAssignedClassIds((classAssignments.data || []).map((item) => item.classId)),
    [classAssignments.data],
  );
  useEffect(
    () =>
      setAudienceRules({
        gradeIds: [],
        educationTypeIds: [],
        trackIds: [],
        learnerProfiles: [],
        independentTypes: [],
        ...(selected?.audienceRules || {}),
      }),
    [selected?.id],
  );
  const save = useMutation({
    mutationFn: ({ id, draft }: { id?: string; draft: QuizDraft }) =>
      id ? updateQuiz(id, draft) : createQuiz(draft),
    onSuccess: (value, variables) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      notify(variables.id ? copy.quizSaved : copy.quizCreated);
      if (value && typeof value === "object" && "id" in value) setQuizId(String(value.id));
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.saveQuizFailed, "error"),
  });
  const toggle = useMutation({
    mutationFn: () => updateQuiz(quizId, { active: !selected?.active }),
    onSuccess: () => {
      notify(selected?.active ? copy.quizDeactivated : copy.quizActivated);
      void qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.toggleQuizFailed, "error"),
  });
  const removeQuiz = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: (result: { archived?: boolean }) => {
      notify(result.archived ? copy.quizArchived : copy.quizDeleted);
      setQuizId("");
      void qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.deleteQuizFailed, "error"),
  });
  const saveAssignments = useMutation({
    mutationFn: () => setQuizAssignments(quizId, assignedStudentIds),
    onSuccess: () => {
      notify(copy.studentAccessSaved);
      void qc.invalidateQueries({ queryKey: ["quiz-assignments", quizId] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.saveAccessFailed, "error"),
  });
  const saveClassAssignments = useMutation({
    mutationFn: () => setQuizClassAssignments(quizId, assignedClassIds),
    onSuccess: () => {
      notify(copy.classAccessSaved);
      void qc.invalidateQueries({ queryKey: ["quiz-class-assignments", quizId] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.saveAccessFailed, "error"),
  });
  const saveAudienceRules = useMutation({
    mutationFn: () => setQuizAudienceRules(quizId, audienceRules),
    onSuccess: () => {
      notify(copy.audienceRulesSaved);
      void qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.saveAudienceRulesFailed, "error"),
  });
  const releaseResults = useMutation({
    mutationFn: () => releaseQuizResults(quizId),
    onSuccess: () => {
      notify(copy.resultsReleased);
      void qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.releaseResultsFailed, "error"),
  });
  const add = useMutation({
    mutationFn: ({ id, draft }: { id?: string; draft: ReturnType<typeof emptyQuestion> }) =>
      id ? updateQuizQuestion(id, draft) : createQuizQuestion(quizId, draft),
    onSuccess: (_, variables) => {
      notify(variables.id ? copy.questionSaved : copy.questionAdded);
      qc.invalidateQueries({ queryKey: ["quiz-questions", quizId] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.saveQuestionFailed, "error"),
  });
  const visibleQuestions = (questions.data ?? []).filter((item) => questionMatches(item, search));
  const remove = useMutation({
    mutationFn: deleteQuizQuestion,
    onSuccess: () => {
      notify(copy.questionDeleted);
      void qc.invalidateQueries({ queryKey: ["quiz-questions", quizId] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.deleteQuestionFailed, "error"),
  });
  const openQuizEditor = (item?: typeof selected) => {
    const initial: QuizDraft = item
      ? {
          title: item.title,
          subject: item.subject || "",
          durationMinutes: item.durationMinutes || 20,
          attemptLimit: item.attemptLimit || 1,
          openAt: item.openAt || null,
          closeAt: item.closeAt || null,
          resultPolicy: item.resultPolicy || "immediate",
        }
      : { title: "", subject: "", durationMinutes: 20, attemptLimit: 1, resultPolicy: "immediate" };
    modal.open({
      title: item ? copy.editQuiz : copy.newQuiz,
      description: copy.editorDescription,
      size: "lg",
      content: (
        <QuizEditorModal
          initial={initial}
          selected={item}
          busy={save.isPending}
          onSave={async (draft: QuizDraft) => {
            await save.mutateAsync({ id: item?.id, draft });
            modal.close();
          }}
          onToggle={() => item && toggle.mutate()}
          onDelete={() => item && removeQuiz.mutate(item.id)}
        />
      ),
    });
  };
  const openQuestionEditor = (item?: Parameters<typeof questionDraft>[0], index = 0) =>
    modal.open({
      title: item?.id ? `${copy.editQuestion} ${copy.quiz}` : `${copy.newQuestion} ${copy.quiz}`,
      size: "xl",
      content: (
        <QuizQuestionEditorModal
          initial={item ? questionDraft(item, index) : emptyQuestion()}
          editingId={item?.id}
          busy={add.isPending}
          onCancel={modal.close}
          onSave={async (draft: ReturnType<typeof emptyQuestion>) => {
            await add.mutateAsync({ id: item?.id, draft });
            modal.close();
          }}
        />
      ),
    });
  return (
    <div className="grid gap-5">
      <AssessmentWorkspaceIntro
        icon={<CircleHelp size={20} />}
        title={copy.quizzes}
        description={copy.workspaceDescription}
        metrics={
          <>
            <AssessmentMetric>
              {(quizzes.data || []).length.toLocaleString(copy.numberLocale)} {copy.quizzes}
            </AssessmentMetric>
            <AssessmentMetric>
              {(quizzes.data || [])
                .filter((item) => item.active)
                .length.toLocaleString(copy.numberLocale)}{" "}
              {copy.active}
            </AssessmentMetric>
          </>
        }
      />
      <nav
        className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900"
        aria-label={copy.sectionsLabel}
      >
        <Button
          variant={view === "quizzes" ? "soft" : "ghost"}
          size="sm"
          onClick={() => setView("quizzes")}
        >
          <CircleHelp size={15} />
          {copy.quizzes}
        </Button>
        <Button
          variant={view === "bank" ? "soft" : "ghost"}
          size="sm"
          onClick={() => setView("bank")}
        >
          <BookOpen size={15} />
          {copy.bank}
        </Button>
      </nav>
      {view === "bank" ? (
        <QuizQuestionBankPanel selectedQuizId={quizId} canManage={canManageQuestions} />
      ) : null}
      {view === "quizzes" ? (
        <>
          <section className="grid gap-4">
            <QuizSidebar
              quizzes={visibleQuizzes}
              loading={quizzes.isLoading}
              error={quizzes.isError}
              selectedId={quizId}
              search={quizSearch}
              status={status}
              onNew={() => openQuizEditor()}
              onSearch={(v) => {
                setQuizSearch(v);
                syncFilter("q", v);
              }}
              onStatus={(v) => {
                setStatus(v);
                syncFilter("status", v, "all");
              }}
              onSelect={setQuizId}
              onRetry={() => void quizzes.refetch()}
              onClear={() => {
                setQuizSearch("");
                setStatus("all");
                syncFilter("q", "");
                syncFilter("status", "all", "all");
              }}
              canCreate={canCreate}
            />
            <div className="grid gap-4">
              {quizId && selected ? (
                <Card className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-brand">{copy.selectedQuiz}</span>
                    <strong className="mt-1 block truncate text-base">{selected.title}</strong>
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.subject || copy.noSubject} ·{" "}
                      {selected.durationMinutes.toLocaleString(copy.numberLocale)} {copy.minutes} ·{" "}
                      {selected.questions.length.toLocaleString(copy.numberLocale)} {copy.questions}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {canUpdate ? (
                      <Button size="sm" variant="soft" onClick={() => openQuizEditor(selected)}>
                        <Pencil size={15} />
                        {copy.edit}
                      </Button>
                    ) : null}
                    {canUpdate ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void modal
                            .confirm({
                              title: selected?.active ? copy.toggleOffTitle : copy.toggleOnTitle,
                              description: selected?.active
                                ? copy.toggleOffDescription
                                : copy.toggleOnDescription,
                              confirmLabel: selected?.active ? copy.deactivate : copy.activate,
                            })
                            .then((ok) => ok && toggle.mutate())
                        }
                      >
                        {selected.active ? copy.inactive : copy.active}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ) : null}
              {quizId && selected && canUpdate ? (
                <Card className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
                  <div>
                    <strong className="text-sm">{copy.audienceAndRelease}</strong>
                    <p className="text-xs text-slate-500">
                      {assignedStudentIds.length.toLocaleString(copy.numberLocale)}{" "}
                      {copy.directStudents} ·{" "}
                      {assignedClassIds.length.toLocaleString(copy.numberLocale)} {copy.classes} ·{" "}
                      {audienceRules.gradeIds.length +
                        audienceRules.educationTypeIds.length +
                        audienceRules.trackIds.length +
                        audienceRules.learnerProfiles.length +
                        audienceRules.independentTypes.length}{" "}
                      {copy.rules}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={() =>
                        modal.open({
                          title: copy.audienceTitle,
                          description: copy.audienceDescription,
                          size: "xl",
                          content: (
                            <QuizAudienceModal
                              students={students.data || []}
                              classes={classes.data || []}
                              studentIds={assignedStudentIds}
                              setStudentIds={setAssignedStudentIds}
                              classIds={assignedClassIds}
                              setClassIds={setAssignedClassIds}
                              rules={audienceRules}
                              setRules={setAudienceRules}
                              onSaveStudents={() => saveAssignments.mutate()}
                              onSaveClasses={() => saveClassAssignments.mutate()}
                              onSaveRules={() => saveAudienceRules.mutate()}
                              busy={
                                saveAssignments.isPending ||
                                saveClassAssignments.isPending ||
                                saveAudienceRules.isPending
                              }
                            />
                          ),
                        })
                      }
                    >
                      {copy.manageAudience}
                    </Button>
                    {selected.resultPolicy === "manual" ? (
                      <Button
                        size="sm"
                        variant="soft"
                        loading={releaseResults.isPending}
                        onClick={() => releaseResults.mutate()}
                      >
                        {copy.releaseResults}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ) : null}
              {quizId && analytics.data ? (
                <Card className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
                  <div>
                    <strong className="text-sm">{copy.performanceAnalytics}</strong>
                    <p className="text-xs text-slate-500">
                      {analytics.data.attempts.toLocaleString(copy.numberLocale)}{" "}
                      {copy.submittedAttempts}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() =>
                      modal.open({
                        title: copy.performanceAnalytics,
                        description: copy.analyticsDescription,
                        size: "xl",
                        content: <QuizAnalyticsPanel value={analytics.data!} />,
                      })
                    }
                  >
                    {copy.viewAnalytics}
                  </Button>
                </Card>
              ) : null}
              {quizId ? (
                <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
                  {canManageQuestions ? (
                    <Card className="flex items-center justify-between gap-2 p-3">
                      <div>
                        <strong className="text-sm">{copy.quizQuestions}</strong>
                        <p className="text-xs text-slate-500">{copy.questionsEditorHelp}</p>
                      </div>
                      <Button size="sm" onClick={() => openQuestionEditor()}>
                        <Plus size={15} />
                        {copy.newQuestion}
                      </Button>
                    </Card>
                  ) : null}
                  <QuizQuestionsList
                    items={visibleQuestions}
                    loading={questions.isLoading}
                    error={questions.isError}
                    search={search}
                    onSearch={(v) => {
                      setSearch(v);
                      syncFilter("question", v);
                    }}
                    onRetry={() => void questions.refetch()}
                    onEdit={(item, index) => openQuestionEditor(item, index)}
                    onDelete={(item) =>
                      void modal
                        .confirm({
                          title: copy.deleteQuestionTitle,
                          description: copy.deleteQuestionDescription,
                          tone: "danger",
                          confirmLabel: copy.delete,
                        })
                        .then((ok) => ok && remove.mutate(item.id))
                    }
                    canManage={canManageQuestions}
                  />
                </section>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function QuizAnalyticsPanel({ value }: { value: import("../api/quizzes.api").QuizAnalytics }) {
  const copy = useQuizCopy();
  return (
    <Card className="grid gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-sm">{copy.performanceAnalytics}</strong>
          <p className="text-xs text-slate-500">{copy.analyticsDescription}</p>
        </div>
        <span className="rounded-lg bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
          {value.attempts.toLocaleString(copy.numberLocale)} {copy.analyticsAttempts} ·{" "}
          {value.averagePercent === null
            ? "—"
            : `${value.averagePercent.toLocaleString(copy.numberLocale)}%`}
        </span>
      </div>
      {value.byGrade.length ? (
        <div className="flex flex-wrap gap-2">
          {value.byGrade.map((row) => (
            <span key={row.grade} className="rounded-lg border px-2 py-1 text-xs">
              {copy.grade} {row.grade}: {row.averagePercent.toLocaleString(copy.numberLocale)}% (
              {row.attempts.toLocaleString(copy.numberLocale)})
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2">
        {value.questions.map((question, index) => (
          <article key={question.id} className="grid gap-1 rounded-xl border p-2.5">
            <div className="flex items-start justify-between gap-3">
              <strong className="text-sm">
                {(index + 1).toLocaleString(copy.numberLocale)}. {question.text}
              </strong>
              <span className="shrink-0 text-xs text-slate-500">
                {question.accuracy === null
                  ? copy.noAttempts
                  : copy.correctPercent(question.accuracy.toLocaleString(copy.numberLocale))}
              </span>
            </div>
            <small className="text-xs text-slate-500">
              {copy.responseLabel("A")}:{" "}
              {(question.responses.a || 0).toLocaleString(copy.numberLocale)} ·{" "}
              {copy.responseLabel("B")}:{" "}
              {(question.responses.b || 0).toLocaleString(copy.numberLocale)} ·{" "}
              {copy.responseLabel("C")}:{" "}
              {(question.responses.c || 0).toLocaleString(copy.numberLocale)} ·{" "}
              {copy.responseLabel("D")}:{" "}
              {(question.responses.d || 0).toLocaleString(copy.numberLocale)} ·{" "}
              {copy.blankResponses}:{" "}
              {(question.responses.blank || 0).toLocaleString(copy.numberLocale)}
            </small>
          </article>
        ))}
      </div>
    </Card>
  );
}

function AudienceRuleControl({
  students,
  value,
  onChange,
  onSave,
  saving,
}: {
  students: Array<{
    gradeId?: number | null;
    educationTypeId?: string | null;
    trackId?: string | null;
    learnerProfile?: "school" | "independent" | null;
    independentType?: string | null;
  }>;
  value: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  };
  onChange: (next: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  }) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const copy = useQuizCopy();
  const grades = [
    ...new Set(
      students
        .map((student) => student.gradeId)
        .filter((value): value is number => typeof value === "number"),
    ),
  ].sort((a, b) => a - b);
  const types = [
    ...new Set(
      students
        .map((student) => student.educationTypeId)
        .filter((value): value is string => !!value),
    ),
  ].sort();
  const tracks = [
    ...new Set(
      students.map((student) => student.trackId).filter((value): value is string => !!value),
    ),
  ].sort();
  const toggle = <T,>(
    key: "gradeIds" | "educationTypeIds" | "trackIds" | "learnerProfiles" | "independentTypes",
    item: T,
  ) =>
    onChange({
      ...value,
      [key]: (value[key] as T[]).includes(item)
        ? (value[key] as T[]).filter((entry) => entry !== item)
        : [...(value[key] as T[]), item],
    } as typeof value);
  return (
    <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
      <div>
        <strong className="text-sm">{copy.audienceRules}</strong>
        <p className="text-xs text-slate-500">{copy.audienceRulesHelp}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <RuleChoices
          title={copy.grade}
          values={grades}
          selected={value.gradeIds}
          label={(item) => `${copy.grade} ${item.toLocaleString(copy.numberLocale)}`}
          onToggle={(item) => toggle("gradeIds", item)}
        />
        <RuleChoices
          title={copy.educationType}
          values={types}
          selected={value.educationTypeIds}
          label={(item) => item}
          onToggle={(item) => toggle("educationTypeIds", item)}
        />
        <RuleChoices
          title={copy.track}
          values={tracks}
          selected={value.trackIds}
          label={(item) => item}
          onToggle={(item) => toggle("trackIds", item)}
        />
        <RuleChoices
          title={copy.learnerProfile}
          values={["school", "independent"]}
          selected={value.learnerProfiles}
          label={(item) => (item === "school" ? copy.schoolLearner : copy.independentLearner)}
          onToggle={(item) => toggle("learnerProfiles", item)}
        />
        <RuleChoices
          title={copy.independentType}
          values={["adult", "gap_year", "homeschool", "other"]}
          selected={value.independentTypes}
          label={(item) =>
            copy.independentTypes[item as keyof typeof copy.independentTypes] || item
          }
          onToggle={(item) => toggle("independentTypes", item)}
        />
      </div>
      <div>
        <Button size="sm" loading={saving} onClick={onSave}>
          {copy.saveRules}
        </Button>
      </div>
    </section>
  );
}
function RuleChoices<T extends string | number>({
  title,
  values,
  selected,
  label,
  onToggle,
}: {
  title: string;
  values: T[];
  selected: T[];
  label: (value: T) => string;
  onToggle: (value: T) => void;
}) {
  const copy = useQuizCopy();
  return (
    <div className="grid gap-1 rounded-xl border p-2">
      <strong className="text-xs">{title}</strong>
      {values.map((item) => (
        <label key={String(item)} className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="accent-brand"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
          />
          {label(item)}
        </label>
      ))}
      {!values.length ? <small className="text-xs text-slate-500">{copy.noData}</small> : null}
    </div>
  );
}

function QuizAudienceModal({
  students,
  classes,
  studentIds,
  setStudentIds,
  classIds,
  setClassIds,
  rules,
  setRules,
  onSaveStudents,
  onSaveClasses,
  onSaveRules,
  busy,
}: {
  students: Parameters<typeof StudentAllocationControl>[0]["students"];
  classes: Array<{
    id: string;
    name: string;
    code: string;
    schoolYear: string;
    enrollmentCount: number;
    status: string;
  }>;
  studentIds: string[];
  setStudentIds: (ids: string[]) => void;
  classIds: string[];
  setClassIds: (ids: string[]) => void;
  rules: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  };
  setRules: (rules: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  }) => void;
  onSaveStudents: () => void;
  onSaveClasses: () => void;
  onSaveRules: () => void;
  busy: boolean;
}) {
  const copy = useQuizCopy();
  const [tab, setTab] = useState<"students" | "classes" | "rules">("students");
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {(
          [
            ["students", copy.audienceStudents],
            ["classes", copy.audienceClasses],
            ["rules", copy.audienceEducationRules],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "soft" : "ghost"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "students" ? (
        <>
          <StudentAllocationControl
            students={students}
            selectedIds={studentIds}
            onChange={setStudentIds}
            label={copy.targetStudents}
          />
          <Button loading={busy} onClick={onSaveStudents}>
            {copy.saveStudents}
          </Button>
        </>
      ) : null}
      {tab === "classes" ? (
        <>
          <p className="text-xs text-slate-500">{copy.classAudienceHelp}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {classes
              .filter((item) => item.status === "ACTIVE")
              .map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 ${classIds.includes(item.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-brand"
                    checked={classIds.includes(item.id)}
                    onChange={() =>
                      setClassIds(
                        classIds.includes(item.id)
                          ? classIds.filter((id) => id !== item.id)
                          : [...classIds, item.id],
                      )
                    }
                  />
                  <span>
                    <strong className="block text-sm">{item.name}</strong>
                    <small className="text-xs text-slate-500">
                      {item.code} · {item.schoolYear} ·{" "}
                      {item.enrollmentCount.toLocaleString(copy.numberLocale)} {copy.students}
                    </small>
                  </span>
                </label>
              ))}
          </div>
          <Button loading={busy} onClick={onSaveClasses}>
            {copy.saveClasses}
          </Button>
        </>
      ) : null}
      {tab === "rules" ? (
        <AudienceRuleControl
          students={students}
          value={rules}
          onChange={setRules}
          onSave={onSaveRules}
          saving={busy}
        />
      ) : null}
    </div>
  );
}

function QuizEditorModal({
  initial,
  selected,
  busy,
  onSave,
  onToggle,
  onDelete,
}: {
  initial: QuizDraft;
  selected?: import("../model/quiz.types").Quiz;
  busy: boolean;
  onSave: (draft: QuizDraft) => Promise<void>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  return (
    <QuizEditor
      quiz={draft}
      setQuiz={setDraft}
      selected={selected}
      busy={busy}
      onSave={() => void onSave(draft)}
      onToggle={onToggle}
      onDelete={onDelete}
    />
  );
}
function QuizQuestionEditorModal({
  initial,
  editingId,
  busy,
  onCancel,
  onSave,
}: {
  initial: ReturnType<typeof emptyQuestion>;
  editingId?: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (draft: ReturnType<typeof emptyQuestion>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  return (
    <QuizQuestionEditor
      editingId={editingId || ""}
      question={draft}
      setQuestion={setDraft}
      error={questionError(draft)}
      busy={busy}
      onCancel={onCancel}
      onSave={() => void onSave(draft)}
    />
  );
}
