import { Building2, UsersRound, WandSparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { PortalOrganization } from "../../access/api/access.api";
import { Button, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { onboardingCopy } from "../onboarding-locale";
import {
  assignmentInputFor,
  canSubmitManualAssignment,
  displayAdvisor,
  eligibleAdvisorsForOrganization,
} from "../model/onboarding.model";
import type {
  AssignmentAdvisor,
  ManualAssignmentChoice,
  OnboardingMode,
  PendingStudent,
} from "../types/onboarding.types";

export function OnboardingQueueItem({
  student,
  mode,
  choice,
  organizations,
  advisors,
  directoryUnavailable,
  pending,
  onChoiceChange,
  onAssign,
}: {
  student: PendingStudent;
  mode: OnboardingMode;
  choice: ManualAssignmentChoice;
  organizations: PortalOrganization[] | undefined;
  advisors: AssignmentAdvisor[] | undefined;
  directoryUnavailable: boolean;
  pending: boolean;
  onChoiceChange: (patch: Partial<ManualAssignmentChoice>) => void;
  onAssign: () => void;
}) {
  const { language } = useLocale();
  const copy = onboardingCopy(language);
  const eligibleAdvisors = eligibleAdvisorsForOrganization(advisors, choice.organizationId);
  const manualReady = canSubmitManualAssignment(choice, directoryUnavailable);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,1.5fr)] lg:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand/10 font-bold text-brand">
            {student.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-bold">{student.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{student.username}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1">
                {student.grade || copy.unknownGrade}
              </span>
              <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1">
                {student.major || copy.unknownMajor}
              </span>
            </div>
          </div>
        </div>
        <div>
          {mode === "AUTO" ? (
            <div className="rounded-lg border border-brand/15 bg-brand/5 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <WandSparkles className="text-brand" size={18} />
                {copy.smartReady}
              </div>
              <p className="mt-1 text-xs leading-6 text-slate-500">{copy.smartDescription}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <OnboardingField icon={<Building2 />} label={copy.organization}>
                <select
                  value={choice.organizationId}
                  onChange={(event) =>
                    onChoiceChange({ organizationId: event.target.value, advisorUserId: "" })
                  }
                >
                  <option value="">{copy.selectOrganization}</option>
                  {organizations?.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </OnboardingField>
              <OnboardingField icon={<UsersRound />} label={copy.advisor}>
                <select
                  value={choice.advisorUserId}
                  onChange={(event) => onChoiceChange({ advisorUserId: event.target.value })}
                  disabled={!choice.organizationId}
                >
                  <option value="">
                    {choice.organizationId && !eligibleAdvisors.length
                      ? copy.noAdvisor
                      : copy.selectAdvisor}
                  </option>
                  {eligibleAdvisors.map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {displayAdvisor(advisor)}
                    </option>
                  ))}
                </select>
              </OnboardingField>
            </div>
          )}
          {mode === "MANUAL" && directoryUnavailable ? (
            <p className="mt-2 text-xs text-rose-700" role="alert">
              {copy.directoryUnavailable}
            </p>
          ) : null}
          <Button
            className="mt-3 w-full"
            loading={pending}
            disabled={pending || (mode === "MANUAL" && !manualReady)}
            onClick={onAssign}
          >
            {mode === "AUTO" ? copy.autoAssign : copy.confirmAssign}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OnboardingField({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <span className="[&>svg]:size-4">{icon}</span>
        {label}
      </span>
      <span className="[&>select]:h-10 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-[rgb(var(--border-subtle))] [&>select]:bg-[rgb(var(--surface-card))] [&>select]:px-3">
        {children}
      </span>
    </label>
  );
}
