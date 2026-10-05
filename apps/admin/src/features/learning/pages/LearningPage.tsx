import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "../../../shared/ui/locale";
import { useModal } from "../../../shared/ui/modal";
import { Button, EmptyState } from "../../../shared/ui/ui";
import { LearningForm } from "../components/LearningForm";
import { LearningHeader } from "../components/LearningHeader";
import { LearningList } from "../components/LearningList";
import { LearningSidebar } from "../components/LearningSidebar";
import { LearningSummaryMetrics } from "../components/LearningSummaryMetrics";
import { ReviewHistory } from "../components/ReviewHistory";
import { LearningReviewForm } from "../components/LearningReviewForm";
import { useLearningData } from "../hooks/useLearningData";
import { useLearningMutations } from "../hooks/useLearningMutations";
import { useLearningPageState } from "../hooks/useLearningPageState";
import type { LearningItem } from "../model/learning-model";
import { notifications, notify } from "../../../shared/ui/notifications";
import { useAuth } from "../../auth";
import { learningCopy } from "../learning-locale";

export function LearningPage() {
  const auth = useAuth();
  const state = useLearningPageState();

  const modal = useModal();

  const queryClient = useQueryClient();

  const { formatDate, formatDateTime, language } = useLocale();
  const copy = learningCopy(language);

  const data = useLearningData({
    studentId: state.studentId,
    search: state.deferredSearch,
    filter: state.filter,
  });

  const mutations = useLearningMutations(state.studentId);

  function openEditor(item?: LearningItem) {
    modal.open({
      title: item ? copy.editItem : copy.addItem,

      description: copy.editorDescription,

      size: "lg",

      content: (
        <LearningForm
          studentId={state.studentId}
          item={item}
          onSaved={() => {
            modal.close();

            void queryClient.invalidateQueries({
              queryKey: ["student-learning", state.studentId],
            });
          }}
        />
      ),
    });
  }

  function openHistory(item: LearningItem) {
    modal.open({
      title: `${copy.historyTitle}: ${item.title}`,
      size: "md",
      content: (
        <ReviewHistory
          studentId={state.studentId}
          itemId={item.id}
          formatDateTime={formatDateTime}
        />
      ),
    });
  }

  function openReview(item: LearningItem) {
    modal.open({
      title: `${copy.reviewTitle}: ${item.title}`,
      description: copy.reviewDescription,
      size: "sm",
      content: (
        <LearningReviewForm studentId={state.studentId} itemId={item.id} onSaved={modal.close} />
      ),
    });
  }

  function confirmDelete(item: LearningItem) {
    void modal
      .confirm({
        title: copy.deleteTitle,

        description: copy.deleteDescription(item.title),

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

        const undoSeconds = 10;

        notifications.undoCountdown(
          copy.deletePreparing(item.title),

          undoSeconds,

          () => {
            cancelled = true;

            notify(copy.deleteCancelled, "info");
          },

          {
            description: copy.deleteUndoDescription,
          },
        );

        window.setTimeout(() => {
          if (cancelled) return;

          const loadingId = notifications.loading(copy.deleting);

          mutations.remove.mutate(
            item.id,

            {
              onSuccess() {
                notifications.dismiss(loadingId);

                notifications.success(copy.deleted, {
                  description: copy.deletedDescription(item.title),
                });

                void queryClient.invalidateQueries({
                  queryKey: ["student-learning", state.studentId],
                });
              },

              onError(error) {
                notifications.dismiss(loadingId);

                notifications.error(
                  copy.deleteFailed,

                  {
                    description: error instanceof Error ? error.message : copy.unknownError,
                  },
                );
              },
            },
          );
        }, undoSeconds * 1000);
      });
  }

  return (
    <div className="grid gap-4">
      <LearningHeader
        students={state.students.students}
        studentId={state.studentId}
        onStudentChange={(id) => state.updateLocation(id)}
        onCreate={auth.can("learning.create") ? () => openEditor() : undefined}
      />

      {!state.studentId ? (
        <EmptyState title={copy.selectStudent} />
      ) : data.learning.isError ? (
        <EmptyState
          title={copy.loadFailed}
          action={
            <Button variant="soft" onClick={() => void data.learning.refetch()}>
              {copy.retry}
            </Button>
          }
        />
      ) : (
        <>
          <LearningSummaryMetrics summary={data.summary} />

          <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <LearningList
              loading={data.learning.isLoading}
              items={data.items}
              search={state.search}
              filter={state.filter}
              formatDate={formatDate}
              onSearchChange={state.changeSearch}
              onFilterChange={state.changeFilter}
              onEdit={auth.can("learning.update") ? openEditor : undefined}
              onReview={auth.can("learning.review") ? openReview : undefined}
              onHistory={openHistory}
              onDelete={auth.can("learning.update") ? confirmDelete : undefined}
            />

            <LearningSidebar summary={data.summary} />
          </section>
        </>
      )}
    </div>
  );
}
