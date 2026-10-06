import {
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  LayoutDashboard,
  School,
  Settings,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { AdminLanguage } from "../../../shared/ui/locale";

export const educationNavigation = [
  {
    path: "classes",
    title: "کلاس‌ها",
    description: "کلاس‌ها، دبیرها و فهرست طلبه‌های هر کلاس",
    icon: School,
    capability: "classes.read",
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
] as const;

export const educationCapabilities = [
  "classes.read",
  "class_groups.read",
  "attendance.read",
] as const;

export const adminNavigation = [
  {
    section: "خانه",
    items: [
      {
        path: "",
        title: "داشبورد",
        description: "نمای کلی مدرسه و کارهای مرتبط با نقش شما",
        icon: LayoutDashboard,
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
        path: "registration",
        title: "ثبت‌نام و پرونده",
        description: "تکمیل پرونده یا مدیریت مراحل ثبت‌نام مدرسه",
        icon: UserRoundCheck,
        capability: "registration.read",
      },
      {
        path: "student-transfer",
        title: "Excel طلبه‌ها",
        description: "پیش‌نمایش، ورود و خروجی فهرست طلبه‌ها",
        icon: FileSpreadsheet,
        capability: "students.import",
      },
      {
        path: "dormitory",
        title: "خوابگاه",
        description: "اتاق‌ها، تخصیص طلبه‌ها و حضور شبانه",
        icon: Building2,
        capability: "dormitory.read",
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

const roleSectionTitles: Record<
  string,
  Partial<Record<(typeof adminNavigation)[number]["section"], string>>
> = {
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
  PLATFORM_ADMIN: { خانه: "نمای پلتفرم", مدیریت: "مدارس و کاربران", سامانه: "سامانه" },
};

const roleTitles: Record<string, Record<string, string>> = {
  STUDENT: { "": "خانه من", registration: "تکمیل پرونده", settings: "حساب من" },
  TEACHER: { "": "میز استاد", classes: "کلاس‌های من", attendance: "حضور و غیاب" },
  COUNSELOR: { "": "میز مشاور", students: "طلبه‌های من" },
  DISCIPLINARIAN: { "": "میز ناظم", students: "طلبه‌ها", dormitory: "خوابگاه" },
  PRINCIPAL: { "": "داشبورد مدیریت" },
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
    flatAdminNavigation.find((item) => routeMatches(item.path, path)) || flatAdminNavigation[0]
  );
}

export function adminDestination(path: string, _section: string, _studentId = "") {
  return path ? `/admin/${path}` : "/admin";
}

export function adminBreadcrumbs(path: string) {
  const current = resolveAdminNavigation(path);
  if (!current.path) return [{ title: "خانه", path: "" }];
  const group = adminNavigation.find((item) => item.section === current.section);
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
  "حضور و غیاب": "Attendance",
  طلبه‌ها: "Students",
  "ثبت‌نام و پرونده": "Registration & profile",
  "Excel طلبه‌ها": "Student Excel",
  خوابگاه: "Dormitory",
  "کاربران و کارکنان": "Users & staff",
  "مدارس / سازمان‌ها": "Schools / organizations",
  "وضعیت سامانه": "System status",
  "تنظیمات حساب": "Account settings",
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

export function localizedAdminCurrentNavigation(pathname: string, language: AdminLanguage) {
  const current = resolveAdminNavigation(pathname);

  return {
    ...current,
    sectionKey: current.section,
    section: localizeText(current.section, language),
    title: localizeText(current.title, language),
    description: localizeText(current.description, language),
  };
}

export function localizedAdminBreadcrumbs(path: string, language: AdminLanguage) {
  return adminBreadcrumbs(path).map((item) => ({
    ...item,
    title: localizeText(item.title, language),
  }));
}
