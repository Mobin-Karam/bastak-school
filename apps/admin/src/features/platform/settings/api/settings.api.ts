import { api } from "../../../../shared/api/api";
import type { Session } from "../model/settings.types";
import type { PasswordDraft } from "../../system/model/system.types";
export function getSessions() {
  return api.get<Session[]>("/auth/sessions");
}
export function revokeSession(id: string) {
  return api.delete(`/auth/sessions/${id}`);
}
export function changePassword(body: PasswordDraft) {
  return api.post("/auth/change-password", {
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });
}
export type AccountProfile = {
  phoneNumber: string | null;
  phoneNumberChangeAvailable: boolean;
  phoneNumberChangeUnlimited: boolean;
};
export type PhoneChangeRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedValue: string;
  reason?: string;
  reviewNote?: string;
  createdAt: string;
  user?: { id: string; username?: string; firstName?: string; lastName?: string };
};
export const getAccountProfile = () => api.get<AccountProfile>("/auth/me");
export const changeOwnPhoneNumber = (phoneNumber: string) =>
  api.post<{ phoneNumber: string; changed: boolean; requiresReviewForNextChange: boolean }>(
    "/auth/profile/phone",
    { phoneNumber },
  );
export const requestPhoneNumberChange = (body: {
  organizationId: string;
  phoneNumber: string;
  reason?: string;
}) => api.post<PhoneChangeRequest>("/auth/profile/phone-requests", body);
export const listPhoneChangeRequests = () =>
  api.get<PhoneChangeRequest[]>("/auth/phone-change-requests");
export const reviewPhoneChangeRequest = (id: string, approved: boolean, reviewNote?: string) =>
  api.post<{ id: string; status: PhoneChangeRequest["status"] }>(
    `/auth/phone-change-requests/${encodeURIComponent(id)}/${approved ? "approve" : "reject"}`,
    { reviewNote },
  );
