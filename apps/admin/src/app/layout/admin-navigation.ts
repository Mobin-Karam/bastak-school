import {
  Activity,
  Bell,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Database,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  UsersRound,
  Building2,
  PackageOpen,
  ShieldCheck,
  ClipboardCheck,
  UserRoundCheck,
  LibraryBig,
  School,
  HeartHandshake,
} from "lucide-react";
import type { AdminLanguage } from "../../shared/ui/locale";

export const educationNavigation = [
  {
    path: "education",
    title: "مرکز آموزش",
    description: "نمای عملیاتی آزمون‌ها، سؤال‌ها، تلاش‌ها و درخواست‌های بازیابی",
    icon: GraduationCap,
    capability: "exams.read",
  },
  {
    path: "planner",
    title: "برنامه‌ریز",
    description: "مدیریت برنامه روزانه، هفتگی و وظایف دانش‌آموز",
    icon: CalendarDays,
    capability: "plans.read",
  },
  {
    path: "plan-templates",
    title: "الگوهای برنامه",
    description: "کتابخانه، انتشار و اعمال الگوهای برنامه سازمان",
    icon: CalendarDays,
    capability: "plan_templates.read",
  },
  {
    path: "learning",
    title: "سیستم یادگیری",
    description: "مدیریت مرورهای فاصله‌دار، تسلط و الگوهای خطای دانش‌آموز",
    icon: Sparkles,
    capability: "learning.read",
    aliases: ["students/:studentId/learning"],
  },
  {
    path: "exams",
    title: "آزمون‌ها",
    description: "زمان‌بندی، انتشار، تلاش مجدد، بودجه و سؤال‌ها",
    icon: BookOpenCheck,
    capability: "exams.read",
  },
  {
    path: "questions",
    title: "بانک سؤال",
    description: "ساخت، بازبینی و مرتب‌سازی سؤال‌های هر آزمون",
    icon: GraduationCap,
    capability: "questions.read",
  },
  {
    path: "quizzes",
    title: "آزمونک‌ها",
    description: "مدیریت آزمونک‌ها، سؤال‌ها و وضعیت انتشار",
    icon: BookOpenCheck,
    capability: "quizzes.read",
  },
  {
    path: "subjects",
    title: "درس‌ها",
    description: "مدیریت درس‌ها و شناسه‌های آموزشی",
    icon: BookOpen,
    capability: "subjects.read",
  },
  {
    path: "classes",
    title: "کلاس‌ها",
    description: "کلاس، کتاب‌های درسی، دبیر، مشاور و فهرست دانش‌آموزان",
    icon: School,
    capability: "classes.read",
  },
  {
    path: "resources",
    title: "منابع آموزشی",
    description: "انتشار پیوند و ویدئو برای یک یا چند دانش‌آموز",
    icon: LibraryBig,
    capability: "learning_resources.manage",
  },
] as const;

export const educationCapabilities = [
  ...new Set(educationNavigation.map((item) => item.capability)),
] as const;

export const adminNavigation = [
  {
    section: "خانه",
    items: [
      {
        path: "",
        title: "داشبورد",
        description: "نمای کلی امروز، سلامت سیستم و موارد نیازمند توجه",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    section: "آموزش",
    items: educationNavigation,
  },
  {
    section: "ارتباط",
    items: [
      {
        path: "communication",
        title: "مرکز ارتباط",
        description: "نمای عملیاتی گفتگوها، اعلان‌ها، پایش زنده و کارهای نیازمند پاسخ",
        icon: MessageSquare,
      },
      {
        path: "communication/live",
        title: "فعالیت زنده",
        description: "پایش وضعیت و فعالیت جاری همه دانش‌آموزان",
        icon: Activity,
        capability: "student.live.read",
      },
      {
        path: "communication/chat",
        title: "گفتگو",
        description: "پیام‌های مستقیم و گروهی، حضور و پیگیری گفتگوها",
        icon: MessageSquare,
        capability: "chat.read",
      },
      {
        path: "communication/notifications",
        title: "مرکز اعلان‌ها",
        description: "ارسال و پیگیری اعلان‌های دانش‌آموزان",
        icon: Bell,
      },
    ],
  },
  {
    section: "مدیریت",
    items: [
      {
        path: "management",
        title: "مرکز مدیریت",
        description: "نمای عملیاتی افراد، سازمان‌ها، دسترسی‌ها و کارهای باز",
        icon: UsersRound,
      },
      {
        path: "students",
        title: "دانش‌آموزان",
        description: "مدیریت حساب، وضعیت و دسترسی دانش‌آموزان",
        icon: UsersRound,
        capability: "students.read",
      },
      {
        path: "permission-requests",
        title: "درخواست‌های مجوز",
        description: "بررسی خروج و مجوزهای دانش‌آموزان سازمان",
        icon: ClipboardCheck,
        capability: "permission_requests.read",
      },
      {
        path: "attention",
        title: "نیازمند توجه",
        description: "صف یکپارچه کارهای عملیاتی، پیگیری‌ها و خطاهای فعال",
        icon: ShieldCheck,
      },
      {
        path: "family",
        title: "خانه خانواده",
        description: "برنامه، پیشرفت، آزمون‌ها و پیام دلگرم‌کننده فرزند",
        icon: HeartHandshake,
        capability: "guardian.students.read",
      },
      {
        path: "onboarding",
        title: "ورودی دانش‌آموزان",
        description: "اتصال ثبت‌نام‌های جدید به سازمان و مشاور",
        icon: UserRoundCheck,
        capability: "student_onboarding.manage",
      },
      {
        path: "users",
        title: "کاربران و کارکنان",
        description: "مدیریت حساب‌ها، نقش‌ها و عضویت‌های سازمان",
        icon: UsersRound,
        capability: "users.read",
      },
      {
        path: "organizations",
        title: "سازمان‌ها",
        description: "مدیریت سازمان‌ها و زمینه فعال",
        icon: Building2,
        capability: "organization.read",
      },
      {
        path: "reports",
        title: "گزارش‌ها",
        description: "گزارش عملکرد، مطالعه و روند پیشرفت دانش‌آموز",
        icon: LayoutDashboard,
        capability: "reports.read",
      },
      {
        path: "follow-up",
        title: "مرکز پیگیری",
        description: "رسیدگی به درخواست‌های بازیابی و موارد نیازمند اقدام",
        icon: ShieldCheck,
        capability: "recovery_requests.read",
      },
    ],
  },
  {
    section: "سامانه",
    items: [
      {
        path: "system",
        title: "مرکز عملیات",
        description: "سلامت سرویس و ابزارهای مجاز سامانه",
        icon: Settings,
        capability: "system.manage",
      },
      {
        path: "releases",
        title: "نسخه‌ها و انتشارها",
        description: "نسخه فعال و تاریخچه انتشار برنامه‌ها",
        icon: PackageOpen,
        capability: "release.read",
      },
      {
        path: "database",
        title: "داده و پشتیبان",
        description: "پشتیبان‌گیری و بازیابی کنترل‌شده",
        icon: Database,
        capability: "database.read",
      },
      {
        path: "audit",
        title: "ممیزی امنیتی",
        description: "رویدادهای امنیتی و عملیاتی",
        icon: ShieldCheck,
        capability: "audit.read",
      },
      {
        path: "settings",
        title: "تنظیمات حساب",
        description: "رمز، نشست‌ها، موقعیت و اتصال API",
        icon: Settings,
      },
    ],
  },
] as const;

export const flatAdminNavigation = adminNavigation.flatMap((group) =>
  group.items.map((item) => ({ ...item, section: group.section })),
);
export const mainAdminNavigation = adminNavigation.map((group) => ({
  ...group.items[0],
  title: {
    خانه: "نمای کلی",
    آموزش: "آموزش و برنامه‌ریزی",
    ارتباط: "ارتباط و پیگیری",
    مدیریت: "افراد و دسترسی",
    سامانه: "سامانه و امنیت",
  }[group.section],
  section: group.section,
}));

const roleSectionTitles: Record<
  string,
  Partial<Record<(typeof adminNavigation)[number]["section"], string>>
> = {
  GUARDIAN: {
    خانه: "خانه خانواده",
    آموزش: "برنامه فرزند",
    ارتباط: "ارتباط با تیم",
    مدیریت: "فرزند و گزارش",
    سامانه: "حساب من",
  },
  ADVISOR: {
    خانه: "میز کار مشاور",
    آموزش: "برنامه و یادگیری",
    ارتباط: "ارتباط و پیگیری",
    مدیریت: "دانش‌آموزان و گزارش",
  },
  TEACHER: {
    خانه: "میز کار دبیر",
    آموزش: "آزمون و محتوا",
    ارتباط: "کلاس و گفتگو",
    مدیریت: "دانش‌آموزان",
  },
  MENTOR: {
    خانه: "میز کار منتور",
    آموزش: "هدف و برنامه",
    ارتباط: "پیگیری و گفتگو",
    مدیریت: "روند دانش‌آموزان",
  },
  CONTENT_MANAGER: { خانه: "استودیوی محتوا", آموزش: "محتوای آموزشی", ارتباط: "هماهنگی محتوا" },
  ORGANIZATION_ADMIN: {
    خانه: "نمای سازمان",
    آموزش: "عملیات آموزشی",
    ارتباط: "ارتباطات سازمان",
    مدیریت: "اعضا و دسترسی",
  },
  PLATFORM_ADMIN: {
    خانه: "نمای پلتفرم",
    آموزش: "عملیات آموزشی",
    ارتباط: "ارتباطات",
    مدیریت: "کاربران و سازمان‌ها",
    سامانه: "سامانه و امنیت",
  },
};

export function mainNavigationForCapabilities(
  capabilities: readonly string[],
  role?: string | null,
) {
  const titles = role ? roleSectionTitles[role] : undefined;
  return navigationForCapabilities(capabilities, role).map((group) => ({
    ...group.items[0],
    section: group.section,
    title:
      titles?.[group.section] ??
      mainAdminNavigation.find((item) => item.section === group.section)?.title ??
      group.section,
  }));
}

const roleTitles: Record<string, Record<string, string>> = {
  GUARDIAN: {
    "": "خانه",
    family: "فرزندان من",
    students: "فرزندان",
    reports: "پیشرفت",
    planner: "برنامه",
    "communication/chat": "پیام‌ها",
    "communication/notifications": "اعلان‌ها",
    settings: "پروفایل",
  },
  ADVISOR: {
    "": "میز کار",
    students: "دانش‌آموزان من",
    planner: "برنامه‌ریزی",
    learning: "یادگیری و مرور",
    exams: "آزمون و درخواست‌ها",
    "communication/chat": "گفت‌وگوها",
    reports: "گزارش پیشرفت",
    resources: "منابع پیشنهادی",
  },
  TEACHER: {
    "": "میز کار دبیر",
    education: "نمای آموزش",
    students: "دانش‌آموزان / کلاس‌ها",
    exams: "آزمون‌ها",
    questions: "بانک سؤال",
    quizzes: "آزمونک‌ها",
    subjects: "درس‌های من",
    "communication/chat": "پیام‌ها",
    resources: "منابع کلاس",
  },
  MENTOR: {
    "": "میز کار منتور",
    students: "دانش‌آموزان من",
    planner: "برنامه و هدف‌ها",
    reports: "روند پیشرفت",
    "communication/chat": "گفت‌وگوها",
    resources: "منابع پیشنهادی",
  },
  CONTENT_MANAGER: {
    "": "استودیوی محتوا",
    education: "نمای محتوا",
    subjects: "درس‌ها",
    questions: "بانک سؤال",
    quizzes: "آزمونک‌ها",
    exams: "آزمون‌ها",
    resources: "کتابخانه منابع",
  },
  ORGANIZATION_ADMIN: {
    "": "داشبورد سازمان",
    education: "عملیات آموزشی",
    students: "دانش‌آموزان",
    users: "کارکنان",
    organizations: "عضویت و دسترسی",
    reports: "گزارش سازمان",
    resources: "منابع سازمان",
  },
  PLATFORM_ADMIN: {
    "": "داشبورد پلتفرم",
    education: "عملیات آموزشی",
    onboarding: "تعیین تکلیف ورودی‌ها",
    users: "همه کاربران",
    organizations: "سازمان‌ها",
    system: "مرکز عملیات",
    audit: "ممیزی امنیتی",
  },
};

export function navigationForCapabilities(capabilities: readonly string[], role?: string | null) {
  const titles = role ? roleTitles[role] : undefined;
  return adminNavigation
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !("capability" in item) || capabilities.includes(item.capability))
        .map((item) => (titles?.[item.path] ? { ...item, title: titles[item.path] } : item)),
    }))
    .filter((group) => group.items.length);
}

export function normalizeAdminPath(pathname: string) {
  return pathname
    .replace(/^https?:\/\/[^/]+/i, "")
    .split(/[?#]/)[0]
    .replace(/^\/admin\/?/, "")
    .replace(/^\/+|\/+$/g, "");
}

function routeMatches(pattern: string, path: string) {
  const expected = pattern.split("/").filter(Boolean);
  const actual = path.split("/").filter(Boolean);
  if (!expected.length) return !actual.length;
  if (actual.length < expected.length) return false;
  return expected.every((part, index) => part.startsWith(":") || part === actual[index]);
}

export function resolveAdminNavigation(pathname: string) {
  const path = normalizeAdminPath(pathname);
  return (
    flatAdminNavigation.find(
      (item) =>
        routeMatches(item.path, path) ||
        ("aliases" in item && item.aliases.some((alias) => routeMatches(alias, path))),
    ) || flatAdminNavigation[0]
  );
}

export function adminDestination(path: string, section: string, studentId = "") {
  const base = path ? `/admin/${path}` : "/admin";
  return section === "آموزش" && studentId
    ? `${base}?studentId=${encodeURIComponent(studentId)}`
    : base;
}

export function adminBreadcrumbs(path: string) {
  const current = resolveAdminNavigation(path);
  if (!current.path) return [{ title: "خانه", path: "" }];

  const group = adminNavigation.find((item) => item.section === current.section);
  const sectionPath = group?.items[0].path || current.path;

  // The first destination in a section is already its landing page. Showing
  // both the section and page as separate breadcrumb links would produce two
  // adjacent crumbs pointing to the same URL.
  if (current.path === sectionPath) {
    return [
      { title: "خانه", path: "" },
      { title: current.section, path: current.path },
    ];
  }

  return [
    { title: "خانه", path: "" },
    { title: current.section, path: sectionPath },
    { title: current.title, path: current.path },
  ];
}

const englishNavigationCopy: Record<string, string> = {
  خانه: "Home",
  آموزش: "Education",
  ارتباط: "Communication",
  مدیریت: "Management",
  سامانه: "System",
  "مرکز آموزش": "Education hub",
  برنامه‌ریز: "Planner",
  "الگوهای برنامه": "Plan templates",
  "سیستم یادگیری": "Learning system",
  آزمون‌ها: "Assessments",
  "بانک سؤال": "Question bank",
  آزمونک‌ها: "Quizzes",
  درس‌ها: "Subjects",
  کلاس‌ها: "Classes",
  "منابع آموزشی": "Learning resources",
  داشبورد: "Dashboard",
  "فعالیت زنده": "Live activity",
  گفتگو: "Conversations",
  "مرکز اعلان‌ها": "Notifications",
  "مرکز ارتباط": "Communication hub",
  دانش‌آموزان: "Students",
  "مرکز مدیریت": "Management hub",
  "درخواست‌های مجوز": "Permission requests",
  "نیازمند توجه": "Needs attention",
  "خانه خانواده": "Family hub",
  "ورودی دانش‌آموزان": "Student intake",
  "کاربران و کارکنان": "Users and staff",
  سازمان‌ها: "Organizations",
  گزارش‌ها: "Reports",
  "مرکز پیگیری": "Follow-up center",
  "مرکز عملیات": "Operations center",
  "نسخه‌ها و انتشارها": "Releases",
  "داده و پشتیبان": "Data and backup",
  "ممیزی امنیتی": "Security audit",
  "تنظیمات حساب": "Account settings",
  "نمای کلی": "Overview",
  "آموزش و برنامه‌ریزی": "Education and planning",
  "ارتباط و پیگیری": "Communication and follow-up",
  "افراد و دسترسی": "People and access",
  "سامانه و امنیت": "System and security",
  "نمای پلتفرم": "Platform overview",
  "عملیات آموزشی": "Education operations",
  ارتباطات: "Communications",
  "کاربران و سازمان‌ها": "Users and organizations",
  "میز کار مشاور": "Advisor workspace",
  "برنامه و یادگیری": "Plans and learning",
  "دانش‌آموزان و گزارش": "Students and reports",
  "میز کار دبیر": "Teacher workspace",
  "آزمون و محتوا": "Assessments and content",
  "کلاس و گفتگو": "Classes and conversations",
  "میز کار منتور": "Mentor workspace",
  "هدف و برنامه": "Goals and plans",
  "پیگیری و گفتگو": "Follow-up and conversations",
  "استودیوی محتوا": "Content studio",
  "محتوای آموزشی": "Education content",
  "هماهنگی محتوا": "Content coordination",
  "نمای سازمان": "Organization overview",
  "اعضا و دسترسی": "Members and access",
  "داشبورد سازمان": "Organization dashboard",
  "تعیین تکلیف ورودی‌ها": "Assign incoming students",
  "همه کاربران": "All users",
  "میز کار": "Workspace",
  "فرزندان من": "My children",
  فرزندان: "Children",
  پیشرفت: "Progress",
  برنامه: "Plan",
  پیام‌ها: "Messages",
  اعلان‌ها: "Notifications",
  پروفایل: "Profile",
  "دانش‌آموزان من": "My students",
  برنامه‌ریزی: "Planning",
  "یادگیری و مرور": "Learning and review",
  "آزمون و درخواست‌ها": "Assessments and requests",
  گفت‌وگوها: "Conversations",
  "گزارش پیشرفت": "Progress report",
  "منابع پیشنهادی": "Recommended resources",
  "نمای آموزش": "Education overview",
  "دانش‌آموزان / کلاس‌ها": "Students / classes",
  "درس‌های من": "My subjects",
  "منابع کلاس": "Class resources",
  "برنامه و هدف‌ها": "Plans and goals",
  "روند پیشرفت": "Progress trends",
  "نمای محتوا": "Content overview",
  "کتابخانه منابع": "Resource library",
  کارکنان: "Staff",
  "گزارش سازمان": "Organization report",
};

const englishNavigationDescriptions: Record<string, string> = {
  "نمای کلی امروز، سلامت سیستم و موارد نیازمند توجه":
    "Today's overview, system health, and items that need attention",
  "نمای عملیاتی آزمون‌ها، سؤال‌ها، تلاش‌ها و درخواست‌های بازیابی":
    "Operational view of assessments, questions, attempts, and recovery requests",
  "مدیریت برنامه روزانه، هفتگی و وظایف دانش‌آموز":
    "Manage daily and weekly plans and student tasks",
  "کتابخانه، انتشار و اعمال الگوهای برنامه سازمان":
    "Library, publishing, and applying organization plan templates",
  "مدیریت مرورهای فاصله‌دار، تسلط و الگوهای خطای دانش‌آموز":
    "Manage spaced review, mastery, and student error patterns",
  "زمان‌بندی، انتشار، تلاش مجدد، بودجه و سؤال‌ها":
    "Scheduling, publishing, retries, budgets, and questions",
  "ساخت، بازبینی و مرتب‌سازی سؤال‌های هر آزمون":
    "Create, review, and organize questions for each assessment",
  "مدیریت آزمونک‌ها، سؤال‌ها و وضعیت انتشار": "Manage quizzes, questions, and publishing status",
  "مدیریت درس‌ها و شناسه‌های آموزشی": "Manage subjects and education identifiers",
  "کلاس، کتاب‌های درسی، دبیر، مشاور و فهرست دانش‌آموزان":
    "Classes, textbooks, teachers, advisors, and student rosters",
  "انتشار پیوند و ویدئو برای یک یا چند دانش‌آموز":
    "Publish links and videos for one or more students",
  "پایش وضعیت و فعالیت جاری همه دانش‌آموزان": "Monitor every student's current status and activity",
  "پیام‌های مستقیم و گروهی، حضور و پیگیری گفتگوها":
    "Direct and group messages, presence, and conversation follow-up",
  "ارسال و پیگیری اعلان‌های دانش‌آموزان": "Send and track student notifications",
  "نمای عملیاتی گفتگوها، اعلان‌ها، پایش زنده و کارهای نیازمند پاسخ":
    "Operational view of conversations, notifications, live monitoring, and work needing a response",
  "مدیریت حساب، وضعیت و دسترسی دانش‌آموزان": "Manage student accounts, status, and access",
  "نمای عملیاتی افراد، سازمان‌ها، دسترسی‌ها و کارهای باز":
    "Operational view of people, organizations, access, and open work",
  "بررسی خروج و مجوزهای دانش‌آموزان سازمان":
    "Review organization student leave and permission requests",
  "صف یکپارچه کارهای عملیاتی، پیگیری‌ها و خطاهای فعال":
    "Unified queue for operational work, follow-ups, and active errors",
  "برنامه، پیشرفت، آزمون‌ها و پیام دلگرم‌کننده فرزند":
    "A child's plan, progress, assessments, and encouraging messages",
  "اتصال ثبت‌نام‌های جدید به سازمان و مشاور":
    "Connect new registrations to an organization and advisor",
  "مدیریت حساب‌ها، نقش‌ها و عضویت‌های سازمان":
    "Manage accounts, roles, and organization memberships",
  "مدیریت سازمان‌ها و زمینه فعال": "Manage organizations and the active context",
  "گزارش عملکرد، مطالعه و روند پیشرفت دانش‌آموز":
    "Performance, study, and student progress reports",
  "رسیدگی به درخواست‌های بازیابی و موارد نیازمند اقدام":
    "Handle recovery requests and items requiring action",
  "سلامت سرویس و ابزارهای مجاز سامانه": "Service health and permitted system tools",
  "نسخه فعال و تاریخچه انتشار برنامه‌ها": "Active version and release history",
  "پشتیبان‌گیری و بازیابی کنترل‌شده": "Backup and controlled recovery",
  "رویدادهای امنیتی و عملیاتی": "Security and operational events",
  "رمز، نشست‌ها، موقعیت و اتصال API": "Password, sessions, location, and API connection",
};

function translatedAdminText(text: string, language: AdminLanguage) {
  if (language === "fa") return text;
  return englishNavigationCopy[text] ?? englishNavigationDescriptions[text] ?? text;
}

function localizeNavigationItem<T extends { title: string; description?: string }>(
  item: T,
  language: AdminLanguage,
) {
  return {
    ...item,
    title: translatedAdminText(item.title, language),
    ...(item.description ? { description: translatedAdminText(item.description, language) } : {}),
  };
}

export function localizedNavigationForCapabilities(
  capabilities: readonly string[],
  role: string | null | undefined,
  language: AdminLanguage,
) {
  return navigationForCapabilities(capabilities, role).map((group) => ({
    ...group,
    sectionKey: group.section,
    section: translatedAdminText(group.section, language),
    items: group.items.map((item) => localizeNavigationItem(item, language)),
  }));
}

export function localizedMainNavigationForCapabilities(
  capabilities: readonly string[],
  role: string | null | undefined,
  language: AdminLanguage,
) {
  return mainNavigationForCapabilities(capabilities, role).map((item) =>
    localizeNavigationItem(item, language),
  );
}

export function localizedAdminCurrentNavigation(pathname: string, language: AdminLanguage) {
  const current = resolveAdminNavigation(pathname);
  return {
    ...localizeNavigationItem(current, language),
    section: translatedAdminText(current.section, language),
  };
}

export function localizedAdminBreadcrumbs(path: string, language: AdminLanguage) {
  return adminBreadcrumbs(path).map((item) => ({
    ...item,
    title: translatedAdminText(item.title, language),
  }));
}
