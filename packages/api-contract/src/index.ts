export const API_VERSION = "v2" as const;
export const API_BASE_PATH = "/api/v2" as const;

export const ROLE_CODES = [
  "STUDENT",
  "GUARDIAN",
  "ADVISOR",
  "TEACHER",
  "MENTOR",
  "CONTENT_MANAGER",
  "ORGANIZATION_ADMIN",
  "PLATFORM_ADMIN",
  "SCHOOL_ADMIN",
  "SCHOOL_SUPERVISOR",
  "PRINCIPAL",
  "DISCIPLINARIAN",
  "RELIGIOUS_EDUCATION_MANAGER",
  "GOVERNMENT_EDUCATION_MANAGER",
  "STUDENT_AFFAIRS_MENTOR",
  "COUNSELOR",
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const CAPABILITIES = [
  "attendance.class.manage",
  "attendance.class.read",
  "attendance.dorm.manage",
  "attendance.dorm.read",
  "attendance.group.manage",
  "attendance.group.read",
  "attendance.linked.read",
  "attendance.night.manage",
  "attendance.correct",
  "attendance.reports.read",
  "attendance.settings.manage",
  "relationships.read",
  "school.settings.manage",
  "attendance.delegate",
  "attendance.manage",
  "attendance.read",
  "attendance.review",
  "attendance.self.read",
  "classes.manage",
  "classes.read",
  "classes.roster.manage",
  "documents.manage",
  "documents.read",
  "dormitory.manage",
  "dormitory.read",
  "exit.manage",
  "exit.read",
  "leave.manage",
  "leave.read",
  "letters.manage",
  "letters.read",
  "permission_requests.create",
  "permission_requests.read",
  "permission_requests.review",
  "question_bank.manage",
  "registration.manage",
  "registration.read",
  "registration.review",
  "registration.self.read",
  "registration.self.update",
  "relationships.manage",
  "school.occupancy.read",
  "student.self.read",
  "student.self.update",
  "students.delete",
  "students.export",
  "students.import",
  "system.reset",
  "organization.read",
  "organization.manage",
  "organization.members.manage",
  "class_groups.read",
  "class_groups.manage",
  "users.read",
  "users.manage",
  "students.read",
  "students.create",
  "students.update",
  "students.archive",
  "student.profile.read",
  "student.progress.read",
  "student.analytics.read",
  "student.live.read",
  "student.activity.read",
  "student.sync.support",
  "student.quizzes.read",
  "student_onboarding.manage",
  "guardian.students.read",
  "guardian.dashboard.read",
  "guardian.progress.read",
  "guardian.schedule.read",
  "guardian.exams.read",
  "guardian.reports.read",
  "guardian.encouragement.create",
  "subjects.read",
  "subjects.manage",
  "subjects.create",
  "subjects.update",
  "subjects.archive",
  "studentSubjects.read",
  "studentSubjects.manage",
  "learning.read",
  "learning.create",
  "learning.update",
  "learning.review",
  "learning_resources.read",
  "learning_resources.manage",
  "education.share",
  "education.catalog.read",
  "education.catalog.manage",
  "education.catalog.publish",
  "education.operations.read",
  "plan_templates.read",
  "plan_templates.manage",
  "plan_templates.publish",
  "plans.read",
  "plans.create",
  "plans.update",
  "plans.publish",
  "plans.delete",
  "tasks.read",
  "tasks.create",
  "tasks.update",
  "tasks.delete",
  "exams.read",
  "exams.create",
  "exams.update",
  "exams.delete",
  "exams.assign",
  "exams.results.read",
  "questions.read",
  "questions.create",
  "questions.update",
  "questions.delete",
  "syllabus.manage",
  "retry_requests.read",
  "retry_requests.moderate",
  "quizzes.read",
  "quizzes.create",
  "quizzes.update",
  "quiz_questions.manage",
  "mistakes.read",
  "chat.read",
  "chat.send",
  "chat.group.create",
  "chat.group.manage",
  "chat.moderate",
  "reports.read",
  "reports.manage",
  "recovery_requests.read",
  "recovery_requests.manage",
  "analytics.read",
  "recommendations.read",
  "recommendations.manage",
  "import.preview",
  "import.commit",
  "export.read",
  "release.read",
  "release.manage",
  "audit.read",
  "system.manage",
  "database.read",
  "database.backup",
  "database.restore",
  "principal.permissions.manage",
  "schedule.read",
  "schedule.read.all",
  "schedule.publish",
  "schedule.create",
  "schedule.update",
  "schedule.delete",
  "schedule.archive",
  "schedule.import",
  "schedule.export",
  "prayer_times.read",
  "prayer_times.manage",
  "announcements.read",
  "announcements.manage",
  "account_change_requests.read",
  "account_change_requests.manage",
  "student.absence.create",
  "student.absence.read",
  "student.absence.manage",
  "platform.phone.self.manage",
  "sms.read",
  "sms.send",
  "sms.manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export * from "./sms";

export type ApiErrorContract = {
  ok: false;
  error: { code: string; message: string; details?: unknown | null };
};
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorContract;
export type CursorPage<T> = {
  items: T[];
  unreadCount?: number;
  hasMore: boolean;
  nextCursor: string | null;
};
export type NotificationContract = {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown> | null;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  expiresAt: string | null;
};
export type AccountContextContract = {
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    status: string;
  };
  roles: RoleCode[];
  capabilities: Capability[];
  memberships: Array<{
    id: string;
    organization: { id: string; name: string };
    status: string;
  }>;
  activeOrganization: null | { id: string; name: string };
};
export type SyncPullContract = {
  cursor: string;
  reset: boolean;
  serverTime: string;
  plans: unknown[];
  tasks: unknown[];
  studySessions: unknown[];
  exams: unknown[];
  examAttempts: unknown[];
  notifications: NotificationContract[];
  learningItems: unknown[];
  reviews: unknown[];
};

export type {
  AttendanceContext,
  PhysicalAttendanceStatus,
  AttendanceSessionStatus,
  AttendanceRosterMember,
  SavedAttendanceRecord,
  AttendanceSessionDetail,
  AttendanceSessionWrite,
  AttendanceSessionWriteResult,
  ResolveAttendanceSession,
  AttendancePolicyContract,
} from "./attendance";

export type {
  OrganizationAuthProfile,
  PublicOrganizationProfile,
} from "./organization-profile";

export type {
  ClassGroupSummary,
  ClassGroupMember,
  ClassGroupDraft,
  ClassGroupUpdate,
  ClassGroupClassOption,
  ClassGroupStudentOption,
} from "./class-groups";

export type {
  DormAttendanceDelegate,
  DormAttendanceAssignment,
  DormDelegateDraft,
  DormAttendanceWrite,
  AttendancePoolDraft,
  AttendancePool,
  StudentAttendancePool,
  StaffAttendanceSession,
  AttendanceDailyOverview,
  StaffAttendanceProfile,
  AttendanceEncouragement,
  AttendanceMissingMember,
} from "./attendance-operations";

export type * from "./timetable";

export * from "./academic-structure";
