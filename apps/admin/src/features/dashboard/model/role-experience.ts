import type { ComponentType, SVGProps } from "react";
import type { RoleCode } from "../../../shared/types/domain";
import type { AdminLanguage } from "../../../shared/ui/locale";
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  FileQuestion,
  ListChecks,
  Trophy,
  BookMarked,
  Library,
  MessageSquare,
  BarChart3,
  UserCog,
  Building2,
  UserPlus,
  Cpu,
  ShieldCheck,
  Settings,
  Home,
  Activity,
  Bell,
  ClipboardCheck,
  HeartPulse,
  Database,
  PackageOpen,
} from "lucide-react";

/** Compatible with any lucide-react icon (or any SVG component). */
export type RoleQuickActionIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

export type RoleQuickAction = {
  to: string;
  label: string;
  /** Explains the outcome before an operator leaves their current workspace. */
  description: string;
  capability?: string;
  icon?: RoleQuickActionIcon;
};

const sharedActions: Record<string, RoleQuickAction> = {
  education: {
    to: "/admin/education",
    label: "مرکز آموزش",
    description: "کلاس‌ها، درس‌ها و محتوای آموزشی را مدیریت کنید",
    capability: "exams.read",
    icon: GraduationCap,
  },
  students: {
    to: "/admin/students",
    label: "دانش‌آموزان",
    description: "دانش‌آموزان و وضعیت پشتیبانی آن‌ها را بررسی کنید",
    capability: "students.read",
    icon: Users,
  },
  planner: {
    to: "/admin/planner",
    label: "برنامه‌ها",
    description: "برنامه‌های درسی و پیگیری روزانه را مدیریت کنید",
    capability: "plans.read",
    icon: Calendar,
  },
  learning: {
    to: "/admin/learning",
    label: "یادگیری و مرور",
    description: "مسیرهای یادگیری و مرورهای دانش‌آموز را پیگیری کنید",
    capability: "learning.read",
    icon: BookOpen,
  },
  exams: {
    to: "/admin/exams",
    label: "آزمون‌ها",
    description: "آزمون‌ها، زمان‌بندی و نتایج را بررسی کنید",
    capability: "exams.read",
    icon: ListChecks,
  },
  questions: {
    to: "/admin/questions",
    label: "بانک سؤال",
    description: "سؤال‌های ارزیابی را بسازید و سازمان‌دهی کنید",
    capability: "questions.read",
    icon: FileQuestion,
  },
  quizzes: {
    to: "/admin/quizzes",
    label: "آزمونک‌ها",
    description: "آزمونک‌های کوتاه و وضعیت انتشارشان را مدیریت کنید",
    capability: "quizzes.read",
    icon: Trophy,
  },
  subjects: {
    to: "/admin/subjects",
    label: "درس‌ها",
    description: "درس‌ها و ساختار آموزشی را تنظیم کنید",
    capability: "subjects.read",
    icon: BookMarked,
  },
  resources: {
    to: "/admin/resources",
    label: "منابع آموزشی",
    description: "منابع درسی قابل استفاده در آموزش را مدیریت کنید",
    capability: "learning_resources.manage",
    icon: Library,
  },
  chat: {
    to: "/admin/communication/chat",
    label: "گفت‌وگو",
    description: "پیام‌ها و گفت‌وگوهای نیازمند پاسخ را دنبال کنید",
    capability: "chat.read",
    icon: MessageSquare,
  },
  reports: {
    to: "/admin/reports",
    label: "گزارش‌ها",
    description: "گزارش‌های دانش‌آموزان و پیگیری‌های باز را مرور کنید",
    capability: "reports.read",
    icon: BarChart3,
  },
  users: {
    to: "/admin/users",
    label: "کاربران و کارکنان",
    description: "حساب‌ها، نقش‌ها و دسترسی کارکنان را مدیریت کنید",
    capability: "users.read",
    icon: UserCog,
  },
  organizations: {
    to: "/admin/organizations",
    label: "سازمان‌ها",
    description: "سازمان‌ها و عضویت‌های فعال را مدیریت کنید",
    capability: "organization.read",
    icon: Building2,
  },
  onboarding: {
    to: "/admin/onboarding",
    label: "ورودی دانش‌آموزان",
    description: "ثبت‌نام‌ها را بررسی و به تیم آموزشی واگذار کنید",
    capability: "student_onboarding.manage",
    icon: UserPlus,
  },
  system: {
    to: "/admin/system",
    label: "مرکز عملیات",
    description: "سلامت سامانه و عملیات پلتفرم را بررسی کنید",
    capability: "system.manage",
    icon: Cpu,
  },
  audit: {
    to: "/admin/audit",
    label: "ممیزی امنیتی",
    description: "رویدادهای امنیتی و فعالیت‌های حساس را مرور کنید",
    capability: "audit.read",
    icon: ShieldCheck,
  },
  settings: {
    to: "/admin/settings",
    label: "پروفایل و حساب",
    description: "تنظیمات حساب و اعلان‌های شخصی را تغییر دهید",
    icon: Settings,
  },
  family: {
    to: "/admin/family",
    label: "خانه خانواده",
    description: "پیشرفت، برنامه و ارتباط خانوادگی را دنبال کنید",
    capability: "guardian.students.read",
    icon: Home,
  },
  live: {
    to: "/admin/communication/live",
    label: "پایش زنده",
    description: "وضعیت اتصال و فعالیت زنده دانش‌آموزان را بررسی کنید",
    capability: "student.live.read",
    icon: Activity,
  },
  notifications: {
    to: "/admin/communication/notifications",
    label: "اعلان‌ها",
    description: "اعلان‌های عملیاتی و پیام‌های سامانه را مرور کنید",
    icon: Bell,
  },
  permissionRequests: {
    to: "/admin/permission-requests",
    label: "درخواست‌های مجوز",
    description: "درخواست‌های خروج و مجوز دانش‌آموزان را بررسی کنید",
    capability: "permission_requests.read",
    icon: ClipboardCheck,
  },
  followUp: {
    to: "/admin/follow-up",
    label: "مرکز پیگیری",
    description: "درخواست‌های بازیابی و موارد نیازمند تصمیم را رسیدگی کنید",
    capability: "recovery_requests.read",
    icon: HeartPulse,
  },
  releases: {
    to: "/admin/releases",
    label: "انتشارها",
    description: "نسخه فعال و تاریخچه انتشار را بررسی کنید",
    capability: "release.read",
    icon: PackageOpen,
  },
  database: {
    to: "/admin/database",
    label: "پشتیبان و داده",
    description: "پشتیبان‌گیری و بازیابی مجاز سامانه را مدیریت کنید",
    capability: "database.read",
    icon: Database,
  },
};

const englishActionCopy: Record<string, Pick<RoleQuickAction, "label" | "description">> = {
  "/admin/education": {
    label: "Education center",
    description: "Manage classes, subjects, and learning content",
  },
  "/admin/students": { label: "Students", description: "Review students and their support status" },
  "/admin/planner": { label: "Plans", description: "Manage study plans and daily follow-up" },
  "/admin/learning": {
    label: "Learning and review",
    description: "Track learning paths and student reviews",
  },
  "/admin/exams": {
    label: "Assessments",
    description: "Review assessments, scheduling, and results",
  },
  "/admin/questions": {
    label: "Question bank",
    description: "Create and organize assessment questions",
  },
  "/admin/quizzes": {
    label: "Quizzes",
    description: "Manage short quizzes and their publication state",
  },
  "/admin/subjects": {
    label: "Subjects",
    description: "Configure subjects and the learning structure",
  },
  "/admin/resources": {
    label: "Learning resources",
    description: "Manage resources available to learning teams",
  },
  "/admin/communication/chat": {
    label: "Conversations",
    description: "Follow messages and conversations that need a reply",
  },
  "/admin/reports": { label: "Reports", description: "Review student reports and open follow-ups" },
  "/admin/users": {
    label: "Users and staff",
    description: "Manage accounts, roles, and staff access",
  },
  "/admin/organizations": {
    label: "Organizations",
    description: "Manage organizations and active memberships",
  },
  "/admin/onboarding": {
    label: "Student intake",
    description: "Review new registrations and assign the education team",
  },
  "/admin/system": {
    label: "Operations center",
    description: "Review platform health and permitted system operations",
  },
  "/admin/audit": {
    label: "Security audit",
    description: "Review security events and sensitive activity",
  },
  "/admin/settings": {
    label: "Profile and account",
    description: "Change account and notification settings",
  },
  "/admin/family": {
    label: "Family home",
    description: "Follow family progress, plans, and communication",
  },
  "/admin/communication/live": {
    label: "Live monitoring",
    description: "Review student connection status and live activity",
  },
  "/admin/communication/notifications": {
    label: "Notifications",
    description: "Review operational alerts and system messages",
  },
  "/admin/permission-requests": {
    label: "Permission requests",
    description: "Review student leave and permission requests",
  },
  "/admin/follow-up": {
    label: "Follow-up center",
    description: "Resolve recovery requests and items needing a decision",
  },
  "/admin/releases": {
    label: "Releases",
    description: "Review the active version and release history",
  },
  "/admin/database": {
    label: "Data and backups",
    description: "Manage permitted backups and controlled recovery",
  },
};

const roleActions: Partial<Record<RoleCode, RoleQuickAction[]>> = {
  GUARDIAN: [
    sharedActions.family,
    sharedActions.students,
    sharedActions.planner,
    sharedActions.reports,
    sharedActions.chat,
    sharedActions.settings,
  ],
  ADVISOR: [
    sharedActions.students,
    sharedActions.planner,
    sharedActions.learning,
    sharedActions.reports,
    sharedActions.chat,
    sharedActions.resources,
    sharedActions.live,
    sharedActions.followUp,
  ],
  TEACHER: [
    sharedActions.education,
    sharedActions.exams,
    sharedActions.questions,
    sharedActions.quizzes,
    sharedActions.subjects,
    sharedActions.students,
    sharedActions.resources,
    sharedActions.chat,
    sharedActions.live,
    sharedActions.followUp,
  ],
  MENTOR: [
    sharedActions.students,
    sharedActions.planner,
    sharedActions.reports,
    sharedActions.chat,
    sharedActions.resources,
    sharedActions.live,
    sharedActions.followUp,
  ],
  CONTENT_MANAGER: [
    sharedActions.education,
    sharedActions.resources,
    sharedActions.notifications,
    sharedActions.questions,
    sharedActions.quizzes,
    sharedActions.exams,
    sharedActions.subjects,
  ],
  ORGANIZATION_ADMIN: [
    sharedActions.education,
    sharedActions.students,
    sharedActions.permissionRequests,
    sharedActions.followUp,
    sharedActions.live,
    sharedActions.notifications,
    sharedActions.users,
    sharedActions.organizations,
    sharedActions.reports,
    sharedActions.resources,
  ],
  PLATFORM_ADMIN: [
    sharedActions.education,
    sharedActions.onboarding,
    sharedActions.users,
    sharedActions.organizations,
    sharedActions.system,
    sharedActions.audit,
    sharedActions.students,
    sharedActions.permissionRequests,
    sharedActions.followUp,
    sharedActions.live,
    sharedActions.notifications,
    sharedActions.releases,
    sharedActions.database,
  ],
};

export function quickActionsForRole(
  role: RoleCode | null | undefined,
  capabilities: readonly string[],
  language: AdminLanguage = "fa",
): RoleQuickAction[] {
  const candidates = (role && roleActions[role]) || [sharedActions.settings];
  return candidates
    .filter((action) => !action.capability || capabilities.includes(action.capability))
    .map((action) => (language === "en" ? { ...action, ...englishActionCopy[action.to] } : action));
}
