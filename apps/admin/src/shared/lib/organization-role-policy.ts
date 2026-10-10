import type { RoleCode } from "../types/domain";

export type AdminOrganizationType = "SCHOOL" | "INSTITUTION" | "ORGANIZATION";

export const organizationTypes: readonly AdminOrganizationType[] = [
  "SCHOOL",
  "INSTITUTION",
  "ORGANIZATION",
];

/** Roles a Principal can provision in the current school release. */
export const principalAssignableRoles: readonly RoleCode[] = [
  "STUDENT",
  "SCHOOL_SUPERVISOR",
  "TEACHER",
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
  "DISCIPLINARIAN",
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
