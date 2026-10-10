"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRoleCodesByType = exports.PRINCIPAL_ASSIGNABLE_ROLE_CODES = exports.PLATFORM_ROLE_CODES = void 0;
exports.roleCodesForOrganizationType = roleCodesForOrganizationType;
exports.assertRoleCodesCompatibleWithOrganization = assertRoleCodesCompatibleWithOrganization;
exports.assertPlatformRolesAreUnscoped = assertPlatformRolesAreUnscoped;
exports.assertRoleCodesAssignableByActor = assertRoleCodesAssignableByActor;
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_entity_1 = require("../../database/entities/organization.entity");
exports.PLATFORM_ROLE_CODES = ["PLATFORM_ADMIN"];
exports.PRINCIPAL_ASSIGNABLE_ROLE_CODES = [
    "STUDENT",
    "SCHOOL_SUPERVISOR",
    "TEACHER",
];
const sharedOrganizationRoles = [
    "ORGANIZATION_ADMIN",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "COUNSELOR",
    "ADVISOR",
    "MENTOR",
    "CONTENT_MANAGER",
];
const schoolOnlyRoles = [
    "PRINCIPAL",
    "SCHOOL_ADMIN",
    "SCHOOL_SUPERVISOR",
    "DISCIPLINARIAN",
    "RELIGIOUS_EDUCATION_MANAGER",
    "GOVERNMENT_EDUCATION_MANAGER",
    "STUDENT_AFFAIRS_MENTOR",
];
exports.organizationRoleCodesByType = {
    [organization_entity_1.OrganizationType.SCHOOL]: [...sharedOrganizationRoles, ...schoolOnlyRoles],
    [organization_entity_1.OrganizationType.INSTITUTION]: sharedOrganizationRoles,
    [organization_entity_1.OrganizationType.ORGANIZATION]: sharedOrganizationRoles,
};
function roleCodesForOrganizationType(type) {
    return exports.organizationRoleCodesByType[type] ?? [];
}
function assertRoleCodesCompatibleWithOrganization(type, roleCodes) {
    const allowed = new Set(roleCodesForOrganizationType(type));
    const incompatible = roleCodes.filter((roleCode) => !allowed.has(roleCode));
    if (incompatible.length) {
        throw new api_exception_1.ApiException(400, "ROLE_ORGANIZATION_TYPE_MISMATCH", `نقش ${incompatible.join("، ")} برای نوع سازمان انتخاب‌شده مجاز نیست.`);
    }
}
function assertPlatformRolesAreUnscoped(roleCodes, organizationId) {
    if (organizationId &&
        roleCodes.some((roleCode) => exports.PLATFORM_ROLE_CODES.includes(roleCode))) {
        throw new api_exception_1.ApiException(400, "PLATFORM_ROLE_MUST_BE_UNSCOPED", "نقش مدیر پلتفرم به سازمان متصل نمی‌شود.");
    }
}
function assertRoleCodesAssignableByActor(actor, roleCodes) {
    const actorRoles = actor.roles?.length ? actor.roles : [actor.role];
    const isPrincipal = actorRoles.includes("PRINCIPAL");
    const isPlatformAdmin = actorRoles.includes("PLATFORM_ADMIN");
    const allowed = new Set(exports.PRINCIPAL_ASSIGNABLE_ROLE_CODES);
    if (isPrincipal &&
        !isPlatformAdmin &&
        roleCodes.some((roleCode) => !allowed.has(roleCode))) {
        throw new api_exception_1.ApiException(403, "PRINCIPAL_ROLE_ASSIGNMENT_RESTRICTED", "مدیر فقط می‌تواند حساب دانش‌آموز، ناظم یا دبیر ایجاد و به‌روزرسانی کند.");
    }
}
//# sourceMappingURL=organization-role-policy.js.map