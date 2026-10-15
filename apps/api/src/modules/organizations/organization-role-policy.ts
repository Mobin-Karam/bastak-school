import { ApiException } from "../../common/exceptions/api.exception";
import { OrganizationType } from "../../database/entities/organization.entity";
import type { AuthenticatedUser } from "../auth";

export const PLATFORM_ROLE_CODES = ["PLATFORM_ADMIN"] as const;
export const PRINCIPAL_ASSIGNABLE_ROLE_CODES = [
  "STUDENT",
  "GUARDIAN",
  "SCHOOL_SUPERVISOR",
  "TEACHER",
  "DISCIPLINARIAN",
  "RELIGIOUS_EDUCATION_MANAGER",
  "GOVERNMENT_EDUCATION_MANAGER",
  "STUDENT_AFFAIRS_MENTOR",
  "COUNSELOR",
  "ADVISOR",
  "MENTOR",
  "CONTENT_MANAGER",
] as const;

const sharedOrganizationRoles = [
  "ORGANIZATION_ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "COUNSELOR",
  "ADVISOR",
  "MENTOR",
  "CONTENT_MANAGER",
] as const;

const schoolOnlyRoles = [
  "PRINCIPAL",
  "SCHOOL_ADMIN",
  "SCHOOL_SUPERVISOR",
  "DISCIPLINARIAN",
  "RELIGIOUS_EDUCATION_MANAGER",
  "GOVERNMENT_EDUCATION_MANAGER",
  "STUDENT_AFFAIRS_MENTOR",
] as const;

export const organizationRoleCodesByType: Record<
  OrganizationType,
  readonly string[]
> = {
  [OrganizationType.SCHOOL]: [...sharedOrganizationRoles, ...schoolOnlyRoles],
  [OrganizationType.INSTITUTION]: sharedOrganizationRoles,
  [OrganizationType.ORGANIZATION]: sharedOrganizationRoles,
};

export function roleCodesForOrganizationType(type: OrganizationType) {
  return organizationRoleCodesByType[type] ?? [];
}

export function assertRoleCodesCompatibleWithOrganization(
  type: OrganizationType,
  roleCodes: readonly string[],
) {
  const allowed = new Set(roleCodesForOrganizationType(type));
  const incompatible = roleCodes.filter((roleCode) => !allowed.has(roleCode));
  if (incompatible.length) {
    throw new ApiException(
      400,
      "ROLE_ORGANIZATION_TYPE_MISMATCH",
      `نقش ${incompatible.join("، ")} برای نوع سازمان انتخاب‌شده مجاز نیست.`,
    );
  }
}

export function assertPlatformRolesAreUnscoped(
  roleCodes: readonly string[],
  organizationId?: string,
) {
  if (
    organizationId &&
    roleCodes.some((roleCode) =>
      PLATFORM_ROLE_CODES.includes(roleCode as "PLATFORM_ADMIN"),
    )
  ) {
    throw new ApiException(
      400,
      "PLATFORM_ROLE_MUST_BE_UNSCOPED",
      "نقش مدیر پلتفرم به سازمان متصل نمی‌شود.",
    );
  }
}

/**
 * The current school rollout lets a Principal provision only the three
 * school account types they supervise. They still cannot create peer owners,
 * principals, school administrators, organization administrators or platform
 * administrators. Platform administrators retain broader authority.
 */
export function assertRoleCodesAssignableByActor(
  actor: Pick<AuthenticatedUser, "role" | "roles">,
  roleCodes: readonly string[],
) {
  const actorRoles = actor.roles?.length ? actor.roles : [actor.role];
  const isPrincipal = actorRoles.includes("PRINCIPAL");
  const isPlatformAdmin = actorRoles.includes("PLATFORM_ADMIN");
  const allowed = new Set<string>(PRINCIPAL_ASSIGNABLE_ROLE_CODES);

  if (
    isPrincipal &&
    !isPlatformAdmin &&
    roleCodes.some((roleCode) => !allowed.has(roleCode))
  ) {
    throw new ApiException(
      403,
      "PRINCIPAL_ROLE_ASSIGNMENT_RESTRICTED",
      "مدیر فقط می‌تواند نقش‌های عملیاتی همان مدرسه را ایجاد و به‌روزرسانی کند.",
    );
  }
}
