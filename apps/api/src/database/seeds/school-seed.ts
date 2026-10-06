import "reflect-metadata";
import bcrypt from "bcryptjs";
import dataSource from "../data-source";
import { EntityManager } from "typeorm";
import {
  Organization,
  OrganizationStatus,
  OrganizationType,
} from "../entities/organization.entity";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../entities/organization-membership.entity";
import { Role } from "../entities/role.entity";
import { Student } from "../entities/student.entity";
import {
  RelationshipStatus,
  RelationshipType,
  UserRelationship,
} from "../entities/user-relationship.entity";
import { UserRoleAssignment } from "../entities/user-role-assignment.entity";
import { User, UserRole, UserStatus } from "../entities/user.entity";
import { EducationClass } from "../entities/education-class.entity";
import { DormRoom } from "../entities/dorm-room.entity";
import { EducationClassEnrollment } from "../entities/education-class-enrollment.entity";
import { DormRoomAssignment } from "../entities/dorm-room-assignment.entity";
import { EducationBook } from "../entities/education-book.entity";
import { EducationClassBook } from "../entities/education-class-book.entity";
import { Plan, PlanStatus } from "../entities/plan.entity";
import { Task, TaskType } from "../entities/task.entity";
import { Notification } from "../entities/notification.entity";
import { NotificationType } from "../entities/notification.entity";
import { seedPhoneNumber } from "./seed-phone";

const password = process.env.E2E_PASSWORD || "Moshaver-e2e-2026!";

export async function seedSchool() {
  if (
    process.env.ALLOW_E2E_SEED !== "true" ||
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "Refusing to create test identities. Use ALLOW_E2E_SEED=true against a disposable non-production database.",
    );
  }

  await dataSource.initialize();
  await dataSource.runMigrations();
  const manager = dataSource.manager;
  const hash = await bcrypt.hash(password, 12);

  // Create school organization
  const school = await ensureSchool(manager);

  // Create platform admin
  const platformAdmin = await ensureUser(
    manager,
    "platform.admin",
    "admin",
    "admin",
    UserRole.PLATFORM_ADMIN,
    hash,
    true,
  );

  // Create school admin
  const schoolAdmin = await ensureScopedStaff(
    manager,
    school,
    "school.admin",
    "school",
    "admin",
    UserRole.ORGANIZATION_ADMIN,
    "ORGANIZATION_ADMIN",
    hash,
  );

  // Create management user
  const management = await ensureScopedStaff(
    manager,
    school,
    "school.management",
    "management",
    "user",
    UserRole.CONTENT_MANAGER,
    "CONTENT_MANAGER",
    hash,
  );

  // Create 3 supervisors
  const supervisors: User[] = [];
  for (let i = 1; i <= 3; i++) {
    const supervisor = await ensureScopedStaff(
      manager,
      school,
      `school.supervisor.${i}`,
      `supervisor`,
      `user${i}`,
      UserRole.MENTOR,
      "MENTOR",
      hash,
    );
    supervisors.push(supervisor);
  }

  // Create 20 teachers
  const teachers: User[] = [];
  for (let i = 1; i <= 20; i++) {
    const teacher = await ensureScopedStaff(
      manager,
      school,
      `school.teacher.${i}`,
      `teacher`,
      `user${i}`,
      UserRole.TEACHER,
      "TEACHER",
      hash,
    );
    teachers.push(teacher);
  }

  // Create 1 adult student
  const adultStudentUser = await ensureScopedStaff(
    manager,
    school,
    "school.student.adult",
    "adult",
    "student",
    UserRole.STUDENT,
    "STUDENT",
    hash,
  );

  const adultStudent = await ensureStudentWithAccount(manager, school, {
    identity: "school.student.adult",
    first: "احمد",
    last: "رضایی",
    hash,
    nationalCode: "1234567890",
    registrationStatus: "ACTIVE",
    independentType: "adult",
  });

  // Create 16 dorm rooms
  const dormRooms: DormRoom[] = [];
  for (let i = 1; i <= 16; i++) {
    const room = await ensureDormRoom(
      manager,
      school,
      `D-${String(i).padStart(3, "0")}`,
      `اتاق ${i}`,
      4,
    );
    dormRooms.push(room);
  }

  // Assign adult student to a dorm room
  await ensureDormAssignment(manager, dormRooms[0], adultStudent);

  // Create 4 classes: Class 1A, 1B, 2A, 2B
  const classes: EducationClass[] = [];

  // Class 1A
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

  // Class 1B
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

  // Class 2A
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

  // Class 2B
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

  // Enroll adult student in all 4 classes
  await ensureClassEnrollment(manager, class1A, adultStudent);
  await ensureClassEnrollment(manager, class1B, adultStudent);
  await ensureClassEnrollment(manager, class2A, adultStudent);
  await ensureClassEnrollment(manager, class2B, adultStudent);

  // Create some books
  const books: EducationBook[] = [];

  const mathBook = await ensureBook(
    manager,
    "MATH-001",
    "ریاضی پایه اول",
    "ریاضی پایه اول",
    1,
    "school",
    "general",
  );
  books.push(mathBook);

  const scienceBook = await ensureBook(
    manager,
    "SCI-001",
    "علوم پایه اول",
    "علوم پایه اول",
    1,
    "school",
    "general",
  );
  books.push(scienceBook);

  const literatureBook = await ensureBook(
    manager,
    "LIT-001",
    "ادبیات فارسی پایه اول",
    "ادبیات فارسی پایه اول",
    1,
    "school",
    "general",
  );
  books.push(literatureBook);

  // Assign books to classes
  await ensureClassBook(manager, class1A, mathBook, teachers[0]);
  await ensureClassBook(manager, class1A, scienceBook, teachers[0]);
  await ensureClassBook(manager, class1B, literatureBook, teachers[1]);

  // Create schedule plan for the adult student
  const today = new Date();
  const plan = await ensurePlan(manager, adultStudent, today);

  // Add class tasks to the plan
  await ensureTask(
    manager,
    plan,
    "CLASS",
    "کلاس ریاضی پایه اول",
    "ریاضی",
    "08:00",
    "09:30",
    90,
  );

  await ensureTask(
    manager,
    plan,
    "CLASS",
    "کلاس علوم پایه اول",
    "علوم",
    "09:45",
    "11:15",
    90,
  );

  await ensureTask(
    manager,
    plan,
    "CLASS",
    "کلاس ادبیات فارسی پایه اول",
    "ادبیات",
    "13:00",
    "14:30",
    90,
  );

  // Create notifications for class reminders
  await ensureNotification(
    manager,
    adultStudentUser,
    "PLAN_UPDATE",
    "برنامه روزانه به‌روزرسانی شد",
    "برنامه روزانه شما برای امروز به‌روزرسانی شد.",
  );

  await ensureNotification(
    manager,
    adultStudentUser,
    "EXAM_REMINDER",
    "یادآوری کلاس ریاضی",
    "کلاس ریاضی در ۱۰ دقیقه آینده شروع می‌شود.",
  );

  console.log(
    JSON.stringify(
      {
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
      },
      null,
      2,
    ),
  );

  await dataSource.destroy();
}

async function ensureSchool(manager: EntityManager) {
  const repo = manager.getRepository(Organization);
  const name = "مدرسه و حوزه آموزشی بستک";
  let school = await repo.findOne({ where: { name } });
  const value = {
    name,
    type: OrganizationType.SCHOOL,
    status: OrganizationStatus.ACTIVE,
    disabledFeatures: [],
    studentSignupManagedByOrganization: true,
    studentSignupEnabled: true,
    studentSignupLimit: 500,
  };
  if (!school) school = repo.create(value);
  else Object.assign(school, value);
  return repo.save(school);
}

async function ensureUser(
  manager: EntityManager,
  username: string,
  first: string,
  last: string,
  role: UserRole,
  hash: string,
  isPlatformOwner: boolean = false,
) {
  const repo = manager.getRepository(User);
  const phone = seedPhoneNumber(username);
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
    status: UserStatus.ACTIVE,
    isPlatformOwner: platformOwner,
    locale: "fa-IR",
    timezone: "Asia/Tehran",
  };

  if (!user) user = repo.create(value);
  else Object.assign(user, value);
  return repo.save(user);
}

async function ensureScopedStaff(
  manager: EntityManager,
  organization: Organization,
  identity: string,
  first: string,
  last: string,
  legacyRole: UserRole,
  roleCode: string,
  hash: string,
) {
  const user = await ensureUser(
    manager,
    identity,
    first,
    last,
    legacyRole,
    hash,
  );

  const membership = await ensureMembership(manager, user, organization);
  await ensureRoleAssignment(manager, user, roleCode, membership);
  return user;
}

async function ensureMembership(
  manager: EntityManager,
  user: User,
  organization: Organization,
  status = MembershipStatus.ACTIVE,
) {
  const repo = manager.getRepository(OrganizationMembership);
  let membership = await repo.findOne({
    where: { user: { id: user.id }, organization: { id: organization.id } },
  });
  if (!membership) membership = repo.create({ user, organization, status });
  else membership.status = status;
  return repo.save(membership);
}

async function ensureRoleAssignment(
  manager: EntityManager,
  user: User,
  roleCode: string,
  membership: OrganizationMembership | null,
) {
  const roleRepo = manager.getRepository(Role);
  const assignmentRepo = manager.getRepository(UserRoleAssignment);
  const role = await roleRepo.findOne({ where: { code: roleCode } });
  if (!role) {
    throw new Error(
      `Role ${roleCode} does not exist. Run all database migrations before running the school demo seed.`,
    );
  }

  const assignments = await assignmentRepo.find({
    where: { user: { id: user.id }, role: { id: role.id } },
    relations: { membership: true },
  });
  const found = assignments.find(
    (assignment) =>
      (assignment.membership?.id ?? null) === (membership?.id ?? null),
  );
  if (found) return found;

  return assignmentRepo.save(
    assignmentRepo.create({ user, role, membership: membership ?? null }),
  );
}

async function ensureStudentWithAccount(
  manager: EntityManager,
  organization: Organization,
  input: {
    identity: string;
    first: string;
    last: string;
    hash: string;
    nationalCode: string;
    registrationStatus: Student["registrationStatus"];
    independentType?: "adult" | "gap_year" | "homeschool" | "other" | null;
  },
) {
  const user = await ensureScopedStaff(
    manager,
    organization,
    input.identity,
    input.first,
    input.last,
    UserRole.STUDENT,
    "STUDENT",
    input.hash,
  );

  const repo = manager.getRepository(Student);
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
    learnerProfile: "school" as const,
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
    accountStatus: "active" as const,
    onboardingStatus: "ASSIGNED" as const,
    registrationStatus: input.registrationStatus,
  };

  if (!student) student = repo.create(value);
  else Object.assign(student, value);
  return repo.save(student);
}

async function ensureDormRoom(
  manager: EntityManager,
  organization: Organization,
  code: string,
  name: string,
  capacity: number,
) {
  const repo = manager.getRepository(DormRoom);
  let room = await repo.findOne({
    where: { organization: { id: organization.id }, code },
  });
  const value = {
    organization,
    code,
    name,
    capacity,
    status: "ACTIVE" as const,
  };
  if (!room) room = repo.create(value);
  else Object.assign(room, value);
  return repo.save(room);
}

async function ensureDormAssignment(
  manager: EntityManager,
  room: DormRoom,
  student: Student,
) {
  const repo = manager.getRepository(DormRoomAssignment);
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

async function ensureClass(
  manager: EntityManager,
  organization: Organization,
  input: {
    code: string;
    name: string;
    gradeId: number;
    educationTypeId: string;
    trackId: string;
    advisor: User;
    capacity: number;
  },
) {
  const repo = manager.getRepository(EducationClass);
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
    status: "ACTIVE" as const,
    description: "کلاس نمایشی مدرسه برای تست سامانه",
    advisor: input.advisor,
  };
  if (!row) row = repo.create(value);
  else Object.assign(row, value);
  return repo.save(row);
}

async function ensureClassEnrollment(
  manager: EntityManager,
  classroom: EducationClass,
  student: Student,
) {
  const repo = manager.getRepository(EducationClassEnrollment);
  const found = await repo.findOne({
    where: { classroom: { id: classroom.id }, student: { id: student.id } },
  });
  return found ?? repo.save(repo.create({ classroom, student }));
}

async function ensureBook(
  manager: EntityManager,
  id: string,
  titleFa: string,
  titleEn: string,
  grade: number,
  educationTypeId: string,
  trackId: string,
) {
  const repo = manager.getRepository(EducationBook);
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
    state: "PUBLISHED" as const,
    version: 1,
  };
  if (!book) book = repo.create(value);
  else Object.assign(book, value);
  return repo.save(book);
}

async function ensureClassBook(
  manager: EntityManager,
  classroom: EducationClass,
  book: EducationBook,
  teacher: User,
) {
  const repo = manager.getRepository(EducationClassBook);
  let classBook = await repo.findOne({
    where: { classroom: { id: classroom.id }, book: { id: book.id } },
  });
  const value = {
    classroom,
    book,
    teacher,
  };
  if (!classBook) classBook = repo.create(value);
  else Object.assign(classBook, value);
  return repo.save(classBook);
}

async function ensurePlan(
  manager: EntityManager,
  student: Student,
  date: Date,
) {
  const repo = manager.getRepository(Plan);
  const dateString = date.toISOString().split("T")[0];
  let plan = await repo.findOne({
    where: { student: { id: student.id }, date: dateString },
  });
  const value = {
    student,
    date: dateString,
    status: PlanStatus.PUBLISHED,
    title: "برنامه روزانه",
    dayLabel: "شنبه",
    persianDate: "۱۳ مهر ۱۴۰۵",
    jalaliId: "1405-07-13",
    motivationText: "امروز فرصت خوبی برای یادگیری جدید است!",
  };
  if (!plan) plan = repo.create(value);
  else Object.assign(plan, value);
  return repo.save(plan);
}

async function ensureTask(
  manager: EntityManager,
  plan: Plan,
  type: string,
  title: string,
  subject: string,
  startTime: string,
  endTime: string,
  duration: number,
) {
  const repo = manager.getRepository(Task);
  const value = {
    plan,
    type: TaskType.CLASS,
    title,
    subject,
    startTime,
    endTime,
    duration,
    status: "PLANNED" as const,
  };
  return repo.save(repo.create(value));
}

async function ensureNotification(
  manager: EntityManager,
  user: User,
  type: string,
  title: string,
  body: string,
) {
  const repo = manager.getRepository(Notification);
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
    if (dataSource.isInitialized) await dataSource.destroy();
    process.exitCode = 1;
  });
}
