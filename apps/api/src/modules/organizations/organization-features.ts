export const ORGANIZATION_FEATURES = [
  { code: "PLANNER", label: "برنامه‌ریز", capabilities: ["plans.", "tasks.", "plan_templates."] },
  { code: "LEARNING", label: "سیستم یادگیری", capabilities: ["learning.", "mistakes."] },
  { code: "EXAMS", label: "آزمون‌ها", capabilities: ["exams.", "syllabus.", "retry_requests."] },
  { code: "QUIZZES", label: "آزمونک‌ها", capabilities: ["quizzes.", "quiz_questions."] },
  { code: "QUESTION_BANK", label: "بانک سؤال", capabilities: ["questions."] },
  { code: "SUBJECTS", label: "درس‌ها", capabilities: ["subjects.", "studentSubjects."] },
  { code: "EDUCATION", label: "مرکز آموزش و کلاس‌ها", capabilities: ["education.", "classes."] },
  { code: "RESOURCES", label: "منابع آموزشی", capabilities: ["learning_resources."] },
  { code: "CHAT", label: "گفتگو", capabilities: ["chat."] },
  { code: "REPORTS", label: "گزارش‌ها", capabilities: ["reports."] },
  { code: "STUDENTS", label: "مدیریت دانش‌آموزان", capabilities: ["students.", "student."] },
  { code: "FAMILY", label: "خانه خانواده", capabilities: ["guardian."] },
  { code: "ONBOARDING", label: "ورود دانش‌آموزان", capabilities: ["student_onboarding."] },
  { code: "ANALYTICS", label: "تحلیل و پیشنهادها", capabilities: ["analytics.", "recommendations."] },
  { code: "IMPORT_EXPORT", label: "ورود و خروج داده", capabilities: ["import.", "export."] },
] as const;

export type OrganizationFeatureCode = (typeof ORGANIZATION_FEATURES)[number]["code"];

export function isOrganizationFeatureCode(value: string): value is OrganizationFeatureCode {
  return ORGANIZATION_FEATURES.some((feature) => feature.code === value);
}

export function isCapabilityEnabledForOrganization(capability: string, disabledFeatures: readonly string[] = []) {
  const owner = ORGANIZATION_FEATURES.find((feature) =>
    feature.capabilities.some((prefix) => capability.startsWith(prefix)),
  );
  return !owner || !disabledFeatures.includes(owner.code);
}
