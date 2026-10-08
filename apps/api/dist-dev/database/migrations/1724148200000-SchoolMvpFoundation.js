"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolMvpFoundation1724148200000 = void 0;
const permissionsByRole = {
    STUDENT: [
        "registration.read",
        "registration.self.read",
        "registration.self.update",
        "students.read.self",
        "students.update.self",
        "attendance.self.read",
    ],
    GUARDIAN: ["students.read.linked", "attendance.linked.read"],
    PRINCIPAL: [
        "students.read",
        "students.read.all",
        "students.create",
        "students.update",
        "students.archive",
        "students.import",
        "students.export",
        "registration.read",
        "registration.manage",
        "registration.review",
        "classes.read",
        "classes.manage",
        "classes.roster.manage",
        "class_groups.read",
        "class_groups.manage",
        "attendance.read",
        "attendance.manage",
        "attendance.class.read",
        "attendance.class.manage",
        "attendance.group.read",
        "attendance.group.manage",
        "attendance.dorm.read",
        "attendance.dorm.manage",
        "dormitory.read",
        "dormitory.manage",
        "relationships.read",
        "relationships.manage",
    ],
    DISCIPLINARIAN: [
        "students.read",
        "students.read.all",
        "students.update",
        "students.export",
        "registration.read",
        "registration.review",
        "classes.read",
        "class_groups.read",
        "attendance.read",
        "attendance.manage",
        "attendance.class.read",
        "attendance.class.manage",
        "attendance.group.read",
        "attendance.group.manage",
        "attendance.dorm.read",
        "attendance.dorm.manage",
        "dormitory.read",
        "dormitory.manage",
    ],
    COUNSELOR: [
        "students.read",
        "students.read.assigned",
        "student.profile.read",
        "relationships.read",
        "relationships.manage",
        "attendance.read",
    ],
    RELIGIOUS_EDUCATION_MANAGER: [
        "students.read",
        "classes.read",
        "classes.manage",
        "classes.roster.manage",
        "class_groups.read",
        "class_groups.manage",
        "attendance.read",
        "attendance.manage",
        "attendance.class.read",
        "attendance.class.manage",
        "attendance.group.read",
        "attendance.group.manage",
    ],
    GOVERNMENT_EDUCATION_MANAGER: [
        "students.read",
        "classes.read",
        "classes.manage",
        "classes.roster.manage",
        "class_groups.read",
        "class_groups.manage",
        "attendance.read",
        "attendance.manage",
        "attendance.class.read",
        "attendance.class.manage",
        "attendance.group.read",
        "attendance.group.manage",
    ],
    STUDENT_AFFAIRS_MENTOR: [
        "students.read",
        "students.read.assigned",
        "student.profile.read",
        "relationships.read",
        "attendance.read",
        "attendance.dorm.read",
    ],
    TEACHER: [
        "students.read",
        "students.read.assigned",
        "classes.read",
        "class_groups.read",
        "attendance.read",
        "attendance.class.read",
        "attendance.class.manage",
        "attendance.group.read",
        "attendance.group.manage",
    ],
    ORGANIZATION_ADMIN: [
        "students.read.all",
        "students.import",
        "students.export",
        "registration.read",
        "registration.manage",
        "registration.review",
        "class_groups.read",
        "class_groups.manage",
        "dormitory.read",
        "dormitory.manage",
    ],
};
class SchoolMvpFoundation1724148200000 {
    name = "SchoolMvpFoundation1724148200000";
    async up(q) {
        await q.query(`
  CREATE TABLE IF NOT EXISTS study_groups (
    id varchar PRIMARY KEY NOT NULL,
    organizationId varchar NOT NULL,
    classroomId varchar,
    code varchar(80) NOT NULL,
    name varchar(160) NOT NULL,
    description text NOT NULL DEFAULT '',
    status varchar(24) NOT NULL DEFAULT 'ACTIVE',
    createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_study_group_org
      FOREIGN KEY(organizationId)
      REFERENCES organizations(id)
      ON DELETE CASCADE,

    CONSTRAINT FK_study_group_class
      FOREIGN KEY(classroomId)
      REFERENCES education_classes(id)
      ON DELETE CASCADE
  )
`);
        await q.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS IDX_study_groups_org_code
  ON study_groups(organizationId, code)
`);
        await q.query(`
  CREATE TABLE IF NOT EXISTS study_group_memberships (
    id varchar PRIMARY KEY NOT NULL,
    groupId varchar NOT NULL,
    studentId varchar NOT NULL,
    createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(groupId)
      REFERENCES study_groups(id)
      ON DELETE CASCADE,

    FOREIGN KEY(studentId)
      REFERENCES students(id)
      ON DELETE CASCADE
  )
`);
        await q.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS IDX_study_group_membership
  ON study_group_memberships(groupId, studentId)
`);
        await q.query(`
  CREATE TABLE IF NOT EXISTS dorm_rooms (
    id varchar PRIMARY KEY NOT NULL,
    organizationId varchar NOT NULL,
    code varchar(80) NOT NULL,
    name varchar(160) NOT NULL,
    capacity integer NOT NULL DEFAULT 1,
    status varchar(24) NOT NULL DEFAULT 'ACTIVE',
    createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_dorm_rooms_organization
      FOREIGN KEY(organizationId)
      REFERENCES organizations(id)
      ON DELETE CASCADE
  )
`);
        await q.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS IDX_dorm_rooms_org_code
  ON dorm_rooms(organizationId, code)
`);
        await q.query(`
  CREATE TABLE IF NOT EXISTS dorm_room_assignments (
    id varchar PRIMARY KEY NOT NULL,
    roomId varchar NOT NULL,
    studentId varchar NOT NULL,
    createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_dorm_assignment_room
      FOREIGN KEY(roomId)
      REFERENCES dorm_rooms(id)
      ON DELETE CASCADE,

    CONSTRAINT FK_dorm_assignment_student
      FOREIGN KEY(studentId)
      REFERENCES students(id)
      ON DELETE CASCADE
  )
`);
        await q.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS IDX_dorm_room_assignments_room_student
  ON dorm_room_assignments(roomId, studentId)
`);
        await q.query(`ALTER TABLE students ADD COLUMN registrationStatus varchar(32) NOT NULL DEFAULT 'ACCOUNT_CREATED'`);
        await q.query(`ALTER TABLE students ADD COLUMN organizationId varchar REFERENCES organizations(id) ON DELETE SET NULL`);
        await q.query(`UPDATE students SET organizationId=(SELECT om.organizationId FROM organization_memberships om WHERE om.userId=students.userId AND om.status='ACTIVE' LIMIT 1) WHERE organizationId IS NULL AND userId IS NOT NULL`);
        await q.query(`CREATE INDEX IF NOT EXISTS IDX_students_organization ON students(organizationId)`);
        await q.query(`CREATE INDEX IF NOT EXISTS IDX_study_groups_classroom ON study_groups(classroomId)`);
        await q.query(`CREATE TABLE student_profiles (id varchar PRIMARY KEY NOT NULL, studentId varchar NOT NULL UNIQUE, birthCertificateNumber varchar(50), birthDate datetime, birthPlace varchar(120), certificateIssuePlace varchar(120), gender varchar(24), previousSchool varchar(240), address text, postalCode varchar(10), homePhone varchar(24), emergencyPhone varchar(24), healthNotes text, insuranceProvider varchar(160), insuranceNumber varchar(160), transportNotes text, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_student_profile_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE)`);
        await q.query(`CREATE TABLE student_contacts (id varchar PRIMARY KEY NOT NULL, studentId varchar NOT NULL, type varchar(24) NOT NULL, fullName varchar(160) NOT NULL, nationalCode varchar(10), phoneNumber varchar(24), occupation varchar(160), linkedUserId varchar, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_student_contact_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_student_contact_user FOREIGN KEY(linkedUserId) REFERENCES users(id) ON DELETE SET NULL)`);
        await q.query(`CREATE UNIQUE INDEX IDX_student_contacts_type ON student_contacts(studentId, type)`);
        await q.query(`CREATE TABLE registration_requirements (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, sectionCode varchar(48) NOT NULL, enabled boolean NOT NULL DEFAULT 1, required boolean NOT NULL DEFAULT 0, sortOrder integer NOT NULL DEFAULT 0, announcement text NOT NULL DEFAULT '', opensAt datetime, closesAt datetime, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_registration_requirement_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE)`);
        await q.query(`CREATE UNIQUE INDEX IDX_registration_requirements_org_section ON registration_requirements(organizationId, sectionCode)`);
        await q.query(`CREATE TABLE registration_progress (id varchar PRIMARY KEY NOT NULL, studentId varchar NOT NULL, organizationId varchar NOT NULL, sectionCode varchar(48) NOT NULL, status varchar(24) NOT NULL DEFAULT 'NOT_STARTED', reviewNote text NOT NULL DEFAULT '', createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_registration_progress_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE, CONSTRAINT FK_registration_progress_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE)`);
        await q.query(`CREATE UNIQUE INDEX IDX_registration_progress_unique ON registration_progress(studentId, organizationId, sectionCode)`);
        for (const [role, capabilities] of Object.entries(permissionsByRole)) {
            for (const capability of capabilities) {
                await q.query(`INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, '')`, [capability]);
                await q.query(`INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId) SELECT lower(hex(randomblob(16))), r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code=? AND p.code=?`, [role, capability]);
            }
        }
    }
    async down(q) {
        await q.query(`DROP TABLE IF EXISTS registration_progress`);
        await q.query(`DROP TABLE IF EXISTS registration_requirements`);
        await q.query(`DROP TABLE IF EXISTS student_contacts`);
        await q.query(`DROP TABLE IF EXISTS student_profiles`);
        await q.query(`DROP TABLE IF EXISTS dorm_room_assignments`);
        await q.query(`DROP TABLE IF EXISTS dorm_rooms`);
    }
}
exports.SchoolMvpFoundation1724148200000 = SchoolMvpFoundation1724148200000;
//# sourceMappingURL=1724148200000-SchoolMvpFoundation.js.map