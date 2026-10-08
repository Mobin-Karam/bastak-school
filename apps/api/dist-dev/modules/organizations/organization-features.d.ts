export declare const ORGANIZATION_FEATURES: readonly [{
    readonly code: "PLANNER";
    readonly label: "برنامه‌ریز";
    readonly capabilities: readonly ["plans.", "tasks.", "plan_templates."];
}, {
    readonly code: "LEARNING";
    readonly label: "سیستم یادگیری";
    readonly capabilities: readonly ["learning.", "mistakes."];
}, {
    readonly code: "EXAMS";
    readonly label: "آزمون‌ها";
    readonly capabilities: readonly ["exams.", "syllabus.", "retry_requests."];
}, {
    readonly code: "QUIZZES";
    readonly label: "آزمونک‌ها";
    readonly capabilities: readonly ["quizzes.", "quiz_questions."];
}, {
    readonly code: "QUESTION_BANK";
    readonly label: "بانک سؤال";
    readonly capabilities: readonly ["questions."];
}, {
    readonly code: "SUBJECTS";
    readonly label: "درس‌ها";
    readonly capabilities: readonly ["subjects.", "studentSubjects."];
}, {
    readonly code: "EDUCATION";
    readonly label: "مرکز آموزش و کلاس‌ها";
    readonly capabilities: readonly ["education.", "classes."];
}, {
    readonly code: "RESOURCES";
    readonly label: "منابع آموزشی";
    readonly capabilities: readonly ["learning_resources."];
}, {
    readonly code: "CHAT";
    readonly label: "گفتگو";
    readonly capabilities: readonly ["chat."];
}, {
    readonly code: "REPORTS";
    readonly label: "گزارش‌ها";
    readonly capabilities: readonly ["reports."];
}, {
    readonly code: "STUDENTS";
    readonly label: "مدیریت دانش‌آموزان";
    readonly capabilities: readonly ["students.", "student."];
}, {
    readonly code: "FAMILY";
    readonly label: "خانه خانواده";
    readonly capabilities: readonly ["guardian."];
}, {
    readonly code: "ONBOARDING";
    readonly label: "ورود دانش‌آموزان";
    readonly capabilities: readonly ["student_onboarding."];
}, {
    readonly code: "ANALYTICS";
    readonly label: "تحلیل و پیشنهادها";
    readonly capabilities: readonly ["analytics.", "recommendations."];
}, {
    readonly code: "IMPORT_EXPORT";
    readonly label: "ورود و خروج داده";
    readonly capabilities: readonly ["import.", "export."];
}];
export type OrganizationFeatureCode = (typeof ORGANIZATION_FEATURES)[number]["code"];
export declare function isOrganizationFeatureCode(value: string): value is OrganizationFeatureCode;
export declare function isCapabilityEnabledForOrganization(capability: string, disabledFeatures?: readonly string[]): boolean;
