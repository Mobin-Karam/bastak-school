import { api } from "../../../shared/api/api";
import type { RoleCode } from "../../../shared/types/domain";

export type PortalUser = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  status: string;
  isPlatformOwner?: boolean;
  assignments: Array<{ role: RoleCode; organizationId: string | null }>;
};
export type PortalOrganization = {
  id: string;
  name: string;
  type: string;
  status: string;
  disabledFeatures?: string[];
  studentSignupManagedByOrganization?: boolean;
  studentSignupEnabled?: boolean;
  studentSignupLimit?: number;
  studentSignupCount?: number;
};
export const organizationFeatures = [
  ["PLANNER", "برنامه‌ریز"],
  ["LEARNING", "سیستم یادگیری"],
  ["EXAMS", "آزمون‌ها"],
  ["QUIZZES", "آزمونک‌ها"],
  ["QUESTION_BANK", "بانک سؤال"],
  ["SUBJECTS", "درس‌ها"],
  ["EDUCATION", "مرکز آموزش و کلاس‌ها"],
  ["RESOURCES", "منابع آموزشی"],
  ["CHAT", "گفتگو"],
  ["REPORTS", "گزارش‌ها"],
  ["STUDENTS", "مدیریت دانش‌آموزان"],
  ["FAMILY", "خانه خانواده"],
  ["ONBOARDING", "ورود دانش‌آموزان"],
  ["ANALYTICS", "تحلیل و پیشنهادها"],
  ["IMPORT_EXPORT", "ورود و خروج داده"],
] as const;
export type OrganizationFeatureCode = (typeof organizationFeatures)[number][0];
export type OrganizationMember = {
  id: string;
  user: Pick<PortalUser, "id" | "username" | "firstName" | "lastName" | "status">;
  status: string;
  roles: RoleCode[];
};
export type UserRelationship = {
  id: string;
  type: string;
  status: string;
  fromUser: Pick<PortalUser, "id" | "username" | "firstName" | "lastName">;
  student: { id: string; name: string };
  organizationId?: string;
  createdAt: string;
};
export type RelationshipStudent = { id: string; name: string; grade?: string; major?: string };

export const listUsers = (organizationId?: string) =>
  api.get<PortalUser[]>(
    `/users${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
export const createUser = (body: {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  roleCodes: RoleCode[];
}) => api.post<PortalUser>("/users", body);
export const setUserActive = (id: string, active: boolean) =>
  api.post(`/users/${id}/${active ? "activate" : "deactivate"}`, {});
export const updateUser = (
  id: string,
  body: { username?: string; firstName?: string; lastName?: string },
) => api.patch<PortalUser>(`/users/${id}`, body);
export const setUserRoles = (
  id: string,
  body: { roleCodes: RoleCode[]; organizationId?: string },
) => api.put(`/users/${id}/roles`, body);
export const archiveUser = (id: string) => api.delete(`/users/${id}`);
export const transferPlatformOwnership = (targetUserId: string) =>
  api.post<{ previousOwnerId: string; ownerId: string; username: string }>(
    "/users/platform-ownership/transfer",
    { targetUserId },
  );
export const listOrganizations = () => api.get<PortalOrganization[]>("/organizations");
export const createOrganization = (body: { name: string; type: string; studentSignupManagedByOrganization?: boolean; studentSignupEnabled?: boolean; studentSignupLimit?: number }) =>
  api.post<PortalOrganization>("/organizations", body);
export const updateOrganization = (
  id: string,
  body: { name?: string; type?: string; status?: string },
) => api.patch<PortalOrganization>(`/organizations/${id}`, body);
export const setOrganizationEnabled = (id: string, enabled: boolean) =>
  api.patch<PortalOrganization>(`/organizations/${id}/enabled`, { enabled });
export const setOrganizationFeatures = (id: string, enabledFeatures: OrganizationFeatureCode[]) =>
  api.patch<PortalOrganization>(`/organizations/${id}/features`, { enabledFeatures });
export const archiveOrganization = (id: string) => api.delete(`/organizations/${id}`);
export const getPlatformStudentSignupPolicy = () => api.get<{ enabled: boolean }>("/onboarding/student-signup-policy");
export const setPlatformStudentSignupPolicy = (enabled: boolean) => api.patch<{ enabled: boolean }>("/onboarding/student-signup-policy", { enabled });
export const setOrganizationStudentSignupPolicy = (id: string, body: { managedByOrganization?: boolean; enabled?: boolean; limit?: number }) => api.patch(`/onboarding/organizations/${id}/student-signup-policy`, body);
export const listOrganizationMembers = (id: string) =>
  api.get<OrganizationMember[]>(`/organizations/${id}/members`);
export const addOrganizationMember = (
  id: string,
  body: { userId: string; roleCodes: RoleCode[] },
) => api.post<OrganizationMember>(`/organizations/${id}/members`, body);
export const updateOrganizationMember = (
  id: string,
  userId: string,
  body: { status?: "ACTIVE" | "INACTIVE"; roleCodes?: RoleCode[] },
) => api.patch<OrganizationMember>(`/organizations/${id}/members/${userId}`, body);
export const removeOrganizationMember = (id: string, userId: string) =>
  api.delete(`/organizations/${id}/members/${userId}`);
export const listRelationships = () => api.get<UserRelationship[]>("/relationships");
export const listRelationshipStudents = () => api.get<RelationshipStudent[]>("/students");
export const createRelationship = (body: {
  fromUserId: string;
  toStudentId: string;
  organizationId?: string;
  type: "GUARDIAN_OF" | "ADVISOR_OF" | "TEACHER_OF" | "MENTOR_OF";
}) => api.post<UserRelationship>("/relationships", body);
export const removeRelationship = (id: string) => api.delete(`/relationships/${id}`);
export const allowGuardianChange = (studentId: string) =>
  api.post(`/students/${studentId}/guardian-change-override`, {});
export const acceptRelationship = (id: string) =>
  api.post<UserRelationship>(`/relationships/${id}/accept`, {});
export const rejectRelationship = (id: string) =>
  api.post<UserRelationship>(`/relationships/${id}/reject`, {});
