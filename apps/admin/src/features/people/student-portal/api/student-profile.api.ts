import { api } from "../../../../shared/api/api";

export type StudentSelfProfile = {
  id: string;
  name: string;
  targetUniversity: string;
  targetField: string;
  targetRank: string;
  dailyCapacity: string;
  identity: {
    firstName: string;
    lastName: string;
    fullName: string;
    nationalCode: string | null;
    phoneNumber: string | null;
    email: string | null;
  };
};

export type UpdateStudentSelfProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  targetUniversity?: string;
  targetField?: string;
  targetRank?: string;
  dailyCapacity?: string;
};

export const getStudentSelfProfile = () => api.get<StudentSelfProfile>("/students/me/profile");
export const updateStudentSelfProfile = (body: UpdateStudentSelfProfile) =>
  api.patch<StudentSelfProfile>("/student/profile", body);
