export const REGISTRATION_ROUTES = {
  DASHBOARD: "/admin/registration",
  BASIC_INFORMATION: "/admin/registration/basic-information",
  IDENTITY_INFORMATION: "/admin/registration/identity-information",
  DOCUMENTS: "/admin/registration/documents",
  CONTACT_INFORMATION: "/admin/registration/contact-information",
  FAMILY_INFORMATION: "/admin/registration/family-information",
  EDUCATIONAL_BACKGROUND: "/admin/registration/educational-background",
  HEALTH_INFORMATION: "/admin/registration/health-information",
  EXTRACURRICULAR_ACTIVITIES: "/admin/registration/extracurricular-activities",
  ACADEMIC_INTERESTS: "/admin/registration/academic-interests",
  TRANSPORTATION: "/admin/registration/transportation",
  FINANCIAL_INFORMATION: "/admin/registration/financial-information",
  CONSENT_AND_AGREEMENTS: "/admin/registration/consent-and-agreements",
  EMERGENCY_CONTACTS: "/admin/registration/emergency-contacts",
  ACADEMIC_HISTORY: "/admin/registration/academic-history",
  COMPLETION: "/admin/registration/completion",
};

export const REGISTRATION_STATUS = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
} as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUS)[keyof typeof REGISTRATION_STATUS];

export const REGISTRATION_SECTION_CODES = [
  "BASIC_INFORMATION",
  "IDENTITY_INFORMATION",
  "DOCUMENTS",
  "CONTACT_INFORMATION",
  "FAMILY_INFORMATION",
  "EDUCATIONAL_BACKGROUND",
  "HEALTH_INFORMATION",
  "EXTRACURRICULAR_ACTIVITIES",
  "ACADEMIC_INTERESTS",
  "TRANSPORTATION",
  "FINANCIAL_INFORMATION",
  "CONSENT_AND_AGREEMENTS",
  "EMERGENCY_CONTACTS",
  "ACADEMIC_HISTORY",
  "COMPLETION",
] as const;

export type RegistrationSectionCode = (typeof REGISTRATION_SECTION_CODES)[number];

export const REGISTRATION_API_ENDPOINTS = {
  SELF: "/api/v2/registration/self",
  PROFILE: "/api/v2/registration/profile",
  DOCUMENTS: "/api/v2/registration/documents",
  COMPLETE: "/api/v2/registration/complete",
  SUBMIT_SECTION: (sectionCode: string) => `/api/v2/registration/sections/${sectionCode}/submit`,
};
