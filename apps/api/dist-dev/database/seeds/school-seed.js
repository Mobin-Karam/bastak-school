"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSchool = seedSchool;
require("reflect-metadata");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const data_source_1 = __importDefault(require("../data-source"));
const organization_entity_1 = require("../entities/organization.entity");
const organization_membership_entity_1 = require("../entities/organization-membership.entity");
const role_entity_1 = require("../entities/role.entity");
const student_entity_1 = require("../entities/student.entity");
const user_role_assignment_entity_1 = require("../entities/user-role-assignment.entity");
const user_entity_1 = require("../entities/user.entity");
const education_class_entity_1 = require("../entities/education-class.entity");
const dorm_room_entity_1 = require("../entities/dorm-room.entity");
const education_class_enrollment_entity_1 = require("../entities/education-class-enrollment.entity");
const dorm_room_assignment_entity_1 = require("../entities/dorm-room-assignment.entity");
const education_book_entity_1 = require("../entities/education-book.entity");
const education_class_book_entity_1 = require("../entities/education-class-book.entity");
const plan_entity_1 = require("../entities/plan.entity");
const task_entity_1 = require("../entities/task.entity");
const notification_entity_1 = require("../entities/notification.entity");
const seed_phone_1 = require("./seed-phone");
const password = process.env.E2E_PASSWORD || "Moshaver-e2e-2026!";
async function seedSchool() {
    if (process.env.ALLOW_E2E_SEED !== "true" ||
        process.env.NODE_ENV === "production") {
        throw new Error("Refusing to create test identities. Use ALLOW_E2E_SEED=true against a disposable non-production database.");
    }
    await data_source_1.default.initialize();
    await data_source_1.default.runMigrations();
    const manager = data_source_1.default.manager;
    const hash = await bcryptjs_1.default.hash(password, 12);
    const school = await ensureSchool(manager);
    const platformAdmin = await ensureUser(manager, "platform.admin", "admin", "admin", user_entity_1.UserRole.PLATFORM_ADMIN, hash, true);
    const schoolAdmin = await ensureScopedStaff(manager, school, "school.admin", "school", "admin", user_entity_1.UserRole.ORGANIZATION_ADMIN, "ORGANIZATION_ADMIN", hash);
    const management = await ensureScopedStaff(manager, school, "school.management", "management", "user", user_entity_1.UserRole.CONTENT_MANAGER, "CONTENT_MANAGER", hash);
    const supervisors = [];
    for (let i = 1; i <= 3; i++) {
        const supervisor = await ensureScopedStaff(manager, school, `school.supervisor.${i}`, `supervisor`, `user${i}`, user_entity_1.UserRole.MENTOR, "MENTOR", hash);
        supervisors.push(supervisor);
    }
    const teachers = [];
    for (let i = 1; i <= 20; i++) {
        const teacher = await ensureScopedStaff(manager, school, `school.teacher.${i}`, `teacher`, `user${i}`, user_entity_1.UserRole.TEACHER, "TEACHER", hash);
        teachers.push(teacher);
    }
    const adultStudentUser = await ensureScopedStaff(manager, school, "school.student.adult", "adult", "student", user_entity_1.UserRole.STUDENT, "STUDENT", hash);
    const adultStudent = await ensureStudentWithAccount(manager, school, {
        identity: "school.student.adult",
        first: "احمد",
        last: "رضایی",
        hash,
        nationalCode: "1234567890",
        registrationStatus: "ACTIVE",
        independentType: "adult",
    });
    const dormRooms = [];
    for (let i = 1; i <= 16; i++) {
        const room = await ensureDormRoom(manager, school, `D-${String(i).padStart(3, "0")}`, `اتاق ${i}`, 4);
        dormRooms.push(room);
    }
    await ensureDormAssignment(manager, dormRooms[0], adultStudent);
    const classes = [];
    const class1A = await ensureClass(manager, school, {
        code: "CLASS-1-A",
        name: "پایه اول - الف",
        gradeId: 1,
        educationTypeId: "school",
        trackId: "general",
        advisor: teachers[0],
        capacity: 30,
    });
    classes.push(class1A);
    const class1B = await ensureClass(manager, school, {
        code: "CLASS-1-B",
        name: "پایه اول - ب",
        gradeId: 1,
        educationTypeId: "school",
        trackId: "general",
        advisor: teachers[1],
        capacity: 30,
    });
    classes.push(class1B);
    const class2A = await ensureClass(manager, school, {
        code: "CLASS-2-A",
        name: "پایه دوم - الف",
        gradeId: 2,
        educationTypeId: "school",
        trackId: "general",
        advisor: teachers[2],
        capacity: 30,
    });
    classes.push(class2A);
    const class2B = await ensureClass(manager, school, {
        code: "CLASS-2-B",
        name: "پایه دوم - ب",
        gradeId: 2,
        educationTypeId: "school",
        trackId: "general",
        advisor: teachers[3],
        capacity: 30,
    });
    classes.push(class2B);
    await ensureClassEnrollment(manager, class1A, adultStudent);
    await ensureClassEnrollment(manager, class1B, adultStudent);
    await ensureClassEnrollment(manager, class2A, adultStudent);
    await ensureClassEnrollment(manager, class2B, adultStudent);
    const books = [];
    const mathBook = await ensureBook(manager, "MATH-001", "ریاضی پایه اول", "ریاضی پایه اول", 1, "school", "general");
    books.push(mathBook);
    const scienceBook = await ensureBook(manager, "SCI-001", "علوم پایه اول", "علوم پایه اول", 1, "school", "general");
    books.push(scienceBook);
    const literatureBook = await ensureBook(manager, "LIT-001", "ادبیات فارسی پایه اول", "ادبیات فارسی پایه اول", 1, "school", "general");
    books.push(literatureBook);
    await ensureClassBook(manager, class1A, mathBook, teachers[0]);
    await ensureClassBook(manager, class1A, scienceBook, teachers[0]);
    await ensureClassBook(manager, class1B, literatureBook, teachers[1]);
    const today = new Date();
    const plan = await ensurePlan(manager, adultStudent, today);
    await ensureTask(manager, plan, "CLASS", "کلاس ریاضی پایه اول", "ریاضی", "08:00", "09:30", 90);
    await ensureTask(manager, plan, "CLASS", "کلاس علوم پایه اول", "علوم", "09:45", "11:15", 90);
    await ensureTask(manager, plan, "CLASS", "کلاس ادبیات فارسی پایه اول", "ادبیات", "13:00", "14:30", 90);
    await ensureNotification(manager, adultStudentUser, "PLAN_UPDATE", "برنامه روزانه به‌روزرسانی شد", "برنامه روزانه شما برای امروز به‌روزرسانی شد.");
    await ensureNotification(manager, adultStudentUser, "EXAM_REMINDER", "یادآوری کلاس ریاضی", "کلاس ریاضی در ۱۰ دقیقه آینده شروع می‌شود.");
    console.log(JSON.stringify({
        database: process.env.DATABASE_PATH,
        password,
        school: school.name,
        users: {
            platformAdmin: platformAdmin.username,
            schoolAdmin: schoolAdmin.username,
            management: management.username,
            supervisors: supervisors.map((u) => u.username),
            teachers: teachers.map((u) => u.username),
            adultStudent: adultStudentUser.username,
        },
        dormRooms: dormRooms.length,
        classes: classes.length,
        books: books.length,
    }, null, 2));
    await data_source_1.default.destroy();
}
async function ensureSchool(manager) {
    const repo = manager.getRepository(organization_entity_1.Organization);
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
async function ensureUser(manager, username, first, last, role, hash, isPlatformOwner = false) {
    const repo = manager.getRepository(user_entity_1.User);
    const phone = (0, seed_phone_1.seedPhoneNumber)(username);
    let user = await repo.findOne({ where: { username } });
    let platformOwner = false;
    if (isPlatformOwner) {
        const existingOwner = await repo.findOne({
            where: { isPlatformOwner: true },
        });
        platformOwner = !existingOwner || existingOwner.id === user?.id;
    }
    const value = {
        username,
        phoneNumber: phone,
        passwordHash: hash,
        role,
        firstName: first,
        lastName: last,
        status: user_entity_1.UserStatus.ACTIVE,
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
async function ensureScopedStaff(manager, organization, identity, first, last, legacyRole, roleCode, hash) {
    const user = await ensureUser(manager, identity, first, last, legacyRole, hash);
    const membership = await ensureMembership(manager, user, organization);
    await ensureRoleAssignment(manager, user, roleCode, membership);
    return user;
}
async function ensureMembership(manager, user, organization, status = organization_membership_entity_1.MembershipStatus.ACTIVE) {
    const repo = manager.getRepository(organization_membership_entity_1.OrganizationMembership);
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
    const roleRepo = manager.getRepository(role_entity_1.Role);
    const assignmentRepo = manager.getRepository(user_role_assignment_entity_1.UserRoleAssignment);
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
async function ensureStudentWithAccount(manager, organization, input) {
    const user = await ensureScopedStaff(manager, organization, input.identity, input.first, input.last, user_entity_1.UserRole.STUDENT, "STUDENT", input.hash);
    const repo = manager.getRepository(student_entity_1.Student);
    let student = await repo.findOne({
        where: [{ user: { id: user.id } }, { nationalCode: input.nationalCode }],
        relations: { user: true, organization: true },
    });
    const value = {
        user,
        organization,
        name: `${input.first} ${input.last}`,
        nationalCode: input.nationalCode,
        gradeId: 1,
        learnerProfile: "school",
        independentType: input.independentType ?? null,
        learningLevel: "پایه اول",
        educationTypeId: "school",
        trackId: "general",
        grade: "پایه اول",
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
async function ensureDormRoom(manager, organization, code, name, capacity) {
    const repo = manager.getRepository(dorm_room_entity_1.DormRoom);
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
    const repo = manager.getRepository(dorm_room_assignment_entity_1.DormRoomAssignment);
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
async function ensureClass(manager, organization, input) {
    const repo = manager.getRepository(education_class_entity_1.EducationClass);
    let row = await repo.findOne({
        where: { organization: { id: organization.id }, code: input.code },
    });
    const value = {
        organization,
        code: input.code,
        name: input.name,
        schoolYear: "1405-1406",
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
    const repo = manager.getRepository(education_class_enrollment_entity_1.EducationClassEnrollment);
    const found = await repo.findOne({
        where: { classroom: { id: classroom.id }, student: { id: student.id } },
    });
    return found ?? repo.save(repo.create({ classroom, student }));
}
async function ensureBook(manager, id, titleFa, titleEn, grade, educationTypeId, trackId) {
    const repo = manager.getRepository(education_book_entity_1.EducationBook);
    let book = await repo.findOne({ where: { id } });
    const value = {
        id,
        country: "IR",
        schoolYear: "1405-1406",
        grade,
        level: "پایه اول",
        branch: "عمومی",
        track: trackId,
        category: "درسی",
        titleFa,
        titleEn,
        appliesTo: ["school"],
        state: "PUBLISHED",
        version: 1,
    };
    if (!book)
        book = repo.create(value);
    else
        Object.assign(book, value);
    return repo.save(book);
}
async function ensureClassBook(manager, classroom, book, teacher) {
    const repo = manager.getRepository(education_class_book_entity_1.EducationClassBook);
    let classBook = await repo.findOne({
        where: { classroom: { id: classroom.id }, book: { id: book.id } },
    });
    const value = {
        classroom,
        book,
        teacher,
    };
    if (!classBook)
        classBook = repo.create(value);
    else
        Object.assign(classBook, value);
    return repo.save(classBook);
}
async function ensurePlan(manager, student, date) {
    const repo = manager.getRepository(plan_entity_1.Plan);
    const dateString = date.toISOString().split("T")[0];
    let plan = await repo.findOne({
        where: { student: { id: student.id }, date: dateString },
    });
    const value = {
        student,
        date: dateString,
        status: plan_entity_1.PlanStatus.PUBLISHED,
        title: "برنامه روزانه",
        dayLabel: "شنبه",
        persianDate: "۱۳ مهر ۱۴۰۵",
        jalaliId: "1405-07-13",
        motivationText: "امروز فرصت خوبی برای یادگیری جدید است!",
    };
    if (!plan)
        plan = repo.create(value);
    else
        Object.assign(plan, value);
    return repo.save(plan);
}
async function ensureTask(manager, plan, type, title, subject, startTime, endTime, duration) {
    const repo = manager.getRepository(task_entity_1.Task);
    const value = {
        plan,
        type: task_entity_1.TaskType.CLASS,
        title,
        subject,
        startTime,
        endTime,
        duration,
        status: "PLANNED",
    };
    return repo.save(repo.create(value));
}
async function ensureNotification(manager, user, type, title, body) {
    const repo = manager.getRepository(notification_entity_1.Notification);
    const value = {
        user,
        type,
        title,
        body,
        category: "school",
        priority: "normal",
    };
    return repo.save(repo.create(value));
}
if (require.main === module) {
    seedSchool().catch(async (error) => {
        console.error(error);
        if (data_source_1.default.isInitialized)
            await data_source_1.default.destroy();
        process.exitCode = 1;
    });
}
//# sourceMappingURL=school-seed.js.map