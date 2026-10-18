import type { PortalUser } from "../../access/api/access.api";
import type {
  AssignmentAdvisor,
  AssignmentInput,
  ManualAssignmentChoice,
  OnboardingMode,
} from "../types/onboarding.types";

export function displayAdvisor(user: Pick<PortalUser, "username" | "firstName" | "lastName">) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
}

export function eligibleAdvisorsForOrganization(
  advisors: AssignmentAdvisor[] | undefined,
  organizationId: string,
) {
  return (
    advisors?.filter((advisor) =>
      advisor.assignments.some(
        (assignment) =>
          assignment.role === "ADVISOR" && assignment.organizationId === organizationId,
      ),
    ) ?? []
  );
}

export function assignmentInputFor(
  mode: OnboardingMode,
  selection: ManualAssignmentChoice,
): AssignmentInput {
  return mode === "AUTO" ? { mode: "AUTO" } : { mode: "MANUAL", ...selection };
}

export function canSubmitManualAssignment(
  selection: ManualAssignmentChoice,
  directoryUnavailable: boolean,
) {
  return !directoryUnavailable && Boolean(selection.organizationId && selection.advisorUserId);
}
