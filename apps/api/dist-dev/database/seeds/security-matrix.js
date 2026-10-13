"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSecurityMatrix = seedSecurityMatrix;
require("reflect-metadata");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = __importDefault(require("../data-source"));
const organization_entity_1 = require("../entities/organization.entity");
const organization_membership_entity_1 = require("../entities/organization-membership.entity");
const role_entity_1 = require("../entities/role.entity");
const student_entity_1 = require("../entities/student.entity");
const user_relationship_entity_1 = require("../entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../entities/user-role-assignment.entity");
const user_entity_1 = require("../entities/user.entity");
const subject_entity_1 = require("../entities/subject.entity");
const teacher_subject_assignment_entity_1 = require("../entities/teacher-subject-assignment.entity");
const dorm_room_entity_1 = require("../entities/dorm-room.entity");
const dorm_room_assignment_entity_1 = require("../entities/dorm-room-assignment.entity");
const seed_phone_1 = require("./seed-phone");
const password = process.env.E2E_PASSWORD || "Moshaver-e2e-2026!";
async function seedSecurityMatrix() {
    if (process.env.ALLOW_E2E_SEED !== "true" ||
        process.env.NODE_ENV === "production") {
        throw new Error("Refusing to create test identities. Use ALLOW_E2E_SEED=true against a disposable non-production database.");
    }
    await data_source_1.default.initialize();
    await data_source_1.default.runMigrations();
    const manager = data_source_1.default.manager;
    const hash = await bcryptjs_1.default.hash(password, 12);
    const orgA = await ensureOrganization("E2E Organization A");
    const orgB = await ensureOrganization("E2E Organization B");
    const studentAUser = await ensureUser("e2e.student.a", user_entity_1.UserRole.STUDENT, hash);
    const studentBUser = await ensureUser("e2e.student.b", user_entity_1.UserRole.STUDENT, hash);
    const studentA = await ensureStudent(studentAUser, "Student A", orgA);
    const studentB = await ensureStudent(studentBUser, "Student B", orgB);
    await ensureMembershipAndRole(studentAUser, orgA, "STUDENT", true);
    await ensureMembershipAndRole(studentBUser, orgB, "STUDENT", true);
    const identities = [
        [
            "e2e.guardian.a",
            user_entity_1.UserRole.GUARDIAN,
            orgA,
            "GUARDIAN",
            studentA,
            user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
        ],
        [
            "e2e.guardian.b",
            user_entity_1.UserRole.GUARDIAN,
            orgB,
            "GUARDIAN",
            studentB,
            user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
        ],
        [
            "e2e.advisor.a",
            user_entity_1.UserRole.ADVISOR,
            orgA,
            "ADVISOR",
            studentA,
            user_relationship_entity_1.RelationshipType.ADVISOR_OF,
        ],
        [
            "e2e.advisor.b",
            user_entity_1.UserRole.ADVISOR,
            orgB,
            "ADVISOR",
            studentB,
            user_relationship_entity_1.RelationshipType.ADVISOR_OF,
        ],
        [
            "e2e.teacher.a",
            user_entity_1.UserRole.TEACHER,
            orgA,
            "TEACHER",
            studentA,
            user_relationship_entity_1.RelationshipType.TEACHER_OF,
        ],
        [
            "e2e.teacher.b",
            user_entity_1.UserRole.TEACHER,
            orgB,
            "TEACHER",
            studentB,
            user_relationship_entity_1.RelationshipType.TEACHER_OF,
        ],
        [
            "e2e.mentor.a",
            user_entity_1.UserRole.MENTOR,
            orgA,
            "MENTOR",
            studentA,
            user_relationship_entity_1.RelationshipType.MENTOR_OF,
        ],
        [
            "e2e.content.a",
            user_entity_1.UserRole.CONTENT_MANAGER,
            orgA,
            "CONTENT_MANAGER",
            null,
            null,
        ],
        [
            "e2e.orgadmin.a",
            user_entity_1.UserRole.ORGANIZATION_ADMIN,
            orgA,
            "ORGANIZATION_ADMIN",
            null,
            null,
        ],
        [
            "e2e.orgadmin.b",
            user_entity_1.UserRole.ORGANIZATION_ADMIN,
            orgB,
            "ORGANIZATION_ADMIN",
            null,
            null,
        ],
    ];
    for (const [username, discriminator, organization, role, student, relationship,] of identities) {
        const user = await ensureUser(username, discriminator, hash);
        await ensureMembershipAndRole(user, organization, role, true);
        if (student && relationship)
            await ensureRelationship(user, student, organization, relationship);
    }
    const subjectA = await ensureSubject(orgA, "e2e-subject-a", "Subject A");
    const subjectB = await ensureSubject(orgB, "e2e-subject-b", "Subject B");
    await ensureTeacherSubject(await manager
        .getRepository(user_entity_1.User)
        .findOneByOrFail({ username: "e2e.teacher.a" }), subjectA, orgA);
    await ensureTeacherSubject(await manager
        .getRepository(user_entity_1.User)
        .findOneByOrFail({ username: "e2e.teacher.b" }), subjectB, orgB);
    const platform = await ensureUser("e2e.platform", user_entity_1.UserRole.PLATFORM_ADMIN, hash);
    platform.isPlatformOwner = true;
    await manager.getRepository(user_entity_1.User).save(platform);
    await ensureRole(platform, "PLATFORM_ADMIN", null);
    const multi = await ensureUser("e2e.multi", user_entity_1.UserRole.ADVISOR, hash);
    await ensureMembershipAndRole(multi, orgA, "ADVISOR", true);
    await ensureMembershipAndRole(multi, orgA, "TEACHER", true);
    await ensureRelationship(multi, studentA, orgA, user_relationship_entity_1.RelationshipType.ADVISOR_OF);
    const principal = await ensureUser("e2e.principal.a", user_entity_1.UserRole.ORGANIZATION_ADMIN, hash);
    await ensureMembershipAndRole(principal, orgA, "PRINCIPAL", true);
    for (const [code, organization, student] of [
        ["E2E-A", orgA, studentA], ["E2E-A2", orgA, null], ["E2E-B", orgB, studentB],
    ]) {
        const rooms = manager.getRepository(dorm_room_entity_1.DormRoom);
        const room = (await rooms.findOne({ where: { code, organization: { id: organization.id } } })) ?? await rooms.save(rooms.create({ code, name: code, organization, status: "ACTIVE", capacity: 2 }));
        if (student) {
            const assignments = manager.getRepository(dorm_room_assignment_entity_1.DormRoomAssignment);
            if (!(await assignments.findOne({ where: { room: { id: room.id }, student: { id: student.id } } })))
                await assignments.save(assignments.create({ room, student }));
        }
    }
    console.log(JSON.stringify({
        database: process.env.DATABASE_PATH,
        users: [
            "e2e.student.a",
            "e2e.student.b",
            ...identities.map(([name]) => name),
            "e2e.platform",
            "e2e.multi",
        ],
    }, null, 2));
    await data_source_1.default.destroy();
    async function ensureOrganization(name) {
        const repo = manager.getRepository(organization_entity_1.Organization);
        return ((await repo.findOne({ where: { name } })) ??
            repo.save(repo.create({
                name,
                type: organization_entity_1.OrganizationType.SCHOOL,
                status: organization_entity_1.OrganizationStatus.ACTIVE,
            })));
    }
    async function ensureUser(username, role, passwordHash) {
        const repo = manager.getRepository(user_entity_1.User);
        const found = await repo.findOne({ where: { username } });
        if (found) {
            found.passwordHash = passwordHash;
            found.phoneNumber = (0, seed_phone_1.seedPhoneNumber)(username);
            found.status = user_entity_1.UserStatus.ACTIVE;
            return repo.save(found);
        }
        return repo.save(repo.create({
            username,
            phoneNumber: (0, seed_phone_1.seedPhoneNumber)(username),
            passwordHash,
            role,
            status: user_entity_1.UserStatus.ACTIVE,
            firstName: username,
            lastName: "",
        }));
    }
    async function ensureStudent(user, name, organization) {
        const repo = manager.getRepository(student_entity_1.Student);
        const existing = await repo.findOne({ where: { user: { id: user.id } } });
        if (existing) {
            existing.organization = organization;
            return repo.save(existing);
        }
        return (repo.save(repo.create({
            user,
            name,
            organization,
            grade: "",
            major: "",
            targetUniversity: "",
            targetField: "",
            targetRank: "",
            dailyCapacity: "",
            accountStatus: "active",
        })));
    }
    async function ensureMembershipAndRole(user, organization, role, scoped) {
        const repo = manager.getRepository(organization_membership_entity_1.OrganizationMembership);
        let membership = await repo.findOne({
            where: { user: { id: user.id }, organization: { id: organization.id } },
            relations: { user: true, organization: true },
        });
        if (!membership)
            membership = await repo.save(repo.create({ user, organization, status: organization_membership_entity_1.MembershipStatus.ACTIVE }));
        await ensureRole(user, role, scoped ? membership : null);
    }
    async function ensureRole(user, code, membership) {
        const role = await manager.getRepository(role_entity_1.Role).findOneByOrFail({ code });
        const repo = manager.getRepository(user_role_assignment_entity_1.UserRoleAssignment);
        const found = await repo.findOne({
            where: {
                user: { id: user.id },
                role: { id: role.id },
                ...(membership ? { membership: { id: membership.id } } : {}),
            },
        });
        if (!found)
            await repo.save(repo.create({ user, role, membership }));
    }
    async function ensureRelationship(fromUser, toStudent, organization, type) {
        const repo = manager.getRepository(user_relationship_entity_1.UserRelationship);
        const found = await repo.findOne({
            where: {
                fromUser: { id: fromUser.id },
                toStudent: { id: toStudent.id },
                organization: { id: organization.id },
                type,
            },
        });
        if (!found)
            await repo.save(repo.create({
                fromUser,
                toStudent,
                organization,
                type,
                status: user_relationship_entity_1.RelationshipStatus.ACTIVE,
                acceptedAt: new Date(),
            }));
    }
    async function ensureSubject(organization, code, name) {
        const repo = manager.getRepository(subject_entity_1.Subject);
        return ((await repo.findOne({
            where: { organization: { id: organization.id }, code },
        })) ?? repo.save(repo.create({ organization, code, name, active: true })));
    }
    async function ensureTeacherSubject(teacher, subject, organization) {
        const repo = manager.getRepository(teacher_subject_assignment_entity_1.TeacherSubjectAssignment);
        const found = await repo.findOne({
            where: {
                teacher: { id: teacher.id },
                subject: { id: subject.id },
                organization: { id: organization.id },
            },
        });
        if (!found)
            await repo.save(repo.create({ teacher, subject, organization }));
    }
}
if (require.main === module) {
    seedSecurityMatrix().catch(async (error) => {
        console.error(error);
        if (data_source_1.default.isInitialized)
            await data_source_1.default.destroy();
        process.exitCode = 1;
    });
}
//# sourceMappingURL=security-matrix.js.map