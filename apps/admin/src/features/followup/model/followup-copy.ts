import type { AdminLanguage } from "../../../shared/ui/locale";

const copy = {
  fa: {
    eyebrow: "عملیات پشتیبانی",
    title: "مرکز پیگیری",
    description: "درخواست‌های بازیابی برنامه در تمام محدوده مجاز شما",
    loading: "در حال دریافت درخواست‌ها…",
    loadFailed: "درخواست‌های پیگیری دریافت نشد.",
    retry: "تلاش دوباره",
    empty: "درخواست بازیابی بازی وجود ندارد.",
    emptyDescription: "درخواست‌های تازه دانش‌آموزان در این بخش ظاهر می‌شوند.",
    request: "درخواست بازیابی",
    student: "دانش‌آموز",
    plan: "برنامه",
    updated: "وضعیت درخواست پیگیری به‌روزرسانی شد.",
    updateFailed: "به‌روزرسانی درخواست انجام نشد.",
    resolved: "حل شد",
    dismiss: "رد درخواست",
    fallbackTitle: "پیگیری",
  },
  en: {
    eyebrow: "Support operations",
    title: "Follow-up center",
    description: "Plan recovery requests across your permitted scope",
    loading: "Loading requests…",
    loadFailed: "Could not load follow-up requests.",
    retry: "Try again",
    empty: "There are no plan recovery requests.",
    emptyDescription: "New student requests will appear here.",
    request: "Recovery request",
    student: "Student",
    plan: "Plan",
    updated: "The follow-up request status was updated.",
    updateFailed: "Could not update the request.",
    resolved: "Resolved",
    dismiss: "Dismiss",
    fallbackTitle: "Follow-up",
  },
} as const;

export function followupCopy(language: AdminLanguage) {
  return copy[language];
}
