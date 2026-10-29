import {
  Building2,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Coins,
  CalendarClock,
  DoorOpen,
  LayoutDashboard,
  MessageCircle,
  MessageSquareText,
  Medal,
  School,
  Settings,
  Store,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminLanguage } from "../../../../shared/ui/locale";

type NavigationItem = {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
  capability?: string;
  allOf?: readonly string[];
};
type NavigationGroup = { section: string; items: readonly NavigationItem[] };

/**
 * The dashboard is a global destination, not a member of the Home context
 * menu. Keeping it separate prevents announcements from displacing the route
 * people use to return to their work overview.
 */
const dashboardNavigationItem = {
  path: "",
  title: "داشبورد",
  description: "نمای کلی مدرسه و کارهای مرتبط با نقش شما",
  icon: LayoutDashboard,
  section: "داشبورد",
} as const;

export const educationNavigation = [
  {
    path: "schedule",
    title: "برنامه هفتگی",
    description: "کلاس‌ها و برنامه هفتگی مدرسه",
    icon: CalendarClock,
    capability: "schedule.read",
  },
  {
    path: "classes",
    title: "کلاس‌ها",
    description: "کلاس‌ها، دبیرها و فهرست طلبه‌های هر کلاس",
    icon: School,
    capability: "classes.read",
  },
  {
    path: "teachers",
    title: "دبیران",
    description: "فهرست دبیران فعال مدرسه و نقش‌های هم‌زمان آن‌ها",
    icon: UserRoundCheck,
    capability: "classes.manage",
    allOf: ["classes.read"],
  },
  {
    path: "books",
    title: "قفسه کتاب‌ها",
    description: "کتاب‌های درسی، کلاس‌های مرتبط و دبیر مسئول",
    icon: BookOpen,
  },
  {
    path: "class-groups",
    title: "گروه‌های کلاس",
    description: "تقسیم هر کلاس به چند گروه و مدیریت اعضای گروه",
    icon: UsersRound,
    capability: "class_groups.read",
  },
  {
    path: "attendance",
    title: "حضور و غیاب",
    description: "حضور کلاس، گروه کلاس و خوابگاه",
    icon: ClipboardCheck,
    capability: "attendance.read",
  },
  {
    path: "my-attendance",
    title: "حضور و غیاب من",
    description: "وضعیت‌های حضور ثبت‌شده برای حساب من",
    icon: ClipboardCheck,
    capability: "attendance.self.read",
  },
  {
    path: "leave-requests",
    title: "درخواست‌های مرخصی",
    description: "مدیریت درخواست‌های مرخصی دانش‌آموزان",
    icon: ClipboardCheck,
    capability: "leave.read",
  },
  {
    path: "exit-permissions",
    title: "خروج و بازگشت",
    description: "مجوزهای خروج، ثبت حرکت دروازه و آمار حاضرین مدرسه",
    icon: DoorOpen,
    capability: "exit.read",
  },
] as const;

export const educationCapabilities = [
  "classes.read",
  "schedule.read",
  "class_groups.read",
  "attendance.read",
  "leave.read",
  "exit.read",
] as const;

export const adminNavigation = [
  {
    section: "خانه",
    items: [
      {
        path: "announcements",
        title: "رسانه‌ها و اطلاعیه‌ها",
        description: "رسانه‌ها و پیوندهای منتشرشده برای شما",
        icon: Bell,
        capability: "announcements.read",
      },
      {
        path: "announcements/manage",
        title: "مدیریت رسانه‌ها",
        description: "انتشار رسانه برای اعضای انتخاب‌شده",
        icon: Bell,
        capability: "announcements.manage",
      },
    ],
  },
  {
    section: "آموزش",
    items: educationNavigation,
  },
  {
    section: "مدیریت",
    items: [
      {
        path: "students",
        title: "طلبه‌ها",
        description: "فهرست و پرونده طلبه‌های در دسترس شما",
        icon: UsersRound,
        capability: "students.read",
      },
      {
        path: "family",
        title: "خانه خانواده",
        description: "پیگیری اطلاعات و حضور فرزندان مرتبط",
        icon: UsersRound,
        capability: "guardian.students.read",
      },
      {
        path: "registration",
        title: "ثبت‌نام و پرونده",
        description: "تکمیل پرونده یا مدیریت مراحل ثبت‌نام مدرسه",
        icon: UserRoundCheck,
        capability: "registration.read",
      },
      {
        path: "dormitory",
        title: "خوابگاه",
        description: "اتاق‌ها، تخصیص طلبه‌ها و حضور شبانه",
        icon: Building2,
        capability: "dormitory.read",
      },
      {
        path: "rewards",
        title: "سکه‌ها",
        description: "تراکنش‌ها و موجودی سکه‌های مدرسه",
        icon: Coins,
        capability: "rewards.read",
      },
      {
        path: "permission-requests",
        title: "درخواست‌های مجوز",
        description: "درخواست‌های ورودی دانش‌آموزان را بررسی و نتیجه را ثبت کنید",
        icon: ClipboardCheck,
        capability: "permission_requests.read",
      },
      {
        path: "users",
        title: "کاربران و کارکنان",
        description: "حساب‌ها، نقش‌ها و عضویت‌های مدرسه",
        icon: UsersRound,
        capability: "users.read",
      },
      {
        path: "organizations",
        title: "مدارس / سازمان‌ها",
        description: "مدیریت مدارس و سازمان‌های پلتفرم",
        icon: Building2,
        capability: "organization.read",
      },
    ],
  },
  {
    section: "ارتباطات",
    items: [
      {
        path: "sms",
        title: "پیامک",
        description: "ارسال پیامک گروهی به کاربران و اعضای مدرسه",
        icon: MessageSquareText,
        capability: "sms.read",
      },
    ],
  },
  {
    section: "سامانه",
    items: [
      {
        path: "system",
        title: "وضعیت سامانه",
        description: "سلامت سرویس و ابزارهای مدیریتی سامانه",
        icon: Settings,
        capability: "system.manage",
      },
      {
        path: "settings",
        title: "تنظیمات حساب",
        description: "رمز، نشست‌ها و تنظیمات شخصی",
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
  title:
    (
      { خانه: "نمای کلی", آموزش: "آموزش", مدیریت: "افراد و عملیات", سامانه: "سامانه" } as Record<
        string,
        string
      >
    )[group.section] ?? group.section,
  section: group.section,
}));

const roleSectionTitles: Record<string, Partial<Record<string, string>>> = {
  PRINCIPAL: { خانه: "میز مدیریت", آموزش: "آموزش مدرسه", مدیریت: "مدیریت مدرسه" },
  DISCIPLINARIAN: { خانه: "میز ناظم", آموزش: "کلاس و حضور", مدیریت: "طلبه‌ها و خوابگاه" },
  COUNSELOR: { خانه: "میز مشاور", آموزش: "کلاس‌های مرتبط", مدیریت: "طلبه‌های من" },
  RELIGIOUS_EDUCATION_MANAGER: { خانه: "آموزش دینی", آموزش: "کلاس‌های دینی" },
  GOVERNMENT_EDUCATION_MANAGER: { خانه: "آموزش دولتی", آموزش: "کلاس‌های دولتی" },
  STUDENT_AFFAIRS_MENTOR: { خانه: "میز مربی", مدیریت: "طلبه‌های مرتبط" },
  TEACHER: { خانه: "میز استاد", آموزش: "کلاس‌ها و حضور" },
  STUDENT: { خانه: "خانه من", مدیریت: "پرونده من" },
  GUARDIAN: { خانه: "خانه اولیاء", مدیریت: "فرزند من" },
  ORGANIZATION_ADMIN: { خانه: "نمای مدرسه", آموزش: "عملیات آموزشی", مدیریت: "مدیریت مدرسه" },
  SCHOOL_ADMIN: { خانه: "نمای مدرسه", آموزش: "عملیات آموزشی", مدیریت: "مدیریت مدرسه" },
  SCHOOL_SUPERVISOR: { خانه: "میز ناظر", آموزش: "کلاس و حضور", مدیریت: "طلبه‌ها" },
  PLATFORM_ADMIN: { خانه: "نمای پلتفرم", مدیریت: "مدارس و کاربران", سامانه: "سامانه" },
};

const roleTitles: Record<string, Record<string, string>> = {
  STUDENT: { "": "خانه من", registration: "تکمیل پرونده", settings: "حساب من" },
  TEACHER: { "": "میز استاد", classes: "کلاس‌های من", attendance: "حضور و غیاب" },
  COUNSELOR: { "": "میز مشاور", students: "طلبه‌های من" },
  DISCIPLINARIAN: { "": "میز ناظم", students: "طلبه‌ها", dormitory: "خوابگاه" },
  PRINCIPAL: { "": "داشبورد مدیریت" },
  SCHOOL_ADMIN: { "": "داشبورد مدیریت" },
  SCHOOL_SUPERVISOR: { "": "میز ناظر", students: "طلبه‌ها" },
};

const registrationNavigation: readonly NavigationGroup[] = [
  {
    section: "ثبت‌نام",
    items: [
      {
        path: "registration",
        title: "ثبت‌نام و پرونده",
        description: "این بخش به‌زودی در دسترس قرار می‌گیرد",
        icon: UserRoundCheck,
        capability: "registration.read",
      },
    ],
  },
];

/** Student navigation is intentionally a small, personal product surface. */
const studentNavigation: readonly NavigationGroup[] = [
  {
    section: "برنامه من",
    items: [
      {
        path: "schedule",
        title: "برنامه هفتگی",
        description: "کلاس‌ها و استادهای هر روز هفته",
        icon: CalendarDays,
        capability: "schedule.read",
      },
    ],
  },
  {
    section: "کتابخانه",
    items: [
      {
        path: "books",
        title: "قفسه کتاب‌ها",
        description: "مرور کتاب‌های درسی مدرسه",
        icon: BookOpen,
      },
    ],
  },
  {
    section: "پروفایل",
    items: [
      {
        path: "profile",
        title: "پروفایل من",
        description: "نمای شخصی و وضعیت پیشرفت",
        icon: UserRound,
      },
    ],
  },
  {
    section: "درخواست‌های من",
    items: [
      {
        path: "student-leave",
        title: "خروج و مرخصی",
        description: "ثبت و پیگیری درخواست خروج موقت یا مرخصی",
        icon: DoorOpen,
        capability: "leave.manage",
        allOf: ["leave.read", "leave.manage"],
      },
    ],
  },
  {
    section: "پیشرفت و سکه",
    items: [
      {
        path: "my-rewards",
        title: "سکه‌های من",
        description: "موجودی و تاریخچهٔ سکه‌های مدرسه",
        icon: Coins,
        capability: "rewards.self.read",
      },
      {
        path: "achievements",
        title: "دستاوردهای من",
        description: "نشان‌ها و مسیر پیشرفت شما؛ به‌زودی",
        icon: Medal,
      },
      {
        path: "coin-shop",
        title: "بازار سکه",
        description: "آیتم‌های قابل دریافت با سکه‌های مدرسه؛ به‌زودی",
        icon: Store,
      },
    ],
  },
  ...registrationNavigation,
  {
    section: "حضور من",
    items: [
      {
        path: "my-attendance",
        title: "حضور و مسئولیت خوابگاه",
        description: "خلاصه حضور و ثبت حضور اتاق‌های واگذار شده",
        icon: ClipboardCheck,
        capability: "attendance.self.read",
      },
    ],
  },
  {
    section: "تنظیمات",
    items: [
      {
        path: "settings",
        title: "تنظیمات",
        description: "شماره همراه، گذرواژه و نشست‌ها",
        icon: Settings,
      },
    ],
  },
] as const;

/** Teachers get a deliberately small, class-first workspace on every device. */
const teacherNavigation: readonly NavigationGroup[] = [
  {
    section: "برنامه من",
    items: [
      {
        path: "schedule",
        title: "برنامه هفتگی",
        description: "کلاس‌های هفته و فهرست دانش‌آموزان هر کلاس",
        icon: CalendarDays,
        capability: "schedule.read",
      },
    ],
  },
  {
    section: "کلاس‌های من",
    items: [
      {
        path: "classes",
        title: "کلاس‌ها و کتاب‌های من",
        description: "کلاس‌ها، کتاب‌ها و فهرست دانش‌آموزان واگذارشده به شما",
        icon: School,
        capability: "classes.read",
      },
    ],
  },
  {
    section: "گفت‌وگو",
    items: [
      {
        path: "teacher-chat",
        title: "گفت‌وگو",
        description: "پیام‌رسانی مدرسه به‌زودی فعال می‌شود",
        icon: MessageCircle,
      },
    ],
  },
  {
    section: "پروفایل",
    items: [
      {
        path: "teacher-profile",
        title: "پروفایل من",
        description: "اطلاعات نمایشی حساب استاد",
        icon: UserRound,
      },
    ],
  },
  {
    section: "تنظیمات",
    items: [
      {
        path: "settings",
        title: "تنظیمات",
        description: "شماره همراه، گذرواژه و نشست‌ها",
        icon: Settings,
      },
    ],
  },
] as const;

export function navigationForCapabilities(capabilities: readonly string[], role?: string | null) {
  if (role === "STUDENT") {
    return visibleNavigation(studentNavigation, capabilities);
  }
  if (role === "TEACHER") {
    return visibleNavigation([...teacherNavigation, ...registrationNavigation], capabilities);
  }
  const titles = role ? roleTitles[role] : undefined;
  return (adminNavigation as readonly NavigationGroup[])
    .map((group) => ({
      ...group,
      items: group.items
        .filter(
          (item) =>
            (!item.capability || capabilities.includes(item.capability)) &&
            (!item.allOf || item.allOf.every((capability) => capabilities.includes(capability))),
        )
        .map((item) => (titles?.[item.path] ? { ...item, title: titles[item.path] } : item)),
    }))
    .filter((group) => group.items.length);
}

function visibleNavigation(groups: readonly NavigationGroup[], capabilities: readonly string[]) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.capability || capabilities.includes(item.capability)) &&
          (!item.allOf || item.allOf.every((capability) => capabilities.includes(capability))),
      ),
    }))
    .filter((group) => group.items.length);
}

export function mainNavigationForCapabilities(
  capabilities: readonly string[],
  role?: string | null,
) {
  const titles = role ? roleSectionTitles[role] : undefined;
  return [
    {
      ...dashboardNavigationItem,
      title: titles?.["خانه"] ?? roleTitles[role ?? ""]?.[""] ?? dashboardNavigationItem.title,
    },
    ...navigationForCapabilities(capabilities, role).map((group) => ({
      ...group.items[0],
      section: group.section,
      title:
        titles?.[group.section] ??
        mainAdminNavigation.find((item) => item.section === group.section)?.title ??
        group.section,
    })),
  ];
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

export function resolveAdminNavigation(pathname: string, role?: string | null) {
  const path = normalizeAdminPath(pathname);
  if (!path) {
    return {
      ...dashboardNavigationItem,
      title:
        roleSectionTitles[role ?? ""]?.["خانه"] ??
        roleTitles[role ?? ""]?.[""] ??
        dashboardNavigationItem.title,
    };
  }
  const personalItems = studentNavigation.flatMap((group) =>
    group.items.map((item) => ({ ...item, section: group.section })),
  );
  const teacherItems = teacherNavigation.flatMap((group) =>
    group.items.map((item) => ({ ...item, section: group.section })),
  );
  return (
    (role === "STUDENT" && personalItems.find((item) => routeMatches(item.path, path))) ||
    (role === "TEACHER" && teacherItems.find((item) => routeMatches(item.path, path))) ||
    flatAdminNavigation.find((item) => routeMatches(item.path, path)) ||
    personalItems.find((item) => routeMatches(item.path, path)) ||
    teacherItems.find((item) => routeMatches(item.path, path)) ||
    flatAdminNavigation[0]
  );
}

export function adminDestination(path: string, _section: string, _studentId = "") {
  return path ? `/admin/${path}` : "/admin";
}

export function adminBreadcrumbs(path: string, role?: string | null) {
  const current = resolveAdminNavigation(path, role);
  if (!current.path) return [{ title: "خانه", path: "" }];
  const groups =
    role === "STUDENT"
      ? studentNavigation
      : role === "TEACHER"
        ? teacherNavigation
        : adminNavigation;
  const group = groups.find((item) => item.section === current.section);
  const sectionPath = group?.items[0].path || current.path;
  if (current.path === sectionPath)
    return [
      { title: "خانه", path: "" },
      { title: current.section, path: current.path },
    ];
  return [
    { title: "خانه", path: "" },
    { title: current.section, path: sectionPath },
    { title: current.title, path: current.path },
  ];
}

const en: Record<string, string> = {
  خانه: "Home",
  آموزش: "Education",
  مدیریت: "Management",
  سامانه: "System",
  داشبورد: "Dashboard",
  "نمای کلی": "Overview",
  کلاس‌ها: "Classes",
  "گروه‌های کلاس": "Class groups",
  کتابخانه: "Library",
  "قفسه کتاب‌ها": "Book shelves",
  "کتاب‌های درسی، کلاس‌های مرتبط و دبیر مسئول":
    "Textbooks, their classes, and responsible teachers",
  "مرور کتاب‌های درسی مدرسه": "Browse the school's textbooks",
  "حضور و غیاب": "Attendance",
  طلبه‌ها: "Students",
  "ثبت‌نام و پرونده": "Registration & profile",
  "Excel طلبه‌ها": "Student Excel",
  خوابگاه: "Dormitory",
  "کاربران و کارکنان": "Users & staff",
  "مدارس / سازمان‌ها": "Schools / organizations",
  "وضعیت سامانه": "System status",
  "تنظیمات حساب": "Account settings",
  اعلان‌ها: "Notifications",
  "پیام‌ها و اطلاعیه‌های شخصی مدرسه": "Your school messages and announcements",
  "پیشرفت و سکه": "Progress & coins",
  "دستاوردهای من": "My achievements",
  "نشان‌ها و مسیر پیشرفت شما؛ به‌زودی": "Your badges and progress path; coming soon",
  "بازار سکه": "Coin shop",
  "آیتم‌های قابل دریافت با سکه‌های مدرسه؛ به‌زودی": "School-coin items; coming soon",
};

function localizeText(value: string, language: AdminLanguage) {
  return language === "en" ? (en[value] ?? value) : value;
}

export function localizedNavigationForCapabilities(
  capabilities: readonly string[],
  role: string | null | undefined,
  language: AdminLanguage,
) {
  return navigationForCapabilities(capabilities, role).map((group) => ({
    ...group,
    sectionKey: group.section,
    section: localizeText(group.section, language),
    items: group.items.map((item) => ({
      ...item,
      title: localizeText(item.title, language),
      description: localizeText(item.description, language),
    })),
  }));
}

export function localizedMainNavigationForCapabilities(
  capabilities: readonly string[],
  role: string | null | undefined,
  language: AdminLanguage,
) {
  return mainNavigationForCapabilities(capabilities, role).map((item) => ({
    ...item,
    title: localizeText(item.title, language),
  }));
}

export function localizedAdminCurrentNavigation(
  pathname: string,
  language: AdminLanguage,
  role?: string | null,
) {
  const current = resolveAdminNavigation(pathname, role);

  return {
    ...current,
    sectionKey: current.section,
    section: localizeText(current.section, language),
    title: localizeText(current.title, language),
    description: localizeText(current.description, language),
  };
}

export function localizedAdminBreadcrumbs(
  path: string,
  language: AdminLanguage,
  role?: string | null,
) {
  return adminBreadcrumbs(path, role).map((item) => ({
    ...item,
    title: localizeText(item.title, language),
  }));
}
