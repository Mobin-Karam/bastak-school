import { api } from "../../../shared/api/api";

export type RewardTransaction = {
  id: string;
  studentId: string;
  studentName: string;
  organizationId: string;
  points: number;
  reason: string;
  sourceType: string;
  sourceId: string | null;
  contextType: string | null;
  contextId: string | null;
  contextName: string | null;
  requestId: string | null;
  awardedBy: { id: string; name: string } | null;
  reversalOfId: string | null;
  createdAt: string;
};
export type RewardPage = {
  items: RewardTransaction[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

export const getMyRewardSummary = () =>
  api.get<{ studentId: string; organizationId: string; points: number }>("/rewards/me/summary");
export const getMyRewardLedger = (page = 1) =>
  api.get<RewardPage>(`/rewards/me/ledger?page=${page}`);
export const getStudentRewardSummary = (studentId: string) =>
  api.get<{ studentId: string; organizationId: string; points: number }>(
    `/rewards/students/${encodeURIComponent(studentId)}/summary`,
  );
export const getStudentRewardLedger = (studentId: string, page = 1) =>
  api.get<RewardPage>(`/rewards/students/${encodeURIComponent(studentId)}/ledger?page=${page}`);
export const getRewardTransactions = (params: { page?: number; sourceType?: string } = {}) => {
  const query = new URLSearchParams({ page: String(params.page ?? 1) });
  if (params.sourceType) query.set("sourceType", params.sourceType);
  return api.get<RewardPage>(`/rewards/transactions?${query.toString()}`);
};
export const getRecentRewardTransactions = () =>
  api.get<RewardTransaction[]>("/rewards/transactions/recent");
export const getRewardTransaction = (id: string) =>
  api.get<RewardTransaction>(`/rewards/transactions/${encodeURIComponent(id)}`);
export const reverseRewardTransaction = (id: string, body: { requestId: string; reason: string }) =>
  api.post<RewardTransaction>(`/rewards/transactions/${encodeURIComponent(id)}/reverse`, body);
export const adjustReward = (body: {
  requestId: string;
  organizationId: string;
  studentId: string;
  points: number;
  reason: string;
  contextType?: "class" | "class_group" | "dorm";
  contextId?: string;
  contextName?: string;
}) => api.post<RewardTransaction>("/rewards/adjustments", body);
