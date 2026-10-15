import { api } from "../../../shared/api/api";
import type {
  SmsAudienceCriteria,
  SmsAudiencePreview,
  SmsCampaignDetail,
  SmsCampaignSummary,
} from "@moshaver/api-contract";

export type Criteria = SmsAudienceCriteria;
export type Preview = SmsAudiencePreview;
export type Campaign = SmsCampaignSummary;
export const previewAudience = (criteria: Criteria) =>
  api.post<Preview>("/sms/audience/preview", criteria);
export const listCampaigns = () => api.get<Campaign[]>("/sms/campaigns");
export const getCampaign = (id: string) =>
  api.get<SmsCampaignDetail>(`/sms/campaigns/${encodeURIComponent(id)}`);
export const createCampaign = (body: {
  title: string;
  messageText: string;
  scheduledAt?: string;
  criteria: Criteria;
}) => api.post<Campaign>("/sms/campaigns", body);
export const sendCampaign = (id: string) =>
  api.post<Campaign>(`/sms/campaigns/${encodeURIComponent(id)}/send`);
export const retryCampaign = (id: string) =>
  api.post<Campaign>(`/sms/campaigns/${encodeURIComponent(id)}/retry-failed`);
export const cancelCampaign = (id: string) =>
  api.post<Campaign>(`/sms/campaigns/${encodeURIComponent(id)}/cancel`);
export const refreshCampaignStatus = (id: string) =>
  api.post<Campaign>(`/sms/campaigns/${encodeURIComponent(id)}/refresh-status`);
export type ProviderStatus = {
  enabled: boolean;
  dryRun: boolean;
  configured: boolean;
  lineNumber: string | null;
  credit: number | null;
  keyLastFour: string | null;
  updatedAt: string | null;
};
export const smsStatus = () => api.get<ProviderStatus>("/sms/provider/status");
export const configureSmsProvider = (body: {
  apiKey?: string;
  lineNumber: string;
  enabled: boolean;
  dryRun: boolean;
}) => api.post<ProviderStatus>("/sms/provider/configuration", body);
