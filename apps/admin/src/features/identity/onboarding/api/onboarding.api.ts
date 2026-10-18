import { api } from "../../../shared/api/api";
import type { PortalOrganization, PortalUser } from "../../access/api/access.api";
import type { AssignmentInput, PendingStudent, StudentAssignment } from "../types/onboarding.types";

export type { AssignmentInput, PendingStudent, StudentAssignment } from "../types/onboarding.types";
export const listPendingStudents = () => api.get<PendingStudent[]>("/onboarding/students/pending");
export const listOnboardingOrganizations = () => api.get<PortalOrganization[]>("/organizations");
export const listAdvisors = () => api.get<PortalUser[]>("/users?role=ADVISOR&status=ACTIVE");
export const assignStudent = (id: string, body: AssignmentInput) =>
  api.post<StudentAssignment>(`/onboarding/students/${encodeURIComponent(id)}/assign`, body);
