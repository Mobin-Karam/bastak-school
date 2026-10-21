import type { RoleCode } from "../types/domain";

export type AdminOrganizationType = "SCHOOL" | "INSTITUTION" | "ORGANIZATION";

export const organizationTypes: readonly AdminOrganizationType[] = [
  "SCHOOL",
  "INSTITUTION",
  "ORGANIZATION",
];

/**
 * School roles a Principal can provision.
 *
 * This mirrors the server-side assignment policy. DISCIPLINARIAN is not
 * offered because SCHOOL_SUPERVISOR is the single supervisor role presented
 * to schools. Platform administration remains global-only.
 */
export const principalAssignableRoles: readonly RoleCode[] = [
  "STUDENT",
  "GUARDIAN",
  "ORGANIZATION_ADMIN",
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "SCHOOL_SUPERVISOR",
  "TEACHER",
  "RELIGIOUS_EDUCATION_MANAGER",
  "GOVERNMENT_EDUCATION_MANAGER",
  "STUDENT_AFFAIRS_MENTOR",
  "COUNSELOR",
  "ADVISOR",
  "MENTOR",
  "CONTENT_MANAGER",
];

const sharedRoles: readonly RoleCode[] = [
  "ORGANIZATION_ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "COUNSELOR",
  "ADVISOR",
  "MENTOR",
  "CONTENT_MANAGER",
];

const schoolOnlyRoles: readonly RoleCode[] = [
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "SCHOOL_SUPERVISOR",
  "RELIGIOUS_EDUCATION_MANAGER",
  "GOVERNMENT_EDUCATION_MANAGER",
  "STUDENT_AFFAIRS_MENTOR",
];

export function rolesForOrganizationType(type?: string | null): RoleCode[] {
  if (type === "SCHOOL") return [...sharedRoles, ...schoolOnlyRoles];
  if (type === "INSTITUTION" || type === "ORGANIZATION") return [...sharedRoles];
  return [];
}

export function isOrganizationType(value: string): value is AdminOrganizationType {
  return organizationTypes.includes(value as AdminOrganizationType);
}
