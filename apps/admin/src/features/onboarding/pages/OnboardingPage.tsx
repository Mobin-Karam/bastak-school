import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import {
  ManagementPageHeader,
  ManagementStat,
  ManagementSummaryBar,
} from "../../../shared/ui/management-workspace";
import {
  assignStudent,
  listAdvisors,
  listOnboardingOrganizations,
  listPendingStudents,
} from "../api/onboarding.api";
import { OnboardingModeSelector } from "../components/OnboardingModeSelector";
import { OnboardingQueueItem } from "../components/OnboardingQueueItem";
import { assignmentInputFor, displayAdvisor } from "../model/onboarding.model";
import { onboardingCopy } from "../onboarding-locale";
import type {
  ManualAssignmentChoice,
  OnboardingMode,
  StudentAssignment,
} from "../types/onboarding.types";

const emptyManualChoice: ManualAssignmentChoice = { organizationId: "", advisorUserId: "" };

export function OnboardingPage() {
  const { language, profile } = useLocale();
  const copy = onboardingCopy(language);
  const queryClient = useQueryClient();
  const students = useQuery({ queryKey: ["onboarding", "pending"], queryFn: listPendingStudents });
  const organizations = useQuery({
    queryKey: ["organizations", "onboarding"],
    queryFn: listOnboardingOrganizations,
  });
  const advisors = useQuery({
    queryKey: ["users", "advisors", "onboarding"],
    queryFn: listAdvisors,
  });
  const [mode, setMode] = useState<OnboardingMode>("AUTO");
  const [selection, setSelection] = useState<Record<string, ManualAssignmentChoice>>({});
  const [completed, setCompleted] = useState<StudentAssignment | null>(null);
  const assignment = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof assignStudent>[1] }) =>
      assignStudent(id, values),
    onSuccess: (result) => {
      setCompleted(result);
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "pending"] });
    },
  });
  const directoryUnavailable = organizations.isError || advisors.isError;

  return (
    <section className="space-y-5">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <ManagementSummaryBar>
        <ManagementStat label={copy.pending} value={students.data?.length ?? 0} active />
        <ManagementStat
          label={copy.activeOrganization}
          value={organizations.data?.filter((item) => item.status === "ACTIVE").length ?? 0}
        />
        <ManagementStat
          label={copy.advisorReady}
          value={advisors.data?.length ?? 0}
          tone="success"
        />
      </ManagementSummaryBar>
      <Card className="p-2">
        <OnboardingModeSelector value={mode} onChange={setMode} />
      </Card>
      {completed ? <AssignmentSuccess assignment={completed} /> : null}
      <OnboardingQueueState
        loading={students.isLoading}
        error={students.isError}
        empty={!students.data?.length}
        onRetry={() => void students.refetch()}
      />
      {!students.isLoading && !students.isError ? (
        <div className="grid gap-4">
          {students.data?.map((student) => {
            const choice = selection[student.id] ?? emptyManualChoice;
            return (
              <OnboardingQueueItem
                key={student.id}
                student={student}
                mode={mode}
                choice={choice}
                organizations={organizations.data}
                advisors={advisors.data}
                directoryUnavailable={directoryUnavailable}
                pending={assignment.isPending && assignment.variables?.id === student.id}
                onChoiceChange={(patch) =>
                  setSelection((current) => ({
                    ...current,
                    [student.id]: { ...choice, ...patch },
                  }))
                }
                onAssign={() =>
                  assignment.mutate({ id: student.id, values: assignmentInputFor(mode, choice) })
                }
              />
            );
          })}
        </div>
      ) : null}
      {assignment.isError ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          {assignment.error instanceof Error ? assignment.error.message : copy.assignmentFailed}
        </p>
      ) : null}
    </section>
  );
}

function AssignmentSuccess({ assignment }: { assignment: StudentAssignment }) {
  const { language } = useLocale();
  const copy = onboardingCopy(language);
  return (
    <Card
      className="border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
      role="status"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0" />
        <div>
          <h2 className="font-bold">{copy.assignmentSuccess}</h2>
          <p className="mt-1 text-sm">
            {copy.organization}: {assignment.organization.name} · {copy.advisor}:{" "}
            {displayAdvisor(assignment.advisor)}
          </p>
          <p className="mt-1 text-xs opacity-70">{copy.automaticMembers}</p>
        </div>
      </div>
    </Card>
  );
}

function OnboardingQueueState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
}) {
  const { language } = useLocale();
  const copy = onboardingCopy(language);
  if (loading) {
    return (
      <Card className="p-6 text-center" role="status">
        {copy.loading}
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="border-rose-200 p-6 text-center text-rose-700" role="alert">
        <p>{copy.loadFailed}</p>
        <Button className="mt-4" variant="soft" onClick={onRetry}>
          <RefreshCw size={16} />
          {copy.retry}
        </Button>
      </Card>
    );
  }
  if (empty) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" />
        <h2 className="mt-3 font-semibold">{copy.emptyTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{copy.emptyDescription}</p>
      </Card>
    );
  }
  return null;
}
