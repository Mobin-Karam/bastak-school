import type { AdminLanguage } from "../../../shared/ui/locale";

type GuardianCopy = {
  loadingFamily: string;
  studentsLoadFailed: string;
  retry: string;
  noActiveStudent: string;
  noActiveStudentDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  selectStudent: string;
  detailLoadFailed: string;
  reload: string;
  loadingStudentView: string;
  weeklyProgress: string;
  percent: string;
  completedActivity: string;
  of: string;
  weeklyStudy: string;
  minute: string;
  upcomingExams: string;
  upcomingSchedule: string;
  noUpcomingSchedule: string;
  examsAndReports: string;
  untitledExam: string;
  dailyReports: (count: number) => string;
  relatedResources: string;
  guardianAccess: string;
  accountResources: string;
  noResources: string;
  encouragement: string;
  encouragementMessage: string;
  sendToStudent: string;
  encouragementSent: string;
  encouragementFailed: string;
};

export const guardianCopy: Record<AdminLanguage, GuardianCopy> = {
  fa: {
    loadingFamily: "در حال دریافت اطلاعات خانواده…",
    studentsLoadFailed: "اطلاعات فرزندان دریافت نشد.",
    retry: "تلاش دوباره",
    noActiveStudent: "فرزند فعالی به حساب شما متصل نیست.",
    noActiveStudentDescription: "مدیر سازمان باید رابطه سرپرستی را فعال کند.",
    eyebrow: "خانه خانواده",
    title: "پیگیری برنامه و پیشرفت فرزند",
    description: "برنامه، پیشرفت، آزمون‌ها و منابع آموزشی فرزند را در یک نمای عملیاتی دنبال کنید.",
    selectStudent: "انتخاب فرزند",
    detailLoadFailed: "بخشی از اطلاعات دریافت نشد.",
    reload: "دریافت دوباره",
    loadingStudentView: "در حال آماده‌سازی نمای فرزند…",
    weeklyProgress: "پیشرفت هفتگی",
    percent: "٪",
    completedActivity: "فعالیت تکمیل‌شده",
    of: "از",
    weeklyStudy: "مطالعه هفتگی",
    minute: "دقیقه",
    upcomingExams: "آزمون‌های پیش رو",
    upcomingSchedule: "برنامه آینده",
    noUpcomingSchedule: "برنامه آینده‌ای ثبت نشده است.",
    examsAndReports: "آزمون‌ها و گزارش‌ها",
    untitledExam: "آزمون",
    dailyReports: (count) => `${count.toLocaleString("fa-IR")} گزارش روزانه در دسترس است.`,
    relatedResources: "منابع آموزشی مرتبط",
    guardianAccess: "دسترسی از رابطه فعال سرپرستی",
    accountResources: "منابع قابل مشاهده در حساب شما",
    noResources: "منبع آموزشی تخصیص‌یافته‌ای وجود ندارد.",
    encouragement: "پیام دلگرم‌کننده",
    encouragementMessage: "متن پیام",
    sendToStudent: "ارسال برای فرزند",
    encouragementSent: "پیام دلگرم‌کننده برای دانش‌آموز فرستاده شد.",
    encouragementFailed: "ارسال پیام دلگرم‌کننده انجام نشد.",
  },
  en: {
    loadingFamily: "Loading family information…",
    studentsLoadFailed: "Couldn’t load the children linked to this account.",
    retry: "Try again",
    noActiveStudent: "There is no active child linked to this account.",
    noActiveStudentDescription:
      "An organization administrator needs to activate the guardian relationship.",
    eyebrow: "Family home",
    title: "Follow a child’s plan and progress",
    description:
      "Track your child’s plan, progress, exams, and learning resources in one operational view.",
    selectStudent: "Select child",
    detailLoadFailed: "Some information couldn’t be loaded.",
    reload: "Reload",
    loadingStudentView: "Preparing the child view…",
    weeklyProgress: "Weekly progress",
    percent: "%",
    completedActivity: "Completed activity",
    of: "of",
    weeklyStudy: "Weekly study",
    minute: "minutes",
    upcomingExams: "Upcoming exams",
    upcomingSchedule: "Upcoming schedule",
    noUpcomingSchedule: "There is no upcoming schedule.",
    examsAndReports: "Exams and reports",
    untitledExam: "Exam",
    dailyReports: (count) => `${count.toLocaleString("en-US")} daily reports available.`,
    relatedResources: "Related learning resources",
    guardianAccess: "Access comes from an active guardian relationship.",
    accountResources: "Resources visible to this account.",
    noResources: "There are no assigned learning resources.",
    encouragement: "Encouragement message",
    encouragementMessage: "Message",
    sendToStudent: "Send to child",
    encouragementSent: "The encouragement message was sent to the student.",
    encouragementFailed: "Couldn’t send the encouragement message.",
  },
};
