import "reflect-metadata";
import bcrypt from "bcryptjs";
import { EntityManager } from "typeorm";
import dataSource from "../data-source";
import {
  ActivityEvent,
  ChatMessage,
  Conversation,
  ConversationMember,
  DailyReport,
  EducationBook,
  EducationClass,
  EducationClassBook,
  EducationClassEnrollment,
  Exam,
  ExamAssignment,
  ExamAttempt,
  ExamRetryRequest,
  ExamSyllabus,
  LearningItem,
  MessageReaction,
  Mistake,
  Notification,
  Organization,
  OrganizationMembership,
  Plan,
  Question,
  QuestionBankItem,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  Recommendation,
  RecoveryRequest,
  Role,
  Student,
  StudentSubject,
  StudySession,
  Subject,
  SyllabusProgress,
  Task,
  TaskIssue,
  TeacherSubjectAssignment,
  User,
  UserRelationship,
  UserRoleAssignment,
} from "../entities";
import {
  OrganizationStatus,
  OrganizationType,
} from "../entities/organization.entity";
import { MembershipStatus } from "../entities/organization-membership.entity";
import { ConversationMemberRole } from "../entities/conversation-member.entity";
import { ConversationType } from "../entities/conversation.entity";
import { ChatMessageType } from "../entities/chat-message.entity";
import { PlanStatus } from "../entities/plan.entity";
import { RecoveryRequestStatus } from "../entities/recovery-request.entity";
import { RecommendationStatus } from "../entities/recommendation.entity";
import { RetryRequestStatus } from "../entities/exam-retry-request.entity";
import { SyllabusProgressStatus } from "../entities/syllabus-progress.entity";
import { TaskType } from "../entities/task.entity";
import { StudySessionStatus } from "../entities/study-session.entity";
import {
  RelationshipStatus,
  RelationshipType,
} from "../entities/user-relationship.entity";
import { UserRole, UserStatus } from "../entities/user.entity";
import {
  requireSafeDemoDatabase,
  requireSafePlatformDatabase,
} from "./demo-guard";
import { seedEducationCatalog } from "../../modules/education-catalog/education-catalog.service";

const password = process.env.DEMO_PASSWORD || "Moshaver-demo-2026!";
const now = new Date();
const day = (offset: number) =>
  new Date(now.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
const at = (offset: number, hour: number) =>
  new Date(`${day(offset)}T${String(hour).padStart(2, "0")}:00:00+03:30`);

export async function seedProductDemo() {
  const database =
    process.env.ALLOW_PLATFORM_SEED === "true"
      ? requireSafePlatformDatabase("seed")
      : requireSafeDemoDatabase("seed");
  await dataSource.initialize();
  await dataSource.runMigrations();
  try {
    const summary = await dataSource.transaction(async (manager) =>
      seed(manager),
    );
    console.log(JSON.stringify({ database, password, ...summary }, null, 2));
  } finally {
    await dataSource.destroy();
  }
}

async function seed(manager: EntityManager) {
  const hash = await bcrypt.hash(password, 12);
  const orgA = await organization(
    manager,
    "آکادمی راه روشن",
    OrganizationType.ACADEMY,
    OrganizationStatus.ACTIVE,
  );
  const orgB = await organization(
    manager,
    "دبیرستان دانش فردا",
    OrganizationType.SCHOOL,
    OrganizationStatus.ACTIVE,
  );
  const orgC = await organization(
    manager,
    "مرکز مشاوره مسیر رشد",
    OrganizationType.COUNSELING_CENTER,
    OrganizationStatus.ACTIVE,
  );
  const textbookCount = await seedEducationCatalog(manager);
  await seedQuestionBank(manager, orgA);

  const platform = await user(
    manager,
    "admin",
    "مدیر",
    "سامانه",
    UserRole.PLATFORM_ADMIN,
    await bcrypt.hash("anonymous", 12),
  );
  await role(manager, platform, "PLATFORM_ADMIN", null);
  const orgAdminA = await scopedUser(
    manager,
    orgA,
    "demo.orgadmin.a",
    "مدیر",
    "راه روشن",
    UserRole.ORGANIZATION_ADMIN,
    "ORGANIZATION_ADMIN",
    hash,
  );
  await scopedUser(
    manager,
    orgB,
    "demo.orgadmin.b",
    "مدیر",
    "دانش فردا",
    UserRole.ORGANIZATION_ADMIN,
    "ORGANIZATION_ADMIN",
    hash,
  );
  await scopedUser(
    manager,
    orgC,
    "demo.orgadmin.c",
    "مدیر",
    "مسیر رشد",
    UserRole.ORGANIZATION_ADMIN,
    "ORGANIZATION_ADMIN",
    hash,
  );
  const advisorA = await scopedUser(
    manager,
    orgA,
    "demo.advisor.a",
    "نگار",
    "احمدی",
    UserRole.ADVISOR,
    "ADVISOR",
    hash,
  );
  const advisorB = await scopedUser(
    manager,
    orgB,
    "demo.advisor.b",
    "سارا",
    "کاظمی",
    UserRole.ADVISOR,
    "ADVISOR",
    hash,
  );
  const advisorC = await scopedUser(
    manager,
    orgC,
    "demo.advisor.c",
    "بهاره",
    "رستمی",
    UserRole.ADVISOR,
    "ADVISOR",
    hash,
  );
  const mathTeacher = await scopedUser(
    manager,
    orgA,
    "demo.teacher.math.a",
    "رضا",
    "نیک‌فر",
    UserRole.TEACHER,
    "TEACHER",
    hash,
  );
  const physicsTeacher = await scopedUser(
    manager,
    orgA,
    "demo.teacher.physics.a",
    "مریم",
    "توکلی",
    UserRole.TEACHER,
    "TEACHER",
    hash,
  );
  const teacherB = await scopedUser(
    manager,
    orgB,
    "demo.teacher.b",
    "علی",
    "دانش",
    UserRole.TEACHER,
    "TEACHER",
    hash,
  );
  const teacherC = await scopedUser(
    manager,
    orgC,
    "demo.teacher.c",
    "ناهید",
    "امین",
    UserRole.TEACHER,
    "TEACHER",
    hash,
  );
  const mentor = await scopedUser(
    manager,
    orgA,
    "demo.mentor.a",
    "الهام",
    "رستگار",
    UserRole.MENTOR,
    "MENTOR",
    hash,
  );
  await scopedUser(
    manager,
    orgB,
    "demo.mentor.b",
    "امیر",
    "نوری",
    UserRole.MENTOR,
    "MENTOR",
    hash,
  );
  const mentorC = await scopedUser(
    manager,
    orgC,
    "demo.mentor.c",
    "ترانه",
    "صالحی",
    UserRole.MENTOR,
    "MENTOR",
    hash,
  );
  const content = await scopedUser(
    manager,
    orgA,
    "demo.content.a",
    "مدیر",
    "محتوا",
    UserRole.CONTENT_MANAGER,
    "CONTENT_MANAGER",
    hash,
  );
  const contentB = await scopedUser(
    manager,
    orgB,
    "demo.content.b",
    "کارشناس",
    "محتوا",
    UserRole.CONTENT_MANAGER,
    "CONTENT_MANAGER",
    hash,
  );
  const contentC = await scopedUser(
    manager,
    orgC,
    "demo.content.c",
    "کارشناس",
    "آموزش",
    UserRole.CONTENT_MANAGER,
    "CONTENT_MANAGER",
    hash,
  );
  const guardian1 = await scopedUser(
    manager,
    orgA,
    "demo.guardian.a1",
    "محمد",
    "رضایی",
    UserRole.GUARDIAN,
    "GUARDIAN",
    hash,
  );
  const guardian2 = await scopedUser(
    manager,
    orgA,
    "demo.guardian.a2",
    "لیلا",
    "رضایی",
    UserRole.GUARDIAN,
    "GUARDIAN",
    hash,
  );
  const multi = await scopedUser(
    manager,
    orgA,
    "demo.multi.a",
    "کیوان",
    "مرادی",
    UserRole.ADVISOR,
    "ADVISOR",
    hash,
  );
  await role(manager, multi, "TEACHER", await membership(manager, multi, orgA));
  const disabled = await user(
    manager,
    "demo.disabled",
    "کاربر",
    "غیرفعال",
    UserRole.STUDENT,
    hash,
    UserStatus.DISABLED,
  );
  const suspended = await scopedUser(
    manager,
    orgC,
    "demo.suspended.member",
    "عضو",
    "تعلیقی",
    UserRole.ADVISOR,
    "ADVISOR",
    hash,
    MembershipStatus.INACTIVE,
  );
  void disabled;
  void suspended;

  const studentA1 = await studentUser(
    manager,
    orgA,
    "demo.student.a1",
    "آرمان رضایی",
    hash,
    12,
    "پایه دوازدهم",
    "experimental_sciences",
    "علوم تجربی",
    "9000000017",
  );
  const studentA2 = await studentUser(
    manager,
    orgA,
    "demo.student.a2",
    "هستی کریمی",
    hash,
    11,
    "پایه یازدهم",
    "math_physics",
    "ریاضی و فیزیک",
    "9000000025",
  );
  const studentA3 = await studentUser(
    manager,
    orgA,
    "demo.student.a3",
    "پارسا محمدی",
    hash,
    12,
    "پایه دوازدهم",
    "math_physics",
    "ریاضی و فیزیک",
    "9000000033",
  );
  const studentB1 = await studentUser(
    manager,
    orgB,
    "demo.student.b1",
    "نرگس اکبری",
    hash,
    12,
    "پایه دوازدهم",
    "experimental_sciences",
    "علوم تجربی",
    "9000000041",
  );
  const studentB2 = await studentUser(
    manager,
    orgB,
    "demo.student.b2",
    "سام یوسفی",
    hash,
    10,
    "پایه دهم",
    "humanities",
    "ادبیات و علوم انسانی",
    "9000000051",
  );
  const studentC1 = await studentUser(
    manager,
    orgC,
    "demo.student.c1",
    "یگانه شریفی",
    hash,
    9,
    "پایه نهم",
    "general",
    "عمومی",
    "9000000068",
  );
  const guardianB = await scopedUser(
    manager,
    orgB,
    "demo.guardian.b1",
    "مهدی",
    "اکبری",
    UserRole.GUARDIAN,
    "GUARDIAN",
    hash,
  );
  const guardianC = await scopedUser(
    manager,
    orgC,
    "demo.guardian.c1",
    "نیلوفر",
    "شریفی",
    UserRole.GUARDIAN,
    "GUARDIAN",
    hash,
  );

  // Keep these figures deliberate: the featured accounts above are part of the
  // operational team, while this fills each organisation to a realistic team
  // of 30 people without creating a different population on every re-seed.
  await Promise.all([
    seedWorkforce(manager, orgA, "a", hash, 7),
    seedWorkforce(manager, orgB, "b", hash, 5),
    seedWorkforce(manager, orgC, "c", hash, 5),
  ]);
  const studentsA = await seedStudentPopulation(manager, orgA, "a", hash, [
    studentA1,
    studentA2,
    studentA3,
  ]);
  const studentsB = await seedStudentPopulation(manager, orgB, "b", hash, [
    studentB1,
    studentB2,
  ]);
  const studentsC = await seedStudentPopulation(manager, orgC, "c", hash, [
    studentC1,
  ]);
  await Promise.all([
    seedDemoClass(manager, orgA, "1405-1406-12-exp-a", "دوازدهم تجربی الف", 12, "theoretical", "experimental_sciences", advisorA, [mathTeacher, physicsTeacher], studentsA.filter((student) => student.grade === "پایه دوازدهم" && student.major === "علوم تجربی").slice(0, 28)),
    seedDemoClass(manager, orgB, "1405-1406-10-humanities-a", "دهم انسانی الف", 10, "theoretical", "humanities", advisorB, [teacherB], studentsB.filter((student) => student.grade === "پایه دهم" && student.major.includes("انسانی")).slice(0, 26)),
    seedDemoClass(manager, orgC, "1405-1406-9-general-a", "نهم عمومی الف", 9, "general", "general", advisorC, [teacherC, mentorC], studentsC.filter((student) => student.grade === "پایه نهم").slice(0, 24)),
  ]);

  await relationship(
    manager,
    guardian1,
    studentA1,
    orgA,
    RelationshipType.GUARDIAN_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    guardian2,
    studentA1,
    orgA,
    RelationshipType.GUARDIAN_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    guardian1,
    studentA2,
    orgA,
    RelationshipType.GUARDIAN_OF,
    RelationshipStatus.PENDING,
  );
  await relationship(
    manager,
    guardian2,
    studentA2,
    orgA,
    RelationshipType.GUARDIAN_OF,
    RelationshipStatus.REJECTED,
  );
  await relationship(
    manager,
    advisorA,
    studentA1,
    orgA,
    RelationshipType.ADVISOR_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    advisorA,
    studentA3,
    orgA,
    RelationshipType.ADVISOR_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    mentor,
    studentA1,
    orgA,
    RelationshipType.MENTOR_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    mathTeacher,
    studentA1,
    orgA,
    RelationshipType.TEACHER_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    physicsTeacher,
    studentA3,
    orgA,
    RelationshipType.TEACHER_OF,
    RelationshipStatus.REVOKED,
  );
  await relationship(
    manager,
    guardianB,
    studentB1,
    orgB,
    RelationshipType.GUARDIAN_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    guardianC,
    studentC1,
    orgC,
    RelationshipType.GUARDIAN_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    advisorB,
    studentB1,
    orgB,
    RelationshipType.ADVISOR_OF,
    RelationshipStatus.ACTIVE,
  );
  await relationship(
    manager,
    advisorC,
    studentC1,
    orgC,
    RelationshipType.ADVISOR_OF,
    RelationshipStatus.ACTIVE,
  );

  const math = await subject(manager, orgA, "demo-math", "ریاضی");
  const physics = await subject(manager, orgA, "demo-physics", "فیزیک");
  const biology = await subject(manager, orgA, "demo-biology", "زیست‌شناسی");
  const chemistry = await subject(manager, orgA, "demo-chemistry", "شیمی");
  const bMath = await subject(manager, orgB, "demo-b-math", "ریاضی");
  await teacherSubject(manager, mathTeacher, math, orgA);
  await teacherSubject(manager, physicsTeacher, physics, orgA);
  await studentSubject(manager, studentA1, biology, 420);
  await studentSubject(manager, studentA1, chemistry, 300);
  await studentSubject(manager, studentA1, math, 240);
  await studentSubject(manager, studentA3, math, 480);
  await studentSubject(manager, studentA3, physics, 360);
  await studentSubject(manager, studentB1, bMath, 300);

  const planRows: Plan[] = [];
  for (let offset = -6; offset <= 2; offset += 1) {
    planRows.push(
      await plan(
        manager,
        studentA1,
        day(offset),
        offset <= 0 ? PlanStatus.PUBLISHED : PlanStatus.DRAFT,
        [
          {
            type: TaskType.STUDY,
            title: "مطالعه مفهومی",
            subject: offset % 2 ? "شیمی" : "زیست‌شناسی",
            startTime: "08:00",
            endTime: "09:30",
            duration: 90,
            testCount: 0,
            status: offset < 0 ? "DONE" : "PLANNED",
            completedAt: offset < 0 ? at(offset, 10) : null,
          },
          {
            type: TaskType.TEST,
            title: "تست زمان‌دار",
            subject: "ریاضی",
            startTime: "17:00",
            endTime: "18:00",
            duration: 60,
            testCount: 30,
            status: offset < -2 ? "DONE" : "PLANNED",
            completedAt: offset < -2 ? at(offset, 18) : null,
          },
        ],
      ),
    );
  }
  const weakPlan = await plan(
    manager,
    studentA3,
    day(-1),
    PlanStatus.PUBLISHED,
    [
      {
        type: TaskType.STUDY,
        title: "مرور مشتق",
        subject: "ریاضی",
        startTime: "16:00",
        endTime: "17:30",
        duration: 90,
        testCount: 0,
        status: "MISSED",
        completedAt: null,
      },
    ],
  );
  const activeTask = planRows.find((item) => item.date === day(0))!.tasks[0];
  await singleton(
    manager,
    StudySession,
    {
      student: { id: studentA1.id },
      task: { id: activeTask.id },
      status: StudySessionStatus.ACTIVE,
    },
    {
      student: studentA1,
      task: activeTask,
      status: StudySessionStatus.ACTIVE,
      startedAt: new Date(now.getTime() - 1_800_000),
      lastStartedAt: new Date(now.getTime() - 1_800_000),
      lastHeartbeatAt: now,
      elapsedSeconds: 1800,
      actualTests: 0,
      difficulty: "متوسط",
      note: "جلسه فعال نمایشی",
    },
  );

  for (const [index, topic] of [
    "ژنتیک",
    "استوکیومتری",
    "تابع",
    "حرکت‌شناسی",
  ].entries())
    await singleton(
      manager,
      LearningItem,
      { student: { id: studentA1.id }, title: `مرور ${topic}` },
      {
        student: studentA1,
        subject:
          index < 2
            ? ["زیست‌شناسی", "شیمی"][index]
            : ["ریاضی", "فیزیک"][index - 2],
        book: "کتاب درسی",
        chapter: `فصل ${index + 1}`,
        lesson: "درس منتخب",
        topic,
        title: `مرور ${topic}`,
        note: "از آزمون و برنامه هفتگی",
        hint: "خلاصه‌نویسی و پنج تست",
        dueDate: day(index - 2),
        intervalDays: 3,
        reviewCount: index,
        mastery: 45 + index * 12,
        status: "pending",
        completedAt: null,
      },
    );
  for (let offset = -5; offset <= -1; offset += 1)
    await singleton(
      manager,
      DailyReport,
      { student: { id: studentA1.id }, planDate: day(offset) },
      {
        student: studentA1,
        planDate: day(offset),
        studyHours: 4.5 + (offset + 5) * 0.4,
        tests: 45 + offset * -2,
        correct: 30,
        wrong: 10,
        blank: 5,
        focus: 6 + (offset % 2),
        fatigue: 4,
        motivation: 7,
        problem: offset === -2 ? "کندی در محاسبات" : "",
        tomorrow: "ادامه طبق برنامه",
      },
    );
  await singleton(
    manager,
    RecoveryRequest,
    { student: { id: studentA3.id }, planDate: day(-1) },
    {
      student: studentA3,
      planDate: day(-1),
      reason: "بیماری و از دست رفتن برنامه",
      note: "درخواست برنامه جبرانی",
      status: RecoveryRequestStatus.PENDING,
    },
  );
  await singleton(
    manager,
    TaskIssue,
    { student: { id: studentA3.id }, task: { id: weakPlan.tasks[0].id } },
    {
      student: studentA3,
      task: weakPlan.tasks[0],
      type: "CONTENT_DIFFICULTY",
      description: "مبحث مشتق نیاز به توضیح بیشتر دارد.",
      status: "OPEN",
      advisorNote: "",
    },
  );
  await singleton(
    manager,
    Recommendation,
    { student: { id: studentA1.id }, title: "مرور ترکیبی زیست و شیمی" },
    {
      student: studentA1,
      createdByType: "ADVISOR",
      createdByUser: advisorA,
      type: "STUDY_BALANCE",
      title: "مرور ترکیبی زیست و شیمی",
      reason: "دقت شیمی در دو گزارش اخیر پایین‌تر بوده است.",
      evidence: { source: "demo", reports: 2 },
      status: RecommendationStatus.PROPOSED,
    },
  );

  const completed = await exam(
    manager,
    orgA,
    content,
    "آزمون جامع منتشرشده",
    "تجربی",
    true,
    "konkur",
    at(-8, 8),
    at(-8, 12),
    "immediate",
    true,
    [studentA1, studentA3],
    [
      ["کدام ساختار در همانندسازی نقش دارد؟", "زیست‌شناسی", "ژنتیک", "a"],
      ["عدد اکسایش را تعیین کنید.", "شیمی", "اکسایش کاهش", "b"],
      ["دامنه تابع کدام است؟", "ریاضی", "تابع", "c"],
      ["شتاب متوسط چقدر است؟", "فیزیک", "حرکت", "d"],
    ],
  );
  const upcoming = await exam(
    manager,
    orgA,
    content,
    "آزمون آزمایشی پیش رو",
    "چنددرس",
    true,
    "konkur",
    at(2, 8),
    at(2, 12),
    "scheduled",
    false,
    [studentA1, studentA2, studentA3],
    [["پرسش نمونه آینده", "زیست‌شناسی", "سلول", "a"]],
  );
  await exam(
    manager,
    orgA,
    content,
    "آزمون پیش‌نویس دبیر",
    "ریاضی",
    false,
    "standard",
    null,
    null,
    "manual",
    false,
    [studentA1],
    [["حاصل مشتق؟", "ریاضی", "مشتق", "b"]],
  );
  await exam(
    manager,
    orgB,
    teacherB,
    "آزمون مستقل سازمان ب",
    "ریاضی",
    true,
    "standard",
    at(1, 9),
    at(1, 11),
    "immediate",
    true,
    [studentB1, studentB2],
    [["پرسش سازمان ب", "ریاضی", "تابع", "c"]],
  );
  await completedAttempt(manager, completed, studentA1, 67);
  await completedAttempt(manager, completed, studentA3, 25);
  const active = await exam(
    manager,
    orgA,
    content,
    "آزمون فعال قابل ادامه",
    "زیست‌شناسی",
    true,
    "standard",
    at(0, 0),
    at(0, 23),
    "manual",
    false,
    [studentA1],
    [["سلول چیست؟", "زیست‌شناسی", "سلول", "a"]],
  );
  await activeAttempt(manager, active, studentA1);
  const retryExam = await exam(
    manager,
    orgA,
    mathTeacher,
    "آزمون ریاضی نیازمند جبران",
    "ریاضی",
    true,
    "standard",
    at(-4, 9),
    at(-4, 10),
    "immediate",
    true,
    [studentA3],
    [["معادله را حل کنید.", "ریاضی", "معادله", "a"]],
  );
  await singleton(
    manager,
    ExamRetryRequest,
    { exam: { id: retryExam.id }, student: { id: studentA3.id } },
    {
      exam: retryExam,
      student: studentA3,
      message: "قطع اینترنت هنگام آزمون",
      status: RetryRequestStatus.PENDING,
      moderatorNote: "",
      resolvedBy: null,
      resolvedAt: null,
    },
  );
  const syllabus = await singleton(
    manager,
    ExamSyllabus,
    { exam: { id: upcoming.id }, subject: "زیست‌شناسی" },
    {
      exam: upcoming,
      subject: "زیست‌شناسی",
      description: "فصل‌های یک تا سه",
      required: true,
      track: "تجربی",
    },
  );
  await singleton(
    manager,
    SyllabusProgress,
    { student: { id: studentA1.id }, syllabus: { id: syllabus.id } },
    {
      student: studentA1,
      syllabus,
      status: SyllabusProgressStatus.REVIEW,
      accuracy: 68,
      note: "فصل دوم نیاز به مرور",
    },
  );
  await quiz(manager, orgA, upcoming, "کوییز گرم‌کردن زیست");

  // A complete seven-day journey for every demo learner gives the admin and
  // student applications enough density to exercise pagination, filters,
  // completion states and the weekly planner without relying on fake counts.
  await Promise.all([
    seedWeeklyPlans(manager, studentsA, ["زیست‌شناسی", "شیمی", "ریاضی"]),
    seedWeeklyPlans(manager, studentsB, ["ریاضی", "علوم", "فارسی"]),
    seedWeeklyPlans(manager, studentsC, ["ریاضی", "مهارت مطالعه", "علوم"]),
  ]);

  const academyCohortExam = await exam(
    manager,
    orgA,
    content,
    "ارزیابی هفتگی آکادمی راه روشن",
    "چنددرس",
    true,
    "konkur",
    at(1, 8),
    at(1, 10),
    "immediate",
    true,
    studentsA.slice(0, 30),
    [["پرسش مرور هفتگی", "زیست‌شناسی", "سلول", "a"]],
  );
  const schoolCohortExam = await exam(
    manager,
    orgB,
    contentB,
    "ارزیابی کلاسی دبیرستان دانش فردا",
    "چنددرس",
    true,
    "standard",
    at(1, 9),
    at(1, 10),
    "scheduled",
    false,
    studentsB.slice(0, 32),
    [["پرسش ارزیابی کلاسی", "ریاضی", "تابع", "b"]],
  );
  const counselingCohortExam = await exam(
    manager,
    orgC,
    contentC,
    "سنجش مسیر رشد",
    "مهارت‌های پایه",
    true,
    "standard",
    at(2, 10),
    at(2, 11),
    "manual",
    false,
    studentsC.slice(0, 25),
    [["پرسش مهارت مطالعه", "مهارت مطالعه", "تمرکز", "c"]],
  );
  const academyQuiz = await quiz(
    manager,
    orgA,
    academyCohortExam,
    "کوییز مرور آکادمی",
    "زیست‌شناسی",
  );
  const schoolQuiz = await quiz(
    manager,
    orgB,
    schoolCohortExam,
    "کوییز کلاسی دانش فردا",
    "ریاضی",
  );
  const counselingQuiz = await quiz(
    manager,
    orgC,
    counselingCohortExam,
    "کوییز تمرکز مسیر رشد",
    "مهارت مطالعه",
  );
  await Promise.all([
    completedQuizAttempt(manager, academyQuiz, studentsA[4], 100),
    completedQuizAttempt(manager, schoolQuiz, studentsB[3], 0),
    completedQuizAttempt(manager, counselingQuiz, studentsC[2], 100),
  ]);

  const conversation = await directConversation(
    manager,
    advisorA,
    studentA1.user!,
    "گفتگوی آرمان و مشاور",
  );
  const firstMessage = await message(
    manager,
    conversation,
    advisorA,
    studentA1.user!,
    "آرمان جان، برنامه امروز را دیدی؟",
    null,
    false,
  );
  await message(
    manager,
    conversation,
    studentA1.user!,
    advisorA,
    "بله، از زیست شروع می‌کنم.",
    firstMessage,
    true,
  );
  await groupConversation(
    manager,
    advisorA,
    [studentA1.user!, studentA3.user!, guardian1],
    "گروه پیگیری هفته کنکور",
  );
  await singleton(
    manager,
    MessageReaction,
    {
      message: { id: firstMessage.id },
      user: { id: studentA1.user!.id },
      emoji: "👍",
    },
    { message: firstMessage, user: studentA1.user!, emoji: "👍" },
  );
  await notification(
    manager,
    studentA1.user!,
    orgA,
    "EXAM_REMINDER",
    "آزمون پیش رو",
    "آزمون جامع دو روز دیگر برگزار می‌شود.",
    false,
  );
  await notification(
    manager,
    studentA1.user!,
    orgA,
    "MESSAGE",
    "پیام تازه مشاور",
    "برنامه امروز را بررسی کن.",
    false,
  );
  await notification(
    manager,
    guardian1,
    orgA,
    "GUARDIAN_PROGRESS",
    "گزارش هفتگی آرمان",
    "پیشرفت هفتگی برای مشاهده آماده است.",
    true,
  );
  await notification(
    manager,
    orgAdminA,
    orgA,
    "SYSTEM_UPDATE",
    "نسخه نمایشی آماده است",
    "داده‌های نقش‌ها و گردش‌های اصلی برای بازبینی آماده‌اند.",
    false,
  );
  await singleton(
    manager,
    ActivityEvent,
    {
      student: { id: studentA1.id },
      type: "DEMO_PLAN_OPENED",
      resourceId: planRows[0].id,
    },
    {
      student: studentA1,
      type: "DEMO_PLAN_OPENED",
      resourceType: "plan",
      resourceId: planRows[0].id,
      data: { source: "product-demo" },
    },
  );

  return {
    organizations: 3,
    students: 300,
    activeWorkersPerOrganization: 30,
    textbooks: textbookCount,
    classes: 3,
    exams: 9,
    quizzes: 4,
    plans: 2102,
    passwordNote: "Override with DEMO_PASSWORD",
  };
}

async function seedQuestionBank(m: EntityManager, organization: Organization) {
  const repo = m.getRepository(QuestionBankItem);
  const samples = [
    { text: "کدام گزینه دربارهٔ برنامه‌ریزی هفتگی درست است؟", options: ["هدف مشخص دارد", "بدون مرور است", "فقط یک روز را پوشش می‌دهد", "نیازی به اولویت ندارد"], correctAnswer: "هدف مشخص دارد", subject: "مهارت مطالعه", topic: "برنامه‌ریزی", difficulty: "easy", tags: ["مطالعه", "برنامه"] },
    { text: "برای مرور مؤثر پس از آزمون چه کاری مناسب‌تر است؟", options: ["بررسی خطاها", "نادیده گرفتن پاسخ‌ها", "تکرار تصادفی", "حذف یادداشت‌ها"], correctAnswer: "بررسی خطاها", subject: "مهارت مطالعه", topic: "تحلیل آزمون", difficulty: "medium", tags: ["مرور", "اشتباهات"] },
  ];
  for (const sample of samples) {
    const row = await repo.findOne({ where: { text: sample.text, organization: { id: organization.id } } });
    if (!row) await repo.save(repo.create({ ...sample, explanation: "", book: "", grade: "", chapter: "", lesson: "", source: "product-demo", organization }));
  }
}

async function organization(
  m: EntityManager,
  name: string,
  type: OrganizationType,
  status: OrganizationStatus,
) {
  const r = m.getRepository(Organization);
  let x = await r.findOne({ where: { name } });
  if (!x) x = r.create({ name, type, status });
  else Object.assign(x, { type, status });
  return r.save(x);
}
async function user(
  m: EntityManager,
  username: string,
  firstName: string,
  lastName: string,
  roleValue: UserRole,
  hash: string,
  status = UserStatus.ACTIVE,
) {
  const r = m.getRepository(User);
  let x = await r.findOne({ where: { username } });
  if (!x)
    x = r.create({
      username,
      passwordHash: hash,
      role: roleValue,
      firstName,
      lastName,
      status,
      locale: "fa-IR",
      timezone: "Asia/Tehran",
    });
  else
    Object.assign(x, {
      passwordHash: hash,
      role: roleValue,
      firstName,
      lastName,
      status,
    });
  return r.save(x);
}
async function membership(
  m: EntityManager,
  u: User,
  o: Organization,
  status = MembershipStatus.ACTIVE,
) {
  const r = m.getRepository(OrganizationMembership);
  let x = await r.findOne({
    where: { user: { id: u.id }, organization: { id: o.id } },
  });
  if (!x) x = r.create({ user: u, organization: o, status });
  else x.status = status;
  return r.save(x);
}
async function role(
  m: EntityManager,
  u: User,
  code: string,
  scope: OrganizationMembership | null,
) {
  const roleRow = await m.getRepository(Role).findOneByOrFail({ code });
  const r = m.getRepository(UserRoleAssignment);
  let x = await r.findOne({
    where: {
      user: { id: u.id },
      role: { id: roleRow.id },
      ...(scope ? { membership: { id: scope.id } } : {}),
    },
  });
  return x || r.save(r.create({ user: u, role: roleRow, membership: scope }));
}
async function scopedUser(
  m: EntityManager,
  o: Organization,
  username: string,
  first: string,
  last: string,
  legacy: UserRole,
  code: string,
  hash: string,
  status = MembershipStatus.ACTIVE,
) {
  const u = await user(m, username, first, last, legacy, hash);
  const mem = await membership(m, u, o, status);
  await role(m, u, code, mem);
  return u;
}
async function studentUser(
  m: EntityManager,
  o: Organization,
  username: string,
  name: string,
  hash: string,
  gradeId: number,
  grade: string,
  trackId: string,
  major: string,
  nationalCode: string,
) {
  const u = await scopedUser(
    m,
    o,
    username,
    name.split(" ")[0],
    name.split(" ").slice(1).join(" "),
    UserRole.STUDENT,
    "STUDENT",
    hash,
  );
  const r = m.getRepository(Student);
  let s = await r.findOne({
    where: { user: { id: u.id } },
    relations: { user: true },
  });
  const educationTypeId = gradeId < 10 ? "general" : "theoretical";
  if (!s)
    s = r.create({
      user: u,
      name,
      nationalCode,
      gradeId,
      grade,
      educationTypeId,
      trackId,
      major,
      targetUniversity: "دانشگاه تهران",
      targetField:
        trackId === "experimental_sciences" ? "پزشکی" : "مهندسی کامپیوتر",
      targetRank: "زیر ۱۰۰۰",
      dailyCapacity: "۶ ساعت",
      accountStatus: "active",
    });
  else
    Object.assign(s, {
      user: u,
      name,
      nationalCode,
      gradeId,
      grade,
      educationTypeId,
      trackId,
      major,
    });
  return r.save(s);
}

type StudentSeedProfile = {
  gradeId: number;
  grade: string;
  trackId: string;
  major: string;
};

const studentProfiles: StudentSeedProfile[] = [
  { gradeId: 9, grade: "پایه نهم", trackId: "general", major: "عمومی" },
  {
    gradeId: 10,
    grade: "پایه دهم",
    trackId: "experimental_sciences",
    major: "علوم تجربی",
  },
  {
    gradeId: 10,
    grade: "پایه دهم",
    trackId: "humanities",
    major: "ادبیات و علوم انسانی",
  },
  {
    gradeId: 11,
    grade: "پایه یازدهم",
    trackId: "math_physics",
    major: "ریاضی و فیزیک",
  },
  {
    gradeId: 11,
    grade: "پایه یازدهم",
    trackId: "experimental_sciences",
    major: "علوم تجربی",
  },
  {
    gradeId: 12,
    grade: "پایه دوازدهم",
    trackId: "humanities",
    major: "ادبیات و علوم انسانی",
  },
  {
    gradeId: 12,
    grade: "پایه دوازدهم",
    trackId: "math_physics",
    major: "ریاضی و فیزیک",
  },
];

async function seedDemoClass(
  m: EntityManager,
  organization: Organization,
  code: string,
  name: string,
  gradeId: number,
  educationTypeId: string,
  trackId: string,
  advisor: User,
  teachers: User[],
  students: Student[],
) {
  const classrooms = m.getRepository(EducationClass);
  const classBooks = m.getRepository(EducationClassBook);
  const enrollments = m.getRepository(EducationClassEnrollment);
  let classroom = await classrooms.findOne({ where: { organization: { id: organization.id }, code } });
  if (!classroom) classroom = classrooms.create({ organization, code });
  Object.assign(classroom, { name, schoolYear: "1405-1406", gradeId, educationTypeId, trackId, capacity: 35, status: "ACTIVE", description: "کلاس نمونه برای سنجش پیوستگی کتاب، دبیر، مشاور و دانش‌آموز.", advisor });
  classroom = await classrooms.save(classroom);
  const books = await m.getRepository(EducationBook).find({ where: { grade: gradeId, track: trackId, state: "PUBLISHED" }, take: 2 });
  await classBooks.delete({ classroom: { id: classroom.id } });
  await enrollments.delete({ classroom: { id: classroom.id } });
  await classBooks.save(books.map((book, index) => classBooks.create({ classroom, book, teacher: teachers[index % teachers.length] })));
  await enrollments.save(students.map((student) => enrollments.create({ classroom, student })));
}

async function seedStudentPopulation(
  m: EntityManager,
  organization: Organization,
  organizationCode: string,
  hash: string,
  featured: Student[],
) {
  const students = [...featured];
  const firstNames = [
    "آوا",
    "مانی",
    "رها",
    "سامان",
    "نازنین",
    "بردیا",
    "هلیا",
    "آرین",
  ];
  const lastNames = [
    "نوری",
    "حسینی",
    "مرادی",
    "فرهادی",
    "صادقی",
    "علوی",
    "موسوی",
    "قاسمی",
  ];
  const nationalOffset = { a: 100, b: 300, c: 500 }[organizationCode] ?? 700;
  for (let index = featured.length; index < 100; index += 1) {
    const profile = studentProfiles[index % studentProfiles.length];
    const serial = index + 1;
    students.push(
      await studentUser(
        m,
        organization,
        `demo.student.${organizationCode}${serial}`,
        `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`,
        hash,
        profile.gradeId,
        profile.grade,
        profile.trackId,
        profile.major,
        String(9_100_000_000 + nationalOffset + serial),
      ),
    );
  }
  return students;
}

async function seedWorkforce(
  m: EntityManager,
  organization: Organization,
  organizationCode: string,
  hash: string,
  existingStaff: number,
) {
  const roles: Array<[UserRole, string, string]> = [
    [UserRole.ADVISOR, "ADVISOR", "مشاور"],
    [UserRole.TEACHER, "TEACHER", "دبیر"],
    [UserRole.MENTOR, "MENTOR", "مربی"],
    [UserRole.CONTENT_MANAGER, "CONTENT_MANAGER", "کارشناس محتوا"],
  ];
  for (let index = existingStaff + 1; index <= 30; index += 1) {
    const [legacyRole, code, title] = roles[(index - 1) % roles.length];
    await scopedUser(
      m,
      organization,
      `demo.staff.${organizationCode}${index}`,
      title,
      `نمایشی ${index}`,
      legacyRole,
      code,
      hash,
    );
  }
}

async function seedWeeklyPlans(
  m: EntityManager,
  students: Student[],
  subjects: string[],
) {
  for (const [studentIndex, student] of students.entries()) {
    for (let offset = -6; offset <= 0; offset += 1) {
      const subject =
        subjects[(studentIndex + offset + subjects.length) % subjects.length];
      const completed = offset < 0 && (studentIndex + offset) % 3 !== 0;
      await plan(m, student, day(offset), PlanStatus.PUBLISHED, [
        {
          type: TaskType.STUDY,
          title: "مطالعه برنامه هفتگی",
          subject,
          startTime: "08:00",
          endTime: "09:15",
          duration: 75,
          status: completed ? "DONE" : "PLANNED",
          completedAt: completed ? at(offset, 9) : null,
          actualMinutes: completed ? 70 : 0,
        },
        {
          type: TaskType.TEST,
          title: "تمرین و سنجش روزانه",
          subject,
          startTime: "17:00",
          endTime: "17:45",
          duration: 45,
          testCount: 15 + (studentIndex % 4) * 5,
          status: completed && studentIndex % 4 !== 0 ? "DONE" : "PLANNED",
          completedAt:
            completed && studentIndex % 4 !== 0 ? at(offset, 18) : null,
          actualTests: completed ? 12 : 0,
        },
      ]);
    }
  }
}
async function relationship(
  m: EntityManager,
  u: User,
  s: Student,
  o: Organization,
  type: RelationshipType,
  status: RelationshipStatus,
) {
  const r = m.getRepository(UserRelationship);
  let x = await r.findOne({
    where: {
      fromUser: { id: u.id },
      toStudent: { id: s.id },
      organization: { id: o.id },
      type,
    },
  });
  if (!x)
    x = r.create({
      fromUser: u,
      toStudent: s,
      organization: o,
      type,
      status,
      acceptedAt: status === RelationshipStatus.ACTIVE ? now : null,
      revokedAt: status === RelationshipStatus.REVOKED ? now : null,
    });
  else x.status = status;
  return r.save(x);
}
async function subject(
  m: EntityManager,
  o: Organization,
  code: string,
  name: string,
) {
  const r = m.getRepository(Subject);
  let x = await r.findOne({ where: { organization: { id: o.id }, code } });
  return x || r.save(r.create({ organization: o, code, name, active: true }));
}
async function teacherSubject(
  m: EntityManager,
  u: User,
  s: Subject,
  o: Organization,
) {
  return singleton(
    m,
    TeacherSubjectAssignment,
    {
      teacher: { id: u.id },
      subject: { id: s.id },
      organization: { id: o.id },
    },
    { teacher: u, subject: s, organization: o },
  );
}
async function studentSubject(
  m: EntityManager,
  s: Student,
  subjectRow: Subject,
  target: number,
) {
  return singleton(
    m,
    StudentSubject,
    { student: { id: s.id }, subject: { id: subjectRow.id } },
    {
      student: s,
      subject: subjectRow,
      enabled: true,
      displayName: subjectRow.name,
      weeklyTargetMinutes: target,
    },
  );
}
async function plan(
  m: EntityManager,
  s: Student,
  date: string,
  status: PlanStatus,
  tasks: Array<Partial<Task>>,
) {
  const r = m.getRepository(Plan);
  let x = await r.findOne({
    where: { student: { id: s.id }, date },
    relations: { tasks: true },
  });
  if (!x) x = await r.save(r.create({ student: s, date, status, tasks: [] }));
  x.status = status;
  const taskRepo = m.getRepository(Task);
  for (const spec of tasks) {
    let task = x.tasks?.find(
      (t) => t.title === spec.title && t.subject === spec.subject,
    );
    if (!task) task = taskRepo.create({ plan: x, ...spec } as Task);
    else Object.assign(task, spec);
    await taskRepo.save(task);
  }
  x.tasks = await taskRepo.find({ where: { plan: { id: x.id } } });
  return r.save(x);
}
async function exam(
  m: EntityManager,
  o: Organization,
  creator: User,
  title: string,
  subjectName: string,
  published: boolean,
  mode: "standard" | "konkur",
  start: Date | null,
  end: Date | null,
  resultPolicy: "immediate" | "scheduled" | "manual",
  released: boolean,
  students: Student[],
  questions: Array<[string, string, string, string]>,
) {
  const r = m.getRepository(Exam);
  let x = await r.findOne({
    where: { title, organization: { id: o.id } },
    relations: { questions: true },
  });
  if (!x)
    x = r.create({ title, organization: o, createdBy: creator, questions: [] });
  Object.assign(x, {
    subject: subjectName,
    published,
    mode,
    duration: 120,
    attemptLimit: 2,
    startTime: start,
    endTime: end,
    resultPolicy,
    resultsReleased: released,
    resultReleaseAt: resultPolicy === "scheduled" ? at(3, 12) : null,
    instructions: [
      "پاسخ‌ها خودکار ذخیره می‌شوند.",
      "پس از ثبت نهایی امکان ویرایش نیست.",
    ],
    allowBackNavigation: mode !== "konkur",
    scoring: { correct: 3, wrong: -1, unanswered: 0, negativeMarking: true },
    sections: [],
  });
  x = await r.save(x);
  const qr = m.getRepository(Question);
  for (const [text, sub, topic, correct] of questions) {
    let q = await qr.findOne({ where: { exam: { id: x.id }, text } });
    if (!q)
      q = qr.create({
        exam: x,
        text,
        options: ["گزینه یک", "گزینه دو", "گزینه سه", "گزینه چهار"],
        correctAnswer: correct,
        explanation: `پاسخ تشریحی ${topic}`,
        subject: sub,
        topic,
        sectionId: mode === "konkur" ? "booklet-1" : "",
        mediaUrl: "",
        difficulty: "medium",
        source: "بانک نمایشی",
        tags: ["demo", topic],
      });
    await qr.save(q);
  }
  const savedQuestions = await qr.find({ where: { exam: { id: x.id } } });
  if (mode === "konkur") {
    x.sections = [
      {
        id: "booklet-1",
        name: "دفترچه عمومی",
        questionIds: savedQuestions.map((q) => q.id),
        allocatedMinutes: 120,
      },
    ];
    await r.save(x);
  }
  for (const s of students)
    await singleton(
      m,
      ExamAssignment,
      { exam: { id: x.id }, student: { id: s.id } },
      { exam: x, student: s, assignedBy: creator },
    );
  return r.findOneOrFail({
    where: { id: x.id },
    relations: { questions: true },
  });
}
async function completedAttempt(
  m: EntityManager,
  e: Exam,
  s: Student,
  score: number,
) {
  const answers = e.questions.map((q, i) => ({
    questionId: q.id,
    selectedOption: i % 3 === 0 ? q.correctAnswer : "a",
    visited: true,
    revision: 1,
    clientUpdatedAt: at(-8, 10).toISOString(),
  }));
  const attempt = await singleton(
    m,
    ExamAttempt,
    { exam: { id: e.id }, student: { id: s.id } },
    {
      exam: e,
      student: s,
      score,
      answers,
      startedAt: at(-8, 8),
      finishedAt: at(-8, 11),
    },
  );
  for (const q of e.questions.filter((_, i) => i % 3 !== 0))
    await singleton(
      m,
      Mistake,
      { studentId: s.id, questionId: q.id },
      { studentId: s.id, questionId: q.id, reason: "بی‌دقتی", resolved: false },
    );
  return attempt;
}
async function activeAttempt(m: EntityManager, e: Exam, s: Student) {
  return singleton(
    m,
    ExamAttempt,
    { exam: { id: e.id }, student: { id: s.id } },
    {
      exam: e,
      student: s,
      score: 0,
      answers: e.questions.slice(0, 1).map((q) => ({
        questionId: q.id,
        selectedOption: "a",
        visited: true,
        revision: 1,
        clientUpdatedAt: now.toISOString(),
      })),
      startedAt: new Date(now.getTime() - 900000),
      finishedAt: null,
    },
  );
}
async function quiz(
  m: EntityManager,
  o: Organization,
  e: Exam,
  title: string,
  subject = "زیست‌شناسی",
) {
  const r = m.getRepository(Quiz);
  let x = await r.findOne({ where: { title, organization: { id: o.id } } });
  if (!x)
    x = await r.save(
      r.create({
        title,
        subject,
        durationMinutes: 10,
        active: true,
        exam: e,
        organization: o,
      }),
    );
  await singleton(
    m,
    QuizQuestion,
    { quiz: { id: x.id }, text: "کدام گزینه درست است؟" },
    {
      quiz: x,
      text: "کدام گزینه درست است؟",
      options: ["الف", "ب", "ج", "د"],
      correctAnswer: "a",
      explanation: "گزینه الف درست است.",
      sortOrder: 1,
    },
  );
  return r.findOneOrFail({
    where: { id: x.id },
    relations: { questions: true },
  });
}

async function completedQuizAttempt(
  m: EntityManager,
  quizRow: Quiz,
  student: Student,
  percent: number,
) {
  const question = quizRow.questions[0];
  return singleton(
    m,
    QuizAttempt,
    { quiz: { id: quizRow.id }, student: { id: student.id } },
    {
      quiz: quizRow,
      student,
      startedAt: at(-1, 15),
      submittedAt: at(-1, 15),
      answers: [
        {
          questionId: question.id,
          selectedOption: percent === 100 ? "a" : "b",
        },
      ],
      correct: percent === 100 ? 1 : 0,
      wrong: percent === 100 ? 0 : 1,
      blank: 0,
      percent,
    },
  );
}
async function directConversation(
  m: EntityManager,
  owner: User,
  other: User,
  title: string,
) {
  const r = m.getRepository(Conversation);
  let x = await r.findOne({ where: { title }, relations: { members: true } });
  if (!x)
    x = await r.save(
      r.create({
        type: ConversationType.DIRECT,
        title,
        description: "گفتگوی خصوصی عضو-محور",
        permissions: { membersCanPost: true },
        owner,
      }),
    );
  await conversationMember(m, x, owner, ConversationMemberRole.OWNER);
  await conversationMember(m, x, other, ConversationMemberRole.MEMBER);
  return x;
}
async function groupConversation(
  m: EntityManager,
  owner: User,
  users: User[],
  title: string,
) {
  const r = m.getRepository(Conversation);
  let x = await r.findOne({ where: { title } });
  if (!x)
    x = await r.save(
      r.create({
        type: ConversationType.GROUP,
        title,
        description: "گروه پیگیری آموزشی",
        permissions: { membersCanPost: true },
        owner,
      }),
    );
  await conversationMember(m, x, owner, ConversationMemberRole.OWNER);
  for (const u of users)
    await conversationMember(m, x, u, ConversationMemberRole.MEMBER);
  return x;
}
async function conversationMember(
  m: EntityManager,
  c: Conversation,
  u: User,
  memberRole: ConversationMemberRole,
) {
  return singleton(
    m,
    ConversationMember,
    { conversation: { id: c.id }, user: { id: u.id } },
    {
      conversation: c,
      user: u,
      role: memberRole,
      muted: false,
      leftAt: null,
      lastReadAt: memberRole === ConversationMemberRole.OWNER ? now : null,
    },
  );
}
async function message(
  m: EntityManager,
  c: Conversation,
  sender: User,
  receiver: User,
  content: string,
  reply: ChatMessage | null,
  read: boolean,
) {
  return singleton(
    m,
    ChatMessage,
    { conversation: { id: c.id }, sender: { id: sender.id }, content },
    {
      conversation: c,
      sender,
      receiverId: receiver.id,
      type: ChatMessageType.TEXT,
      content,
      mentions: [],
      replyTo: reply,
      readAt: read ? now : null,
    },
  );
}
async function notification(
  m: EntityManager,
  u: User,
  o: Organization,
  type: string,
  title: string,
  body: string,
  read: boolean,
) {
  return singleton(
    m,
    Notification,
    { user: { id: u.id }, dedupeKey: `demo:${u.username}:${type}:${title}` },
    {
      user: u,
      organization: o,
      type,
      title,
      body,
      category: "demo",
      url: "/",
      data: { seed: "product-demo" },
      priority: "normal",
      dedupeKey: `demo:${u.username}:${type}:${title}`,
      readAt: read ? now : null,
    },
  );
}
async function singleton<T extends object>(
  m: EntityManager,
  entity: new () => T,
  where: any,
  value: any,
): Promise<T> {
  const r = m.getRepository<T>(entity);
  const found = await r.findOne({ where });
  if (found) {
    Object.assign(found, value);
    return r.save(found);
  }
  const created = r.create(value) as T;
  return r.save(created);
}

if (require.main === module)
  seedProductDemo().catch(async (error) => {
    console.error(error);
    if (dataSource.isInitialized) await dataSource.destroy();
    process.exitCode = 1;
  });
