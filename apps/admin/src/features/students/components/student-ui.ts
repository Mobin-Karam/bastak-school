import type { Student } from "../../../shared/types/domain";
import type { AdminLanguage } from "../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";

export type StudentStatusFilter = "all" | "active" | "inactive" | "archived";
export type StudentSort = "name" | "username" | "grade" | "lastSeen" | "completeness";
export type StudentSortDirection = "asc" | "desc";
export type StudentProfileFilter = "all" | "incomplete";
export type StudentDetailTab = "overview" | "activity" | "profile" | "access" | "security";

export function getStudentStatus(student: Student): Exclude<StudentStatusFilter, "all"> {
  const status = student.accountStatus ?? student.account_status;
  if (status === "archived") return "archived";
  if (
    status === "inactive" ||
    student.active === false ||
    student.active === 0 ||
    student.account_active === false ||
    student.account_active === 0
  )
    return "inactive";
  return "active";
}

export function getStudentUsername(student: Student) {
  return student.user?.username || student.username || "";
}

export function getStudentProfileCompleteness(student: Student) {
  const values = [
    student.name,
    getStudentUsername(student),
    student.grade,
    student.major,
    student.targetField || student.target_major,
    student.targetUniversity || student.target_city,
    student.targetRank || student.rank_goal,
    student.dailyCapacity || student.daily_capacity,
  ];
  const completed = values.filter((value) => String(value ?? "").trim()).length;
  return Math.round((completed / values.length) * 100);
}

export function getMissingStudentProfileFields(student: Student, language: AdminLanguage = "fa") {
  const copy = studentCopy[language];
  const fields = [
    [copy.name, student.name],
    [copy.username, getStudentUsername(student)],
    [copy.grade, student.grade],
    [copy.track, student.major],
    [copy.targetField, student.targetField || student.target_major],
    [copy.targetUniversity, student.targetUniversity || student.target_city],
    [copy.targetRank, student.targetRank || student.rank_goal],
    [copy.dailyCapacity, student.dailyCapacity || student.daily_capacity],
  ] as const;
  return fields.filter(([, value]) => !String(value ?? "").trim()).map(([label]) => label);
}

export function formatStudentLastSeen(value?: string, language: AdminLanguage = "fa") {
  const copy =
    language === "en"
      ? {
          none: "No activity recorded",
          unknown: "Unknown time",
          now: "Just now",
          minute: "minutes ago",
          hour: "hours ago",
          day: "days ago",
        }
      : {
          none: "بدون فعالیت ثبت‌شده",
          unknown: "زمان نامشخص",
          now: "همین حالا",
          minute: "دقیقه پیش",
          hour: "ساعت پیش",
          day: "روز پیش",
        };
  const locale = language === "en" ? "en-US" : "fa-IR";
  if (!value) return copy.none;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return copy.unknown;
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMinutes < 1) return copy.now;
  if (diffMinutes < 60) return `${diffMinutes.toLocaleString(locale)} ${copy.minute}`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours.toLocaleString(locale)} ${copy.hour}`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days.toLocaleString(locale)} ${copy.day}`;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export const studentStatusCopy = {
  active: {
    label: "فعال",
    className:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  inactive: {
    label: "غیرفعال",
    className:
      "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  archived: {
    label: "بایگانی",
    className:
      "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
} as const;

export function getStudentStatusCopy(
  status: Exclude<StudentStatusFilter, "all">,
  language: AdminLanguage = "fa",
) {
  return {
    ...studentStatusCopy[status],
    label: studentCopy[language][status],
  };
}
