"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStudentAccount = ensureStudentAccount;
const api_exception_1 = require("../../common/exceptions/api.exception");
const student_entity_1 = require("../../database/entities/student.entity");
async function ensureStudentAccount(manager, user, organization) {
    const existing = await manager.findOne(student_entity_1.Student, {
        where: { user: { id: user.id } },
        relations: { organization: true },
    });
    if (existing) {
        if (existing.organization && existing.organization.id !== organization.id)
            throw new api_exception_1.ApiException(409, "STUDENT_ORGANIZATION_CONFLICT", "پرونده دانش‌آموز متعلق به سازمان دیگری است.");
        if (!existing.organization) {
            existing.organization = organization;
            await manager.save(student_entity_1.Student, existing);
        }
        return existing;
    }
    return manager.save(student_entity_1.Student, manager.create(student_entity_1.Student, {
        user,
        organization,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.phoneNumber ||
            user.username,
        accountStatus: "active",
        onboardingStatus: "ASSIGNED",
        registrationStatus: "ACCOUNT_CREATED",
    }));
}
//# sourceMappingURL=student-account.js.map