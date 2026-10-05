import { useModal } from "../../../shared/ui/modal";
import { notifications, notify } from "../../../shared/ui/notifications";
import { DataTransferWorkspace } from "../../../shared/ui/data-transfer";
import type { Exam } from "../../../shared/types/domain";
import { ExamAttempts } from "../components/ExamAttempts";
import { ExamAssignmentManager } from "../components/ExamAssignmentManager";
import { ExamFilters } from "../components/ExamFilters";
import { ExamForm } from "../components/ExamForm";
import { ExamList } from "../components/ExamList";
import { ExamsHeader } from "../components/ExamsHeader";
import { RetryRequestsPanel } from "../components/RetryRequestsPanel";
import { RetryReviewForm } from "../components/RetryReviewForm";
import { SyllabusForm } from "../components/SyllabusForm";
import { runExamBulkAction } from "../hooks/useExamBulkActions";
import { useExamFilters } from "../hooks/useExamFilters";
import { useExamMutations } from "../hooks/useExamMutations";
import { useExamsData } from "../hooks/useExamsData";
import { makeExamDraft } from "../model/exam-model";
import type { BulkExamAction, RetryRequest } from "../model/exam.types";
import { useAuth } from "../../auth";
import { useQuery } from "@tanstack/react-query";
import { getExamAnalytics, type ExamAnalytics } from "../api/exams.api";
import { Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocale } from "../../../shared/ui/locale";
import { examsCopy } from "../exams-locale";

export function ExamsPage() {
  const modal = useModal();
  const auth = useAuth();
  const { language } = useLocale();
  const copy = examsCopy(language);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useExamFilters();

  const data = useExamsData({
    search: filters.deferredSearch,
    status: filters.status,
    visibility: filters.visibility,
    canReadRetries: auth.can("retry_requests.read"),
  });

  const mutations = useExamMutations(filters.students.studentId);

  const openEditor = useCallback(
    (exam?: Exam) => {
      modal.open({
        title: exam ? copy.editExam : copy.newExam,
        size: "lg",
        content: (
          <ExamForm
            initial={makeExamDraft(exam)}
            onCancel={modal.close}
            onSubmit={async (body) => {
              await mutations.save.mutateAsync({
                id: exam?.id,
                body,
              });

              modal.close();
            }}
          />
        ),
      });
    },
    [copy.editExam, copy.newExam, modal, mutations.save],
  );

  useEffect(() => {
    if (searchParams.get("new") !== "1" || !auth.can("exams.create")) return;
    openEditor();
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("new");
        return next;
      },
      { replace: true },
    );
  }, [auth, openEditor, searchParams, setSearchParams]);

  function openRetryReview(request: RetryRequest, status: "approved" | "rejected") {
    modal.open({
      title: status === "approved" ? copy.reviewRetryApproved : copy.reviewRetryRejected,
      description: request.examTitle || copy.exam,
      content: (
        <RetryReviewForm
          status={status}
          initialNote={request.advisor_note || ""}
          onCancel={modal.close}
          onSubmit={async (advisorNote) => {
            await mutations.review.mutateAsync({
              id: request.id,
              status,
              advisorNote,
            });

            modal.close();
          }}
        />
      ),
    });
  }

  function confirmRemove(exam: Exam) {
    void modal
      .confirm({
        title: copy.deleteExamTitle,

        description: copy.deleteExamDescription(exam.title),

        tone: "danger",

        confirmLabel: copy.startDelete,

        softConfirm: true,

        softConfirmDuration: 2000,

        softConfirmProgressColor: "#fecaca",

        softConfirmBackgroundColor: "rgba(255,255,255,0.25)",
      })
      .then((ok) => {
        if (!ok) return;

        let cancelled = false;

        const deleteDelay = 10;

        notifications.undoCountdown(
          copy.deleteReady(exam.title),

          deleteDelay,

          () => {
            cancelled = true;

            notify(copy.deleteCancelled, "info");
          },

          {
            description: copy.deleteCountdown,
          },
        );

        window.setTimeout(() => {
          if (cancelled) return;

          const loadingId = notifications.loading(copy.deletingExam);

          mutations.remove.mutate(
            exam.id,

            {
              onSuccess() {
                notifications.dismiss(loadingId);

                notifications.success(copy.examDeleted, {
                  description: copy.deleteReady(exam.title),
                });

                void data.refreshExams();
              },

              onError(error) {
                notifications.dismiss(loadingId);

                notifications.error(copy.deleteFailed, {
                  description: error instanceof Error ? error.message : copy.unknownError,
                });
              },
            },
          );
        }, deleteDelay * 1000);
      });
  }

  function runBulk(action: BulkExamAction) {
    void runExamBulkAction({
      action,
      selected: filters.selected,
      exams: data.exams.data ?? [],
      modal,
      setSelected: filters.setSelected,
      refresh: () => {
        void data.refreshExams();
      },
    });
  }

  function handleToggle(exam: Exam) {
    if (!exam.published && !exam.delivery?.questionCount) {
      notify(copy.addQuestionBeforePublish, "warning");

      return;
    }

    mutations.togglePublish.mutate({
      id: exam.id,
      published: !exam.published,
    });
  }

  function openSyllabus(exam: Exam) {
    modal.open({
      title: copy.addSyllabus,
      description: exam.title,
      content: (
        <SyllabusForm
          onCancel={modal.close}
          onSubmit={async (syllabus) => {
            await mutations.addSyllabus.mutateAsync({
              examId: exam.id,
              data: syllabus,
            });

            modal.close();
          }}
        />
      ),
    });
  }

  function deleteSyllabus(id: string) {
    void modal
      .confirm({
        title: copy.deleteSyllabusTitle,
        tone: "danger",
      })
      .then((ok) => ok && mutations.deleteSyllabus.mutate(id));
  }

  function checkExam(examId: string, checked: boolean) {
    filters.setSelected((items) =>
      checked ? [...new Set([...items, examId])] : items.filter((id) => id !== examId),
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <ExamsHeader
        students={filters.students.students}
        studentId={filters.students.studentId}
        onStudentChange={filters.students.selectStudent}
        onCreate={auth.can("exams.create") ? () => openEditor() : undefined}
        onHistory={() =>
          modal.open({
            title: copy.attemptHistory,
            size: "xl",
            content: <ExamAttempts studentId={filters.students.studentId} />,
          })
        }
        onMore={
          auth.can("import.preview") || auth.can("export.read")
            ? () =>
                modal.open({
                  title: copy.transferTitle,
                  size: "xl",
                  content: (
                    <DataTransferWorkspace
                      studentId={filters.students.studentId}
                      scope="exams"
                      title={copy.transferWorkspaceTitle}
                      description={copy.transferWorkspaceDescription}
                      showExamReplacement
                      canImport={auth.can("import.preview")}
                      canCommit={auth.can("import.commit")}
                      canExport={auth.can("export.read")}
                      onImported={() => void data.refreshExams()}
                    />
                  ),
                })
            : undefined
        }
      />

      <ExamFilters
        exams={data.exams.data ?? []}
        pendingRetryCount={data.pendingRetries.length}
        search={filters.search}
        status={filters.status}
        visibility={filters.visibility}
        selectedCount={filters.selected.length}
        onSearchChange={filters.setSearch}
        onStatusChange={filters.setStatus}
        onVisibilityChange={filters.setVisibility}
        onClear={filters.clearFilters}
        onBulk={runBulk}
      />

      {data.pendingRetries.length ? (
        <RetryRequestsPanel
          requests={data.pendingRetries}
          onReview={auth.can("retry_requests.moderate") ? openRetryReview : undefined}
        />
      ) : null}

      <ExamList
        exams={data.exams.data ?? []}
        filtered={data.filtered}
        selected={filters.selected}
        studentId={filters.students.studentId}
        loading={data.exams.isLoading}
        error={data.exams.isError}
        toggleBusyId={
          mutations.togglePublish.isPending ? mutations.togglePublish.variables?.id : undefined
        }
        onRetry={() => void data.exams.refetch()}
        onManageAssignments={
          auth.can("exams.assign")
            ? (exam) =>
                modal.open({
                  title: copy.assignmentTitle(exam.title),
                  description: copy.assignmentDescription,
                  size: "lg",
                  content: (
                    <ExamAssignmentManager
                      examId={exam.id}
                      initialRules={exam.audienceRules}
                      students={filters.students.students}
                    />
                  ),
                })
            : undefined
        }
        onAnalytics={
          auth.can("exams.read")
            ? (exam) =>
                modal.open({
                  title: copy.analyticsTitle(exam.title),
                  description: copy.analyticsDescription,
                  size: "xl",
                  content: <ExamAnalyticsPanel examId={exam.id} />,
                })
            : undefined
        }
        onSelectAll={
          auth.can("exams.update")
            ? (checked) => filters.setSelected(checked ? data.filtered.map((exam) => exam.id) : [])
            : undefined
        }
        onCheck={auth.can("exams.update") ? checkExam : undefined}
        onEdit={auth.can("exams.update") ? openEditor : undefined}
        onDelete={auth.can("exams.delete") ? confirmRemove : undefined}
        onToggle={auth.can("exams.update") ? handleToggle : undefined}
        onAddSyllabus={auth.can("syllabus.manage") ? openSyllabus : undefined}
        onDeleteSyllabus={auth.can("syllabus.manage") ? deleteSyllabus : undefined}
        showQuestions={auth.can("questions.read")}
      />
    </div>
  );
}

function ExamAnalyticsPanel({ examId }: { examId: string }) {
  const { language } = useLocale();
  const copy = examsCopy(language);
  const analytics = useQuery({
    queryKey: ["exam-analytics", examId],
    queryFn: () => getExamAnalytics(examId),
  });
  if (analytics.isLoading) return <LoadingState label={copy.loadingAnalytics} />;
  if (analytics.isError || !analytics.data) return <EmptyState title={copy.loadAnalyticsFailed} />;
  return <ExamAnalyticsView value={analytics.data} />;
}
function ExamAnalyticsView({ value }: { value: ExamAnalytics }) {
  const { language } = useLocale();
  const copy = examsCopy(language);
  const locale = language === "fa" ? "fa-IR" : "en-US";
  return (
    <Card className="grid gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-sm">{copy.overallResult}</strong>
          <p className="text-xs text-slate-500">{copy.submittedAndExpiredAttempts}</p>
        </div>
        <strong className="rounded-lg bg-brand/10 px-2 py-1 text-xs text-brand">
          {copy.analyticsAttempts(value.attempts, value.averagePercent)}
        </strong>
      </div>
      {value.byGrade.length ? (
        <div className="flex flex-wrap gap-2">
          {value.byGrade.map((row) => (
            <span key={row.grade} className="rounded-lg border px-2 py-1 text-xs">
              {row.grade}: {row.averagePercent.toLocaleString(locale)}
              {language === "fa" ? "٪" : "%"} ({row.attempts.toLocaleString(locale)})
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2">
        {value.questions.map((question, index) => (
          <article key={question.id} className="grid gap-1 rounded-xl border p-2.5">
            <div className="flex items-start justify-between gap-3">
              <strong className="text-sm">
                {(index + 1).toLocaleString(locale)}. {question.text}
              </strong>
              <span className="shrink-0 text-xs text-slate-500">
                {question.accuracy === null
                  ? copy.noAttemptsYet
                  : copy.correctPercent(question.accuracy)}
              </span>
            </div>
            <small className="text-xs text-slate-500">
              {copy.responseBreakdown(
                question.responses.a || 0,
                question.responses.b || 0,
                question.responses.c || 0,
                question.responses.d || 0,
                question.responses.blank || 0,
              )}
            </small>
          </article>
        ))}
      </div>
    </Card>
  );
}
