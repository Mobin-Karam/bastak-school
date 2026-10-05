import type { AdminLanguage } from "../../shared/ui/locale";

const copy = {
  fa: {
    eyebrow: "افراد و دسترسی",
    title: "ورودی دانش‌آموزان",
    description: "ثبت‌نام‌های جدید را بررسی و با تخصیص خودکار یا دستی به سازمان و مشاور متصل کنید.",
    pending: "در انتظار",
    activeOrganization: "سازمان فعال",
    advisorReady: "مشاور آماده",
    assignmentFailed: "تخصیص انجام نشد.",
    assignmentSuccess: "تخصیص با موفقیت انجام شد",
    automaticMembers: "عضویت، ارتباط مشاور و گفتگوی مستقیم نیز به‌صورت خودکار ساخته یا فعال شدند.",
    loading: "در حال دریافت صف ثبت‌نام…",
    loadFailed: "دریافت صف دانش‌آموزان انجام نشد.",
    retry: "تلاش دوباره",
    emptyTitle: "صف ورودی خالی است",
    emptyDescription: "همه دانش‌آموزان جدید تعیین تکلیف شده‌اند.",
    modeLabel: "روش تخصیص دانش‌آموز",
    auto: "تخصیص خودکار",
    autoHint: "انتخاب سازمان و مشاور با ظرفیت مناسب",
    manual: "انتخاب دستی",
    manualHint: "انتخاب دقیق سازمان و مشاور برای هر دانش‌آموز",
    unknownGrade: "پایه نامشخص",
    unknownMajor: "رشته نامشخص",
    smartReady: "انتخاب هوشمند آماده است",
    smartDescription:
      "سازمان فعال و مشاور دارای نقش معتبر با کمترین تعداد دانش‌آموز فعال انتخاب می‌شوند.",
    organization: "سازمان",
    advisor: "مشاور",
    selectOrganization: "انتخاب سازمان",
    selectAdvisor: "انتخاب مشاور",
    noAdvisor: "مشاور فعالی موجود نیست",
    directoryUnavailable:
      "فهرست سازمان یا مشاور دریافت نشد؛ دوباره تلاش کنید یا از حالت خودکار استفاده کنید.",
    autoAssign: "تخصیص خودکار و فعال‌سازی",
    confirmAssign: "تأیید انتخاب و فعال‌سازی",
  },
  en: {
    eyebrow: "People and access",
    title: "Student intake",
    description:
      "Review new registrations and connect each student to an organization and advisor automatically or manually.",
    pending: "Pending",
    activeOrganization: "Active organizations",
    advisorReady: "Available advisors",
    assignmentFailed: "Could not assign the student.",
    assignmentSuccess: "Assignment completed",
    automaticMembers:
      "Membership, advisor relationship, and direct conversation were also created or activated automatically.",
    loading: "Loading the intake queue…",
    loadFailed: "Could not load the student intake queue.",
    retry: "Try again",
    emptyTitle: "The intake queue is clear",
    emptyDescription: "Every new student has been assigned.",
    modeLabel: "Student assignment method",
    auto: "Automatic assignment",
    autoHint: "Choose the organization and advisor with suitable capacity",
    manual: "Manual assignment",
    manualHint: "Choose an exact organization and advisor for each student",
    unknownGrade: "Unknown grade",
    unknownMajor: "Unknown major",
    smartReady: "Smart selection is ready",
    smartDescription:
      "The active organization and eligible advisor with the fewest active students will be selected.",
    organization: "Organization",
    advisor: "Advisor",
    selectOrganization: "Select organization",
    selectAdvisor: "Select advisor",
    noAdvisor: "No active advisor is available",
    directoryUnavailable:
      "The organization or advisor directory could not be loaded; retry or use automatic mode.",
    autoAssign: "Assign automatically and activate",
    confirmAssign: "Confirm assignment and activate",
  },
} as const;
export function onboardingCopy(language: AdminLanguage) {
  return copy[language];
}
