import type { RoleCode } from "../types/domain";
import type { AdminLanguage } from "../ui/locale";

export const roleLabels: Record<RoleCode, string> = {
  STUDENT: "دانش‌آموز",
  GUARDIAN: "سرپرست",
  ADVISOR: "مشاور",
  TEACHER: "دبیر",
  MENTOR: "منتور",
  CONTENT_MANAGER: "مدیر محتوا",
  ORGANIZATION_ADMIN: "مدیر سازمان",
  PLATFORM_ADMIN: "مدیر پلتفرم",
};
export const rolePortalTitles: Partial<Record<RoleCode, string>> = {
  GUARDIAN: "پرتال خانواده",
  ADVISOR: "پنل مشاور",
  TEACHER: "پنل دبیر",
  MENTOR: "پنل منتور",
  CONTENT_MANAGER: "استودیوی محتوا",
  ORGANIZATION_ADMIN: "پنل مدیریت سازمان",
  PLATFORM_ADMIN: "پنل مدیریت پلتفرم",
};
const roleLabelsEn: Record<RoleCode, string> = {
  STUDENT: "Student",
  GUARDIAN: "Guardian",
  ADVISOR: "Advisor",
  TEACHER: "Teacher",
  MENTOR: "Mentor",
  CONTENT_MANAGER: "Content manager",
  ORGANIZATION_ADMIN: "Organization administrator",
  PLATFORM_ADMIN: "Platform administrator",
};
const rolePortalTitlesEn: Partial<Record<RoleCode, string>> = {
  GUARDIAN: "Family portal",
  ADVISOR: "Advisor workspace",
  TEACHER: "Teacher workspace",
  MENTOR: "Mentor workspace",
  CONTENT_MANAGER: "Content studio",
  ORGANIZATION_ADMIN: "Organization administration",
  PLATFORM_ADMIN: "Platform administration",
};
export const roleLabel = (role?: string | null, language: AdminLanguage = "fa") =>
  (language === "en" ? roleLabelsEn : roleLabels)[role as RoleCode] ||
  (language === "en" ? "Platform user" : "کاربر سامانه");
export const rolePortalTitle = (role?: string | null, language: AdminLanguage = "fa") =>
  (language === "en" ? rolePortalTitlesEn : rolePortalTitles)[role as RoleCode] ||
  (language === "en" ? "Advisor workspace" : "پرتال مشاور");
