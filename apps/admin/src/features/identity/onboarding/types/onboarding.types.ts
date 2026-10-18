import type { PortalOrganization, PortalUser } from "../../access/api/access.api";

export type OnboardingMode = "AUTO" | "MANUAL";

export type ManualAssignmentChoice = {
  organizationId: string;
  advisorUserId: string;
};

export type PendingStudent = {
  id: string;
  name: string;
  username: string;
  grade: string;
  major: string;
  createdAt: string;
};

export type StudentAssignment = {
  studentId: string;
  organization: PortalOrganization;
  advisor: Pick<PortalUser, "id" | "username" | "firstName" | "lastName">;
  onboardingStatus: "ASSIGNED";
};

export type AssignmentInput =
  { mode: "AUTO" } | { mode: "MANUAL"; organizationId: string; advisorUserId: string };

export type AssignmentAdvisor = Pick<
  PortalUser,
  "id" | "username" | "firstName" | "lastName" | "assignments"
>;
