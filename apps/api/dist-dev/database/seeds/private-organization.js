"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePrivateOrganizationSeedConfig = resolvePrivateOrganizationSeedConfig;
exports.seedPrivateOrganization = seedPrivateOrganization;
require("reflect-metadata");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const typeorm_1 = require("typeorm");
const data_source_1 = __importDefault(require("../data-source"));
const organization_membership_entity_1 = require("../entities/organization-membership.entity");
const organization_entity_1 = require("../entities/organization.entity");
const role_entity_1 = require("../entities/role.entity");
const student_entity_1 = require("../entities/student.entity");
const user_relationship_entity_1 = require("../entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../entities/user-role-assignment.entity");
const user_entity_1 = require("../entities/user.entity");
const education_catalog_service_1 = require("../../modules/education-catalog/education-catalog.service");
const national_code_1 = require("../../modules/onboarding/national-code");
const seed_phone_1 = require("./seed-phone");
const DEVELOPMENT_PASSWORD = "Moshaver-development-2026!";
const DEVELOPMENT_NATIONAL_CODE = "1000000001";
const PRIVATE_ORGANIZATION_ACCOUNTS = {
    platformAdmin: {
        username: "mobinkaram.platform",
        firstName: "مدیر",
        lastName: "سامانه",
        role: user_entity_1.UserRole.PLATFORM_ADMIN,
        passwordEnv: "PRIVATE_ORG_PLATFORM_ADMIN_PASSWORD",
    },
    organizationAdmin: {
        username: "mobinkaram.orgadmin",
        firstName: "مدیر",
        lastName: "سازمان",
        role: user_entity_1.UserRole.ORGANIZATION_ADMIN,
        passwordEnv: "PRIVATE_ORG_ORGANIZATION_ADMIN_PASSWORD",
    },
    advisor: {
        username: "mobinkaram",
        firstName: "مبین",
        lastName: "کرام",
        role: user_entity_1.UserRole.ADVISOR,
        passwordEnv: "MOBINKARAM_PASSWORD",
        relationship: user_relationship_entity_1.RelationshipType.ADVISOR_OF,
    },
    teacher: {
        username: "mobinkaram.teacher",
        firstName: "معلم",
        lastName: "مه‌کارام",
        role: user_entity_1.UserRole.TEACHER,
        passwordEnv: "PRIVATE_ORG_TEACHER_PASSWORD",
        relationship: user_relationship_entity_1.RelationshipType.TEACHER_OF,
    },
    mentor: {
        username: "mobinkaram.mentor",
        firstName: "مربی",
        lastName: "مه‌کارام",
        role: user_entity_1.UserRole.MENTOR,
        passwordEnv: "PRIVATE_ORG_MENTOR_PASSWORD",
        relationship: user_relationship_entity_1.RelationshipType.MENTOR_OF,
    },
    contentManager: {
        username: "mobinkaram.content",
        firstName: "مدیر محتوا",
        lastName: "مه‌کارام",
        role: user_entity_1.UserRole.CONTENT_MANAGER,
        passwordEnv: "PRIVATE_ORG_CONTENT_MANAGER_PASSWORD",
    },
    guardian: {
        username: "mahakaram.guardian",
        firstName: "ولی",
        lastName: "مه‌کارام",
        role: user_entity_1.UserRole.GUARDIAN,
        passwordEnv: "PRIVATE_ORG_GUARDIAN_PASSWORD",
        relationship: user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
    },
    student: {
        username: "mahakaram",
        firstName: "مها",
        lastName: "کرام",
        role: user_entity_1.UserRole.STUDENT,
        passwordEnv: "MAHAKARAM_PASSWORD",
    },
};
function resolvePrivateOrganizationSeedConfig(env = process.env) {
    const production = env.NODE_ENV === "production";
    if (production && env.ALLOW_PRODUCTION_BOOTSTRAP !== "true") {
        throw new Error("Refusing production bootstrap: set ALLOW_PRODUCTION_BOOTSTRAP=true for this one-time operation.");
    }
    const passwords = Object.fromEntries(Object.entries(PRIVATE_ORGANIZATION_ACCOUNTS).map(([key, account]) => [
        key,
        env[account.passwordEnv] || (production ? "" : DEVELOPMENT_PASSWORD),
    ]));
    if (Object.values(passwords).some((password) => password.length < 12)) {
        throw new Error("Bootstrap passwords must be provided and contain at least 12 characters.");
    }
    if (production &&
        new Set(Object.values(passwords)).size !== Object.keys(passwords).length) {
        throw new Error("Every production bootstrap account must use a different password.");
    }
    const studentNationalCode = (0, national_code_1.normalizeNationalCode)(env.MAHAKARAM_NATIONAL_CODE ||
        (production ? "" : DEVELOPMENT_NATIONAL_CODE));
    if (!(0, national_code_1.isValidIranianNationalCode)(studentNationalCode)) {
        throw new Error("MAHAKARAM_NATIONAL_CODE must be a valid Iranian national code.");
    }
    return {
        production,
        organizationName: env.PRIVATE_ORGANIZATION_NAME?.trim() || "سازمان خصوصی مه‌کارام",
        passwords,
        studentNationalCode,
    };
}
async function seedPrivateOrganization(config = resolvePrivateOrganizationSeedConfig()) {
    await data_source_1.default.initialize();
    await data_source_1.default.runMigrations();
    try {
        const summary = await data_source_1.default.transaction((manager) => seed(manager, config));
        console.log(JSON.stringify(summary, null, 2));
        return summary;
    }
    finally {
        await data_source_1.default.destroy();
    }
}
async function seed(manager, config) {
    const organizations = manager.getRepository(organization_entity_1.Organization);
    let organization = await organizations.findOne({
        where: { name: config.organizationName },
    });
    if (!organization)
        organization = organizations.create({ name: config.organizationName });
    organization.type = organization_entity_1.OrganizationType.PRIVATE_PRACTICE;
    organization.status = organization_entity_1.OrganizationStatus.ACTIVE;
    organization = await organizations.save(organization);
    const seededAccounts = await Promise.all(Object.entries(PRIVATE_ORGANIZATION_ACCOUNTS).map(async ([key, account]) => {
        const accountKey = key;
        const user = await upsertUser(manager, account.username, account.firstName, account.lastName, account.role, config.passwords[accountKey]);
        const membership = await ensureMembership(manager, user, organization);
        await ensureRole(manager, user, account.role, account.role === user_entity_1.UserRole.PLATFORM_ADMIN ? null : membership);
        return { key: accountKey, account, user };
    }));
    const studentUser = seededAccounts.find(({ key }) => key === "student").user;
    const students = manager.getRepository(student_entity_1.Student);
    let student = await students.findOne({
        where: { user: { id: studentUser.id } },
        relations: { user: true },
    });
    if (!student)
        student = students.create({ user: studentUser, name: "مها کرام" });
    Object.assign(student, {
        user: studentUser,
        name: "مها کرام",
        nationalCode: config.studentNationalCode,
        gradeId: 12,
        grade: "پایه دوازدهم",
        educationTypeId: "theoretical",
        trackId: "experimental_sciences",
        major: "علوم تجربی",
        accountStatus: "active",
        onboardingStatus: "ASSIGNED",
    });
    student = await students.save(student);
    for (const { account, user } of seededAccounts) {
        if ("relationship" in account) {
            await ensureRelationship(manager, user, student, organization, account.relationship);
        }
    }
    const textbooks = await (0, education_catalog_service_1.seedEducationCatalog)(manager);
    return {
        mode: config.production ? "production" : "development",
        organization: {
            id: organization.id,
            name: organization.name,
            type: organization.type,
        },
        users: seededAccounts.map(({ user, account }) => ({
            username: user.username,
            role: account.role,
        })),
        student: {
            id: student.id,
            gradeId: student.gradeId,
            trackId: student.trackId,
        },
        textbooks,
    };
}
async function upsertUser(manager, username, firstName, lastName, role, password) {
    const users = manager.getRepository(user_entity_1.User);
    let user = await users.findOne({ where: { username } });
    if (!user)
        user = users.create({ username });
    Object.assign(user, {
        username,
        phoneNumber: (0, seed_phone_1.seedPhoneNumber)(username),
        firstName,
        lastName,
        role,
        status: user_entity_1.UserStatus.ACTIVE,
        passwordHash: await bcryptjs_1.default.hash(password, 12),
        locale: "fa-IR",
        timezone: "Asia/Tehran",
    });
    return users.save(user);
}
async function ensureMembership(manager, user, organization) {
    const memberships = manager.getRepository(organization_membership_entity_1.OrganizationMembership);
    let membership = await memberships.findOne({
        where: { user: { id: user.id }, organization: { id: organization.id } },
    });
    if (!membership)
        membership = memberships.create({ user, organization });
    membership.status = organization_membership_entity_1.MembershipStatus.ACTIVE;
    return memberships.save(membership);
}
async function ensureRole(manager, user, code, membership) {
    const role = await manager.getRepository(role_entity_1.Role).findOneByOrFail({ code });
    const assignments = manager.getRepository(user_role_assignment_entity_1.UserRoleAssignment);
    const existing = await assignments.findOne({
        where: {
            user: { id: user.id },
            role: { id: role.id },
            membership: membership ? { id: membership.id } : (0, typeorm_1.IsNull)(),
        },
    });
    if (!existing)
        await assignments.save(assignments.create({ user, role, membership }));
}
async function ensureRelationship(manager, fromUser, student, organization, type) {
    const relationships = manager.getRepository(user_relationship_entity_1.UserRelationship);
    let relationship = await relationships.findOne({
        where: {
            fromUser: { id: fromUser.id },
            toStudent: { id: student.id },
            organization: { id: organization.id },
            type,
        },
    });
    if (!relationship) {
        relationship = relationships.create({
            fromUser,
            toStudent: student,
            organization,
            type,
        });
    }
    relationship.status = user_relationship_entity_1.RelationshipStatus.ACTIVE;
    relationship.acceptedAt ??= new Date();
    relationship.revokedAt = null;
    await relationships.save(relationship);
}
if (require.main === module) {
    seedPrivateOrganization().catch(async (error) => {
        console.error(error);
        if (data_source_1.default.isInitialized)
            await data_source_1.default.destroy();
        process.exitCode = 1;
    });
}
//# sourceMappingURL=private-organization.js.map