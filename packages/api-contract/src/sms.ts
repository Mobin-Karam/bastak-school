export type SmsAudienceCriteria = {
  organizationId?: string;
  roleCodes?: string[];
  userIds?: string[];
  includeAll?: boolean;
};

export type SmsAudiencePreview = {
  total: number;
  roles: Array<{ role: string; count: number }>;
  users: Array<{
    userId: string;
    displayName: string;
    maskedPhoneNumber: string;
    roles: string[];
    organization: string | null;
  }>;
};

export type SmsCampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SmsCampaignSummary = {
  id: string;
  title: string;
  messageText: string;
  status: SmsCampaignStatus;
  scheduledAt: string | null;
  totalRecipients: number;
  submittedRecipients: number;
  failedRecipients: number;
  createdAt: string;
};

export type SmsCampaignRecipientDetail = {
  id: string;
  displayNameSnapshot: string;
  roleCodesSnapshot: string[];
  status: string;
  failureCode: string | null;
  failureMessage: string | null;
  submittedAt: string | null;
  deliveredAt: string | null;
};

export type SmsCampaignBatchDetail = {
  id: string;
  sequence: number;
  status: string;
  recipientCount: number;
  attemptCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type SmsCampaignDetail = SmsCampaignSummary & {
  criteria: SmsAudienceCriteria;
  provider: string;
  startedAt: string | null;
  completedAt: string | null;
  recipients: SmsCampaignRecipientDetail[];
  batches: SmsCampaignBatchDetail[];
};
