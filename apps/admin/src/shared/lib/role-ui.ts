import type { RoleCode } from "../types/domain";
import type { AdminLanguage } from "../ui/locale";

export const roleLabels: Record<RoleCode, string> = {
  STUDENT: "دانش‌آموز / طلبه",
  GUARDIAN: "ولی / سرپرست",
  ADVISOR: "مشاور تحصیلی",
  TEACHER: "استاد / دبیر",
  MENTOR: "مربی",
  CONTENT_MANAGER: "مدیر محتوا",
  ORGANIZATION_ADMIN: "مدیر سازمان",
  PLATFORM_ADMIN: "مدیر پلتفرم",
  SCHOOL_ADMIN: "مدیریت",
  SCHOOL_SUPERVISOR: "ناظم",
  PRINCIPAL: "مدیر / مدیر مدرسه",
  DISCIPLINARIAN: "ناظم",
  RELIGIOUS_EDUCATION_MANAGER: "مسئول آموزش دینی",
  GOVERNMENT_EDUCATION_MANAGER: "مسئول آموزش دولتی",
  STUDENT_AFFAIRS_MENTOR: "مربی تربیتی",
  COUNSELOR: "مشاور",
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
  SCHOOL_ADMIN: "School administrator",
  SCHOOL_SUPERVISOR: "School supervisor",
  PRINCIPAL: "School principal",
  DISCIPLINARIAN: "Disciplinarian",
  RELIGIOUS_EDUCATION_MANAGER: "Religious education manager",
  GOVERNMENT_EDUCATION_MANAGER: "Government education manager",
  STUDENT_AFFAIRS_MENTOR: "Student affairs mentor",
  COUNSELOR: "Counselor",
};
const rolePortalTitlesEn: Partial<Record<RoleCode, string>> = {
  GUARDIAN: "Family portal",
  ADVISOR: "Advisor workspace",
  TEACHER: "Teacher workspace",
  MENTOR: "Mentor workspace",
  CONTENT_MANAGER: "Content studio",
  ORGANIZATION_ADMIN: "Organization administration",
  PLATFORM_ADMIN: "Platform administration",
  SCHOOL_ADMIN: "School administration",
  SCHOOL_SUPERVISOR: "School supervision",
};
export const roleLabel = (role?: string | null, language: AdminLanguage = "fa") =>
  (language === "en" ? roleLabelsEn : roleLabels)[role as RoleCode] ||
  (language === "en" ? "Platform user" : "کاربر سامانه");
export const rolePortalTitle = (role?: string | null, language: AdminLanguage = "fa") =>
  (language === "en" ? rolePortalTitlesEn : rolePortalTitles)[role as RoleCode] ||
  (language === "en" ? "Advisor workspace" : "پرتال مشاور");
