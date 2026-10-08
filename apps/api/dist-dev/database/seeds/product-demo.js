"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProductDemo = seedProductDemo;
require("reflect-metadata");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = __importDefault(require("../data-source"));
const entities_1 = require("../entities");
const attendance_record_entity_1 = require("../entities/attendance-record.entity");
const organization_entity_1 = require("../entities/organization.entity");
const organization_membership_entity_1 = require("../entities/organization-membership.entity");
const registration_requirement_entity_1 = require("../entities/registration-requirement.entity");
const user_relationship_entity_1 = require("../entities/user-relationship.entity");
const user_entity_1 = require("../entities/user.entity");
const demo_guard_1 = require("./demo-guard");
const seed_phone_1 = require("./seed-phone");
const password = process.env.DEMO_PASSWORD || "Bastak-demo-2026!";
const SCHOOL_YEAR = "1405-1406";
const STAFF = {
    platform: { identity: "school.platform", first: "مدیر", last: "سامانه" },
    principal: { identity: "school.principal", first: "محمد", last: "کریمی" },
    disciplinarian: {
        identity: "school.disciplinarian",
        first: "احمد",
        last: "حیدری",
    },
    counselor: { identity: "school.counselor", first: "سارا", last: "مرادی" },
    religiousManager: {
        identity: "school.religious-manager",
        first: "حسین",
        last: "موسوی",
    },
    governmentManager: {
        identity: "school.government-manager",
        first: "زهرا",
        last: "احمدی",
    },
    mentor: { identity: "school.student-affairs", first: "علی", last: "صادقی" },
    diniTeacher: { identity: "school.teacher.dini", first: "رضا", last: "محمدی" },
    governmentTeacher: {
        identity: "school.teacher.government",
        first: "مریم",
        last: "اکبری",
    },
    secondTeacher: {
        identity: "school.teacher.second",
        first: "مجتبی",
        last: "نوروزی",
    },
};
const DEMO_STUDENTS = [
    ["امیرحسین", "رضایی"],
    ["محمدمهدی", "کریمی"],
    ["علی", "محمدی"],
    ["حسین", "احمدی"],
    ["مهدی", "صادقی"],
    ["رضا", "موسوی"],
    ["یاسین", "حیدری"],
    ["ابوالفضل", "مرادی"],
    ["محمد", "نوری"],
    ["طاها", "کاظمی"],
    ["سجاد", "اکبری"],
    ["مصطفی", "رحیمی"],
    ["پارسا", "جعفری"],
    ["عرفان", "قاسمی"],
    ["امین", "حسینی"],
    ["علیرضا", "رستمی"],
    ["محمدرضا", "امینی"],
    ["یوسف", "باقری"],
];
const IMPORTED_STUDENTS = [
    ["محمدامین", "فرهادی"],
    ["سینا", "نادری"],
    ["میلاد", "یوسفی"],
    ["آریا", "رحمانی"],
];
async function seedProductDemo() {
    const database = process.env.ALLOW_PLATFORM_SEED === "true"
        ? (0, demo_guard_1.requireSafePlatformDatabase)("seed")
        : (0, demo_guard_1.requireSafeDemoDatabase)("seed");
    await data_source_1.default.initialize();
    await data_source_1.default.runMigrations();
    try {
        const summary = await data_source_1.default.transaction(async (manager) => seed(manager));
        console.log(JSON.stringify({ database, password, ...summary }, null, 2));
    }
    finally {
        await data_source_1.default.destroy();
    }
}
async function seed(manager) {
    const hash = await bcryptjs_1.default.hash(password, 12);
    const school = await ensureSchool(manager);
    const platform = await ensureUser(manager, {
        ...STAFF.platform,
        legacyRole: user_entity_1.UserRole.PLATFORM_ADMIN,
        hash,
        platformOwner: true,
    });
    await ensureRoleAssignment(manager, platform, "PLATFORM_ADMIN", null);
    const principal = await ensureScopedStaff(manager, school, STAFF.principal, user_entity_1.UserRole.ORGANIZATION_ADMIN, "PRINCIPAL", hash);
    const disciplinarian = await ensureScopedStaff(manager, school, STAFF.disciplinarian, user_entity_1.UserRole.MENTOR, "DISCIPLINARIAN", hash);
    const counselor = await ensureScopedStaff(manager, school, STAFF.counselor, user_entity_1.UserRole.ADVISOR, "COUNSELOR", hash);
    const religiousManager = await ensureScopedStaff(manager, school, STAFF.religiousManager, user_entity_1.UserRole.CONTENT_MANAGER, "RELIGIOUS_EDUCATION_MANAGER", hash);
    const governmentManager = await ensureScopedStaff(manager, school, STAFF.governmentManager, user_entity_1.UserRole.CONTENT_MANAGER, "GOVERNMENT_EDUCATION_MANAGER", hash);
    const mentor = await ensureScopedStaff(manager, school, STAFF.mentor, user_entity_1.UserRole.MENTOR, "STUDENT_AFFAIRS_MENTOR", hash);
    const diniTeacher = await ensureScopedStaff(manager, school, STAFF.diniTeacher, user_entity_1.UserRole.TEACHER, "TEACHER", hash);
    const governmentTeacher = await ensureScopedStaff(manager, school, STAFF.governmentTeacher, user_entity_1.UserRole.TEACHER, "TEACHER", hash);
    const secondTeacher = await ensureScopedStaff(manager, school, STAFF.secondTeacher, user_entity_1.UserRole.TEACHER, "TEACHER", hash);
    const students = [];
    for (let index = 0; index < DEMO_STUDENTS.length; index += 1) {
        const [first, last] = DEMO_STUDENTS[index];
        const student = await ensureStudentWithAccount(manager, school, {
            identity: `school.student.${index + 1}`,
            first,
            last,
            hash,
            nationalCode: `990000${String(index + 1).padStart(4, "0")}`,
            registrationStatus: registrationStatusFor(index),
        });
        students.push(student);
    }
    const importedStudents = [];
    for (let index = 0; index < IMPORTED_STUDENTS.length; index += 1) {
        const [first, last] = IMPORTED_STUDENTS[index];
        importedStudents.push(await ensureImportedStudent(manager, school, {
            first,
            last,
            nationalCode: `980000${String(index + 1).padStart(4, "0")}`,
        }));
    }
    await seedStudentProfiles(manager, students);
    await seedRegistrationRequirements(manager, school);
    await seedRegistrationProgress(manager, school, students);
    const guardianA = await ensureScopedStaff(manager, school, { identity: "school.guardian.1", first: "جواد", last: "رضایی" }, user_entity_1.UserRole.GUARDIAN, "GUARDIAN", hash);
    const guardianB = await ensureScopedStaff(manager, school, { identity: "school.guardian.2", first: "حمید", last: "کریمی" }, user_entity_1.UserRole.GUARDIAN, "GUARDIAN", hash);
    await seedContacts(manager, students, guardianA, guardianB);
    await seedRelationships(manager, school, students, counselor, mentor, [diniTeacher, governmentTeacher, secondTeacher], [guardianA, guardianB]);
    const diniClass = await ensureClass(manager, school, {
        code: `${SCHOOL_YEAR}-DINI-1-A`,
        name: "پایه یک دینی - الف",
        gradeId: 1,
        educationTypeId: "religious",
        trackId: "dini",
        advisor: religiousManager,
        capacity: 30,
    });
    const governmentClass = await ensureClass(manager, school, {
        code: `${SCHOOL_YEAR}-GOV-10-A`,
        name: "پایه دهم دولتی - الف",
        gradeId: 10,
        educationTypeId: "government",
        trackId: "general",
        advisor: governmentManager,
        capacity: 30,
    });
    for (const student of students) {
        await ensureClassEnrollment(manager, diniClass, student);
        await ensureClassEnrollment(manager, governmentClass, student);
    }
    const diniGroups = [
        await ensureClassGroup(manager, school, diniClass, "DINI-1-A-G1", "گروه دینی ۱"),
        await ensureClassGroup(manager, school, diniClass, "DINI-1-A-G2", "گروه دینی ۲"),
    ];
    const governmentGroups = [
        await ensureClassGroup(manager, school, governmentClass, "GOV-10-A-G1", "گروه دولتی ۱"),
        await ensureClassGroup(manager, school, governmentClass, "GOV-10-A-G2", "گروه دولتی ۲"),
        await ensureClassGroup(manager, school, governmentClass, "GOV-10-A-G3", "گروه دولتی ۳"),
    ];
    for (let index = 0; index < students.length; index += 1) {
        await ensureGroupMembership(manager, diniGroups[index % diniGroups.length], students[index]);
        await ensureGroupMembership(manager, governmentGroups[index % governmentGroups.length], students[index]);
    }
    const rooms = [
        await ensureDormRoom(manager, school, "D-101", "اتاق ۱۰۱", 6),
        await ensureDormRoom(manager, school, "D-102", "اتاق ۱۰۲", 6),
        await ensureDormRoom(manager, school, "D-103", "اتاق ۱۰۳", 6),
    ];
    for (let index = 0; index < students.length; index += 1) {
        await ensureDormAssignment(manager, rooms[index % rooms.length], students[index]);
    }
    await seedAttendance(manager, {
        school,
        principal,
        disciplinarian,
        diniTeacher,
        governmentTeacher,
        diniClass,
        governmentClass,
        governmentGroups,
        rooms,
        students,
    });
    return {
        organizations: 1,
        users: 1 + 9 + 2 + students.length,
        students: students.length + importedStudents.length,
        studentsWithAccounts: students.length,
        importedStudentsWithoutAccounts: importedStudents.length,
        classes: 2,
        classGroups: diniGroups.length + governmentGroups.length,
        dormRooms: rooms.length,
        attendanceContexts: ["class", "class_group", "dorm"],
        registrationSections: registration_requirement_entity_1.REGISTRATION_SECTIONS.length,
        demoAccounts: {
            platformAdmin: account(STAFF.platform.identity),
            principal: account(STAFF.principal.identity),
            disciplinarian: account(STAFF.disciplinarian.identity),
            counselor: account(STAFF.counselor.identity),
            religiousEducationManager: account(STAFF.religiousManager.identity),
            governmentEducationManager: account(STAFF.governmentManager.identity),
            studentAffairsMentor: account(STAFF.mentor.identity),
            teacher: account(STAFF.diniTeacher.identity),
            student: account("school.student.1"),
            guardian: account("school.guardian.1"),
        },
        passwordNote: "All demo accounts use DEMO_PASSWORD (or the default shown above).",
    };
}
function account(identity) {
    return { username: (0, seed_phone_1.seedPhoneNumber)(identity), password };
}
async function ensureSchool(manager) {
    const repo = manager.getRepository(entities_1.Organization);
    const name = "مدرسه و حوزه آموزشی بستک";
    let school = await repo.findOne({ where: { name } });
    const value = {
        name,
        type: organization_entity_1.OrganizationType.SCHOOL,
        status: organization_entity_1.OrganizationStatus.ACTIVE,
        disabledFeatures: [],
        studentSignupManagedByOrganization: true,
        studentSignupEnabled: true,
        studentSignupLimit: 500,
    };
    if (!school)
        school = repo.create(value);
    else
        Object.assign(school, value);
    return repo.save(school);
}
async function ensureUser(manager, input) {
    const repo = manager.getRepository(entities_1.User);
    const phone = (0, seed_phone_1.seedPhoneNumber)(input.identity);
    let user = await repo.findOne({ where: { username: phone } });
    let platformOwner = false;
    if (input.platformOwner) {
        const existingOwner = await repo.findOne({
            where: { isPlatformOwner: true },
        });
        platformOwner = !existingOwner || existingOwner.id === user?.id;
    }
    const value = {
        username: phone,
        phoneNumber: phone,
        passwordHash: input.hash,
        role: input.legacyRole,
        firstName: input.first,
        lastName: input.last,
        status: input.status ?? user_entity_1.UserStatus.ACTIVE,
        isPlatformOwner: platformOwner,
        locale: "fa-IR",
        timezone: "Asia/Tehran",
    };
    if (!user)
        user = repo.create(value);
    else
        Object.assign(user, value);
    return repo.save(user);
}
async function ensureMembership(manager, user, organization, status = organization_membership_entity_1.MembershipStatus.ACTIVE) {
    const repo = manager.getRepository(entities_1.OrganizationMembership);
    let membership = await repo.findOne({
        where: { user: { id: user.id }, organization: { id: organization.id } },
    });
    if (!membership)
        membership = repo.create({ user, organization, status });
    else
        membership.status = status;
    return repo.save(membership);
}
async function ensureRoleAssignment(manager, user, roleCode, membership) {
    const roleRepo = manager.getRepository(entities_1.Role);
    const assignmentRepo = manager.getRepository(entities_1.UserRoleAssignment);
    const role = await roleRepo.findOne({ where: { code: roleCode } });
    if (!role) {
        throw new Error(`Role ${roleCode} does not exist. Run all database migrations before running the school demo seed.`);
    }
    const assignments = await assignmentRepo.find({
        where: { user: { id: user.id }, role: { id: role.id } },
        relations: { membership: true },
    });
    const found = assignments.find((assignment) => (assignment.membership?.id ?? null) === (membership?.id ?? null));
    if (found)
        return found;
    return assignmentRepo.save(assignmentRepo.create({ user, role, membership: membership ?? null }));
}
async function ensureScopedStaff(manager, organization, identity, legacyRole, roleCode, hash) {
    const user = await ensureUser(manager, {
        ...identity,
        legacyRole,
        hash,
    });
    const membership = await ensureMembership(manager, user, organization);
    await ensureRoleAssignment(manager, user, roleCode, membership);
    return user;
}
async function ensureStudentWithAccount(manager, organization, input) {
    const user = await ensureScopedStaff(manager, organization, input, user_entity_1.UserRole.STUDENT, "STUDENT", input.hash);
    const repo = manager.getRepository(entities_1.Student);
    let student = await repo.findOne({
        where: [{ user: { id: user.id } }, { nationalCode: input.nationalCode }],
        relations: { user: true, organization: true },
    });
    const value = {
        user,
        organization,
        name: `${input.first} ${input.last}`,
        nationalCode: input.nationalCode,
        gradeId: 10,
        learnerProfile: "school",
        independentType: null,
        learningLevel: "پایه دهم",
        educationTypeId: "government",
        trackId: "general",
        grade: "پایه دهم",
        major: "عمومی",
        targetUniversity: "",
        targetField: "",
        targetRank: "",
        dailyCapacity: "",
        accountStatus: "active",
        onboardingStatus: "ASSIGNED",
        registrationStatus: input.registrationStatus,
    };
    if (!student)
        student = repo.create(value);
    else
        Object.assign(student, value);
    return repo.save(student);
}
async function ensureImportedStudent(manager, organization, input) {
    const repo = manager.getRepository(entities_1.Student);
    let student = await repo.findOne({
        where: { nationalCode: input.nationalCode },
    });
    const value = {
        user: null,
        organization,
        name: `${input.first} ${input.last}`,
        nationalCode: input.nationalCode,
        gradeId: 10,
        learnerProfile: "school",
        independentType: null,
        learningLevel: "پایه دهم",
        educationTypeId: "government",
        trackId: "general",
        grade: "پایه دهم",
        major: "عمومی",
        targetUniversity: "",
        targetField: "",
        targetRank: "",
        dailyCapacity: "",
        accountStatus: "active",
        onboardingStatus: "PENDING_ASSIGNMENT",
        registrationStatus: "ACCOUNT_CREATED",
    };
    if (!student)
        student = repo.create(value);
    else
        Object.assign(student, value);
    return repo.save(student);
}
function registrationStatusFor(index) {
    if (index < 8)
        return "ACTIVE";
    if (index < 11)
        return "APPROVED";
    if (index < 14)
        return "WAITING_REVIEW";
    if (index < 16)
        return "NEEDS_CORRECTION";
    return "IN_PROGRESS";
}
async function seedStudentProfiles(manager, students) {
    const repo = manager.getRepository(entities_1.StudentProfile);
    for (let index = 0; index < students.length; index += 1) {
        const student = students[index];
        let profile = await repo.findOne({
            where: { student: { id: student.id } },
        });
        const complete = index < 12;
        const value = {
            student,
            birthCertificateNumber: complete ? `BC-${10000 + index}` : null,
            birthDate: complete
                ? new Date(`2009-${String((index % 9) + 1).padStart(2, "0")}-15T00:00:00+03:30`)
                : null,
            birthPlace: complete ? "بستک" : null,
            certificateIssuePlace: complete ? "بستک" : null,
            gender: "MALE",
            previousSchool: complete ? "مدرسه نمونه قبلی" : null,
            address: complete ? `بستک، محله نمونه، پلاک ${20 + index}` : null,
            postalCode: complete ? `79610${String(10000 + index).slice(-5)}` : null,
            homePhone: complete ? `076442${String(1000 + index)}` : null,
            emergencyPhone: complete
                ? (0, seed_phone_1.seedPhoneNumber)(`student.emergency.${index}`)
                : null,
            healthNotes: index === 2 ? "حساسیت فصلی" : null,
            insuranceProvider: complete ? "بیمه سلامت" : null,
            insuranceNumber: complete ? `INS-${9000 + index}` : null,
            transportNotes: index % 3 === 0 ? "سرویس مدرسه" : null,
        };
        if (!profile)
            profile = repo.create(value);
        else
            Object.assign(profile, value);
        await repo.save(profile);
    }
}
async function seedContacts(manager, students, guardianA, guardianB) {
    const repo = manager.getRepository(entities_1.StudentContact);
    for (let index = 0; index < students.length; index += 1) {
        const student = students[index];
        const familyName = student.name.split(" ").slice(-1)[0];
        const contacts = [
            {
                type: "FATHER",
                fullName: `پدر ${familyName}`,
                nationalCode: `110000${String(index + 1).padStart(4, "0")}`,
                phoneNumber: (0, seed_phone_1.seedPhoneNumber)(`father.${index}`),
                occupation: index % 2 === 0 ? "آزاد" : "کارمند",
                linkedUser: index === 0 ? guardianA : index === 1 ? guardianB : null,
            },
            {
                type: "MOTHER",
                fullName: `مادر ${familyName}`,
                nationalCode: `120000${String(index + 1).padStart(4, "0")}`,
                phoneNumber: (0, seed_phone_1.seedPhoneNumber)(`mother.${index}`),
                occupation: "خانه‌دار",
                linkedUser: null,
            },
            {
                type: "EMERGENCY",
                fullName: `تماس اضطراری ${familyName}`,
                phoneNumber: (0, seed_phone_1.seedPhoneNumber)(`emergency.${index}`),
                linkedUser: null,
            },
        ];
        for (const contact of contacts) {
            let row = await repo.findOne({
                where: { student: { id: student.id }, type: contact.type },
            });
            const value = { student, ...contact };
            if (!row)
                row = repo.create(value);
            else
                Object.assign(row, value);
            await repo.save(row);
        }
    }
}
async function seedRegistrationRequirements(manager, organization) {
    const repo = manager.getRepository(entities_1.RegistrationRequirement);
    const config = [
        {
            code: "BASIC_INFORMATION",
            enabled: true,
            required: true,
            announcement: "اطلاعات پایه خود را تکمیل کنید.",
        },
        {
            code: "IDENTITY_INFORMATION",
            enabled: true,
            required: true,
            announcement: "اطلاعات هویتی و شناسنامه‌ای را ثبت کنید.",
        },
        {
            code: "ADDRESS_CONTACT",
            enabled: true,
            required: true,
            announcement: "نشانی و اطلاعات تماس را تکمیل کنید.",
        },
        {
            code: "PARENTS",
            enabled: true,
            required: true,
            announcement: "اطلاعات والدین یا سرپرست را ثبت کنید.",
        },
        {
            code: "PREVIOUS_EDUCATION",
            enabled: true,
            required: true,
            announcement: "سوابق تحصیلی قبلی را ثبت کنید.",
        },
        {
            code: "DOCUMENTS",
            enabled: true,
            required: true,
            announcement: "مدارک اعلام‌شده مدرسه را بارگذاری کنید.",
        },
        {
            code: "HEALTH",
            enabled: true,
            required: false,
            announcement: "اطلاعات سلامت موردنیاز مدرسه را تکمیل کنید.",
        },
        {
            code: "INSURANCE",
            enabled: false,
            required: false,
            announcement: "این مرحله هنوز باز نشده است.",
        },
        {
            code: "CONSENTS",
            enabled: false,
            required: false,
            announcement: "رضایت‌نامه‌ها در مرحله بعد اعلام می‌شوند.",
        },
        {
            code: "TRANSPORT",
            enabled: false,
            required: false,
            announcement: "در صورت استفاده از سرویس مدرسه فعال می‌شود.",
        },
        {
            code: "TUITION",
            enabled: false,
            required: false,
            announcement: "برای مدارس غیردولتی قابل فعال‌سازی است.",
        },
    ];
    for (let index = 0; index < config.length; index += 1) {
        const item = config[index];
        let row = await repo.findOne({
            where: { organization: { id: organization.id }, sectionCode: item.code },
        });
        const value = {
            organization,
            sectionCode: item.code,
            enabled: item.enabled,
            required: item.required,
            sortOrder: index + 1,
            announcement: item.announcement,
            opensAt: item.enabled ? new Date() : null,
            closesAt: null,
        };
        if (!row)
            row = repo.create(value);
        else
            Object.assign(row, value);
        await repo.save(row);
    }
}
async function seedRegistrationProgress(manager, organization, students) {
    const repo = manager.getRepository(entities_1.RegistrationProgress);
    const enabledSections = registration_requirement_entity_1.REGISTRATION_SECTIONS.slice(0, 7);
    for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
        const student = students[studentIndex];
        for (let sectionIndex = 0; sectionIndex < enabledSections.length; sectionIndex += 1) {
            const sectionCode = enabledSections[sectionIndex];
            const status = progressStatus(student.registrationStatus, sectionIndex);
            let row = await repo.findOne({
                where: {
                    student: { id: student.id },
                    organization: { id: organization.id },
                    sectionCode,
                },
            });
            const value = {
                student,
                organization,
                sectionCode,
                status,
                reviewNote: status === "NEEDS_CORRECTION"
                    ? "شماره شناسنامه را دوباره بررسی و اصلاح کنید."
                    : "",
            };
            if (!row)
                row = repo.create(value);
            else
                Object.assign(row, value);
            await repo.save(row);
        }
    }
}
function progressStatus(registrationStatus, sectionIndex) {
    if (registrationStatus === "ACTIVE" || registrationStatus === "APPROVED") {
        return sectionIndex < 6 ? "APPROVED" : "SUBMITTED";
    }
    if (registrationStatus === "WAITING_REVIEW") {
        return sectionIndex < 3
            ? "APPROVED"
            : sectionIndex < 5
                ? "SUBMITTED"
                : "NOT_STARTED";
    }
    if (registrationStatus === "NEEDS_CORRECTION") {
        if (sectionIndex === 1)
            return "NEEDS_CORRECTION";
        return sectionIndex === 0 ? "APPROVED" : "NOT_STARTED";
    }
    if (registrationStatus === "IN_PROGRESS") {
        if (sectionIndex === 0)
            return "APPROVED";
        if (sectionIndex === 1)
            return "IN_PROGRESS";
    }
    return "NOT_STARTED";
}
async function seedRelationships(manager, organization, students, counselor, mentor, teachers, guardians) {
    for (let index = 0; index < students.length; index += 1) {
        const student = students[index];
        if (index < 10) {
            await ensureRelationship(manager, counselor, student, organization, user_relationship_entity_1.RelationshipType.ADVISOR_OF);
        }
        if (index < 8) {
            await ensureRelationship(manager, mentor, student, organization, user_relationship_entity_1.RelationshipType.MENTOR_OF);
        }
        await ensureRelationship(manager, teachers[index % teachers.length], student, organization, user_relationship_entity_1.RelationshipType.TEACHER_OF);
    }
    await ensureRelationship(manager, guardians[0], students[0], organization, user_relationship_entity_1.RelationshipType.GUARDIAN_OF);
    await ensureRelationship(manager, guardians[1], students[1], organization, user_relationship_entity_1.RelationshipType.GUARDIAN_OF);
}
async function ensureRelationship(manager, fromUser, toStudent, organization, type) {
    const repo = manager.getRepository(entities_1.UserRelationship);
    let row = await repo.findOne({
        where: {
            fromUser: { id: fromUser.id },
            toStudent: { id: toStudent.id },
            organization: { id: organization.id },
            type,
        },
    });
    const value = {
        fromUser,
        toStudent,
        organization,
        type,
        status: user_relationship_entity_1.RelationshipStatus.ACTIVE,
        acceptedAt: new Date(),
        revokedAt: null,
    };
    if (!row)
        row = repo.create(value);
    else
        Object.assign(row, value);
    return repo.save(row);
}
async function ensureClass(manager, organization, input) {
    const repo = manager.getRepository(entities_1.EducationClass);
    let row = await repo.findOne({
        where: { organization: { id: organization.id }, code: input.code },
    });
    const value = {
        organization,
        code: input.code,
        name: input.name,
        schoolYear: SCHOOL_YEAR,
        gradeId: input.gradeId,
        educationTypeId: input.educationTypeId,
        trackId: input.trackId,
        capacity: input.capacity,
        status: "ACTIVE",
        description: "کلاس نمایشی مدرسه برای تست سامانه",
        advisor: input.advisor,
    };
    if (!row)
        row = repo.create(value);
    else
        Object.assign(row, value);
    return repo.save(row);
}
async function ensureClassEnrollment(manager, classroom, student) {
    const repo = manager.getRepository(entities_1.EducationClassEnrollment);
    const found = await repo.findOne({
        where: { classroom: { id: classroom.id }, student: { id: student.id } },
    });
    return found ?? repo.save(repo.create({ classroom, student }));
}
async function ensureClassGroup(manager, organization, classroom, code, name) {
    const repo = manager.getRepository(entities_1.StudyGroup);
    let row = await repo.findOne({
        where: { organization: { id: organization.id }, code },
    });
    const value = {
        organization,
        classroom,
        code,
        name,
        description: `گروه مربوط به ${classroom.name}`,
        status: "ACTIVE",
    };
    if (!row)
        row = repo.create(value);
    else
        Object.assign(row, value);
    return repo.save(row);
}
async function ensureGroupMembership(manager, group, student) {
    const repo = manager.getRepository(entities_1.StudyGroupMembership);
    const found = await repo.findOne({
        where: { group: { id: group.id }, student: { id: student.id } },
    });
    return found ?? repo.save(repo.create({ group, student }));
}
async function ensureDormRoom(manager, organization, code, name, capacity) {
    const repo = manager.getRepository(entities_1.DormRoom);
    let room = await repo.findOne({
        where: { organization: { id: organization.id }, code },
    });
    const value = {
        organization,
        code,
        name,
        capacity,
        status: "ACTIVE",
    };
    if (!room)
        room = repo.create(value);
    else
        Object.assign(room, value);
    return repo.save(room);
}
async function ensureDormAssignment(manager, room, student) {
    const repo = manager.getRepository(entities_1.DormRoomAssignment);
    const existingForStudent = await repo.findOne({
        where: { student: { id: student.id } },
        relations: { room: true },
    });
    if (existingForStudent) {
        existingForStudent.room = room;
        return repo.save(existingForStudent);
    }
    return repo.save(repo.create({ room, student }));
}
async function seedAttendance(manager, input) {
    const classSession = await ensureAttendanceSession(manager, {
        organization: input.school,
        contextType: "class",
        contextId: input.governmentClass.id,
        sessionDate: localDayAt(-1, 8, 0),
        note: "حضور صبح کلاس دولتی",
        createdBy: input.governmentTeacher,
    });
    await seedAttendanceRecords(manager, classSession, input.students, input.governmentTeacher, (index) => index === 3
        ? attendance_record_entity_1.AttendanceStatus.ABSENT
        : index === 7
            ? attendance_record_entity_1.AttendanceStatus.LATE
            : attendance_record_entity_1.AttendanceStatus.PRESENT);
    const diniSession = await ensureAttendanceSession(manager, {
        organization: input.school,
        contextType: "class",
        contextId: input.diniClass.id,
        sessionDate: localDayAt(-1, 10, 0),
        note: "حضور کلاس دینی",
        createdBy: input.diniTeacher,
    });
    await seedAttendanceRecords(manager, diniSession, input.students, input.diniTeacher, (index) => index === 5 ? attendance_record_entity_1.AttendanceStatus.EXCUSED : attendance_record_entity_1.AttendanceStatus.PRESENT);
    for (let groupIndex = 0; groupIndex < input.governmentGroups.length; groupIndex += 1) {
        const group = input.governmentGroups[groupIndex];
        const groupStudents = input.students.filter((_, studentIndex) => studentIndex % input.governmentGroups.length === groupIndex);
        const session = await ensureAttendanceSession(manager, {
            organization: input.school,
            contextType: "class_group",
            contextId: group.id,
            sessionDate: localDayAt(0, 14, 0),
            note: `حضور ${group.name}`,
            createdBy: input.disciplinarian,
        });
        await seedAttendanceRecords(manager, session, groupStudents, input.disciplinarian, (index) => index === 1 && groupIndex === 1
            ? attendance_record_entity_1.AttendanceStatus.LATE
            : attendance_record_entity_1.AttendanceStatus.PRESENT);
    }
    for (let roomIndex = 0; roomIndex < input.rooms.length; roomIndex += 1) {
        const room = input.rooms[roomIndex];
        const roomStudents = input.students.filter((_, studentIndex) => studentIndex % input.rooms.length === roomIndex);
        const session = await ensureAttendanceSession(manager, {
            organization: input.school,
            contextType: "dorm",
            contextId: room.id,
            sessionDate: localDayAt(-1, 22, 30),
            note: "حضور شبانه خوابگاه ساعت ۲۲:۳۰",
            createdBy: input.disciplinarian,
        });
        await seedAttendanceRecords(manager, session, roomStudents, input.disciplinarian, (index) => roomIndex === 0 && index === 0
            ? attendance_record_entity_1.AttendanceStatus.ABSENT
            : attendance_record_entity_1.AttendanceStatus.PRESENT);
    }
    void input.principal;
}
async function ensureAttendanceSession(manager, input) {
    const repo = manager.getRepository(entities_1.AttendanceSession);
    let row = await repo.findOne({
        where: {
            organization: { id: input.organization.id },
            contextType: input.contextType,
            contextId: input.contextId,
            sessionDate: input.sessionDate,
        },
    });
    const value = {
        organization: input.organization,
        contextType: input.contextType,
        contextId: input.contextId,
        sessionDate: input.sessionDate,
        note: input.note,
        createdBy: input.createdBy,
    };
    if (!row)
        row = repo.create(value);
    else
        Object.assign(row, value);
    return repo.save(row);
}
async function seedAttendanceRecords(manager, session, students, recordedBy, statusForIndex) {
    const repo = manager.getRepository(entities_1.AttendanceRecord);
    for (let index = 0; index < students.length; index += 1) {
        const student = students[index];
        let row = await repo.findOne({
            where: { session: { id: session.id }, student: { id: student.id } },
        });
        const status = statusForIndex(index);
        const value = {
            session,
            student,
            status,
            note: status === attendance_record_entity_1.AttendanceStatus.PRESENT ? "" : "داده نمایشی",
            recordedBy,
        };
        if (!row)
            row = repo.create(value);
        else
            Object.assign(row, value);
        await repo.save(row);
    }
}
function localDayAt(offset, hour, minute) {
    const now = new Date();
    const local = new Date(now.getTime() + offset * 86_400_000);
    const date = local.toISOString().slice(0, 10);
    return new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+03:30`);
}
if (require.main === module) {
    seedProductDemo().catch(async (error) => {
        console.error(error);
        if (data_source_1.default.isInitialized)
            await data_source_1.default.destroy();
        process.exitCode = 1;
    });
}
//# sourceMappingURL=product-demo.js.map