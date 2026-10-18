import { api } from "../../../shared/api/api";
export type PlanTemplate = {
  id: string;
  title: string;
  description: string;
  state: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  version: number;
  tags: string[];
  days: unknown[];
  updatedAt: string;
};
export const getPlanTemplates = (organizationId: string, state?: PlanTemplate["state"]) =>
  api.get<PlanTemplate[]>(
    `/plan-templates?organizationId=${encodeURIComponent(organizationId)}${state ? `&state=${state}` : ""}`,
  );
export const createPlanTemplate = (body: {
  organizationId: string;
  title: string;
  description?: string;
  tags?: string[];
  days?: unknown[];
}) => api.post<PlanTemplate>("/plan-templates", body);
export const publishPlanTemplate = (id: string) =>
  api.post<PlanTemplate>(`/plan-templates/${id}/publish`, {});
export type PlanTemplateApplyPreview = {
  template: { id: string; version: number; dayCount: number };
  targetStartDate: string;
  recipients: Array<{
    studentId: string;
    name: string;
    existingPlanCount: number;
    emptyDestinationDayCount: number;
  }>;
  summary: { targetCount: number; existingPlanCount: number; emptyDestinationDayCount: number };
};
export const previewPlanTemplateApply = (
  id: string,
  body: { targetStudentIds: string[]; targetStartDate: string },
) => api.post<PlanTemplateApplyPreview>(`/plan-templates/${id}/preview-apply`, body);
export type PlanTemplateApplyResult = {
  template: { id: string; version: number };
  created: Array<{ studentId: string; planId: string; date: string }>;
  skipped: Array<{ studentId: string; date: string; reason: "EXISTING_PLAN" }>;
};
export const applyPlanTemplate = (
  id: string,
  body: { targetStudentIds: string[]; targetStartDate: string; replaceExisting?: boolean },
) => api.post<PlanTemplateApplyResult>(`/plan-templates/${id}/apply`, body);
