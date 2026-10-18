import { api } from "../../../../shared/api/api";
import type { PortalOrganization, PortalUser } from "../../access/api/access.api.ts";
import type { AssignmentInput, PendingStudent, StudentAssignment } from "../types/onboarding.types.ts";

export type { AssignmentInput, PendingStudent, StudentAssignment } from "../types/onboarding.types.ts";
export const listPendingStudents = () => api.get<PendingStudent[]>("/onboarding/students/pending");
export const listOnboardingOrganizations = () => api.get<PortalOrganization[]>("/organizations");
export const listAdvisors = () => api.get<PortalUser[]>("/users?role=ADVISOR&status=ACTIVE");
export const assignStudent = (id: string, body: AssignmentInput) =>
  api.post<StudentAssignment>(`/onboarding/students/${encodeURIComponent(id)}/assign`, body);
