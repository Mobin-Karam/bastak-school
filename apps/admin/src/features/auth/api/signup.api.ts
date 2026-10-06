import { api } from "../../../shared/api/api";

export type SignupOrganization = { id: string; name: string; type: string; remaining: number };
export const getStudentSignupOptions = () => api.get<{ enabled: boolean; organizations: SignupOrganization[] }>("/onboarding/student-signup-options");
export const studentSignup = (body: { organizationId: string; phoneNumber: string; password: string; firstName: string; lastName: string }) =>
  api.post<{ id: string; phoneNumber: string; name: string; registrationStatus: string }>("/onboarding/student-signup", body);
