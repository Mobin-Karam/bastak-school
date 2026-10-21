import { api } from "../../../../shared/api/api";

// Types
export type RegistrationSection = {
  sectionCode: string;
  required: boolean;
  sortOrder: number;
  announcement: string;
  status: string;
  reviewNote: string;
  enabled?: boolean;
};
export type RegistrationSelf = {
  student: {
    id: string;
    name: string;
    nationalCode?: string | null;
    registrationStatus: string;
    organization: { id: string; name: string };
  };
  profile: Record<string, unknown> | null;
  contacts: Array<Record<string, unknown>>;
  sections: RegistrationSection[];
};

// API Functions
export const getRegistrationSelf = () => api.get<RegistrationSelf>("/registration/self");
export const updateRegistrationProfile = (body: Record<string, unknown>) =>
  api.patch<RegistrationSelf>("/registration/self/profile", body);
export const submitRegistrationSection = (
  sectionCode: string,
  status: "IN_PROGRESS" | "SUBMITTED",
) =>
  api.patch<RegistrationSelf>(`/registration/self/sections/${encodeURIComponent(sectionCode)}`, {
    status,
  });
export const getRegistrationRequirements = (organizationId: string) =>
  api.get<
    Array<
      RegistrationSection & { enabled: boolean; opensAt?: string | null; closesAt?: string | null }
    >
  >(`/registration/requirements?organizationId=${encodeURIComponent(organizationId)}`);
export const saveRegistrationRequirements = (organizationId: string, requirements: unknown[]) =>
  api.put(`/registration/requirements/${encodeURIComponent(organizationId)}`, { requirements });
export const getRegistrationStudents = (organizationId?: string) =>
  api.get<
    Array<{
      id: string;
      name: string;
      nationalCode?: string | null;
      phoneNumber?: string | null;
      registrationStatus: string;
    }>
  >(
    `/registration/students${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const reviewRegistrationSection = (studentId: string, sectionCode: string, body: any) =>
  api.patch(`/registration/sections/${studentId}/${sectionCode}/review`, body);

export const uploadStudentDocument = (studentId: string, type: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  return api.post(`/student-documents/${studentId}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// New API Functions for Registration Dashboard
export const completeRegistration = () => api.post("/registration/complete");
