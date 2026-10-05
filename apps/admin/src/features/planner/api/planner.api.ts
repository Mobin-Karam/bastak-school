import { api } from "../../../shared/api/api";
import type { Exam, Plan } from "../../../shared/types/domain";
import type { PlanDraft, TaskDraft, TaskFilter } from "../model/planner.types";
import { normalizePersianText } from "../../../shared/lib/utils";
import { normalizeTaskDraft } from "../lib/planner-model";
export type PlannerEducationBook = {
  id: string;
  titleFa: string;
  category?: string;
  textbookCode?: string;
};
function normalizePlannerPlan(plan: Plan): Plan {
  return {
    ...plan,
    planDate: plan.planDate || plan.date || "",
    tasks: (plan.tasks || []).map((task) => ({
      ...task,
      start: task.start || task.startTime || "",
      end: task.end || task.endTime || "",
    })),
  };
}
const normalizePlannerPlans = (plans: Plan[]) => plans.map(normalizePlannerPlan);
export function plansUrl(
  studentId: string,
  from: string,
  to: string,
  search: string,
  filter: TaskFilter,
) {
  return `/plans?studentId=${encodeURIComponent(studentId)}&from=${from}&to=${to}&search=${encodeURIComponent(normalizePersianText(search))}&status=${filter}`;
}
export const getPlans = (
  studentId: string,
  from: string,
  to: string,
  search: string,
  filter: TaskFilter,
) => api.get<Plan[]>(plansUrl(studentId, from, to, search, filter)).then(normalizePlannerPlans);
export const getPlanForDate = (studentId: string, date: string) =>
  api
    .get<Plan[]>(
      `/plans?studentId=${encodeURIComponent(studentId)}&date=${encodeURIComponent(date)}`,
    )
    .then((items) => (items[0] ? normalizePlannerPlan(items[0]) : null));
export const getPlannerExams = (studentId: string) =>
  api.get<Exam[]>(`/exams?studentId=${encodeURIComponent(studentId)}`);
export const getPlannerEducationBooks = (student: {
  gradeId?: number | null;
  educationTypeId?: string;
  trackId?: string;
}) => {
  if (!student.gradeId || !student.educationTypeId)
    return Promise.resolve<PlannerEducationBook[]>([]);
  const query = new URLSearchParams({
    grade: String(student.gradeId),
    educationTypeId: student.educationTypeId,
  });
  if (student.trackId) query.set("trackId", student.trackId);
  return api.get<PlannerEducationBook[]>(`/education-catalog/books?${query}`);
};
export const createPlan = (studentId: string, body: PlanDraft) => {
  const { published, ...plan } = body;
  return api.post<Plan>("/plans", {
    ...plan,
    studentId,
    tasks: [],
    publish: published,
  });
};
export const updatePlan = (id: string, body: Partial<PlanDraft>) => {
  const { published, ...plan } = body;
  return api.patch<Plan>(`/plans/${id}`, {
    ...plan,
    ...(published === undefined ? {} : { publish: published }),
  });
};
export const deletePlan = (id: string) => api.delete(`/plans/${id}`);
export const duplicatePlan = (id: string, planDate: string) =>
  api.post(`/plans/${id}/duplicate`, { planDate });
export const sharePlan = (id: string, targetStudentId: string, date?: string) =>
  api.post<Plan>(`/education-sharing/plans/${id}`, { targetStudentId, date });
export type PlanShareRangeRequest = {
  targetStudentIds: string[];
  sourceFrom: string;
  sourceTo: string;
  targetStartDate: string;
  conflictPolicy: "skip" | "overwrite";
};
export type PlanShareRangeResult = {
  source: { from: string; to: string; planCount: number };
  targetStartDate: string;
  targetCount: number;
  conflictPolicy: "skip" | "overwrite";
  copied: number;
  skipped: number;
};
export const sharePlanRange = (id: string, body: PlanShareRangeRequest) =>
  api.post<PlanShareRangeResult>(`/education-sharing/plans/${id}/range`, body);
export type PlanSharePreview = {
  summary: {
    targetCount: number;
    copiedPlanCount: number;
    existingPlanCount: number;
    emptyDestinationDayCount: number;
    timeConflictCount: number;
    examCollisionCount: number;
    overCapacityDayCount: number;
    proposedMinutes: number;
  };
  recipients: Array<{
    studentId: string;
    name: string;
    existingPlanCount: number;
    timeConflictCount: number;
  }>;
};
export const previewPlanRange = (id: string, body: PlanShareRangeRequest) =>
  api.post<PlanSharePreview>(`/education-sharing/plans/${id}/range/preview`, body);
export type PlanShareHistoryEntry = {
  id: string;
  actorUserId: string | null;
  organizationId: string | null;
  createdAt: string;
  metadata: {
    sourceFrom?: string;
    sourceTo?: string;
    targetStartDate?: string;
    targetStudentIds?: string[];
    copied?: number;
    skipped?: number;
    conflictPolicy?: "skip" | "overwrite";
  };
};
export const getPlanShareHistory = () =>
  api.get<PlanShareHistoryEntry[]>("/education-sharing/plan-history");
export const savePlannerTask = (planId: string, task: TaskDraft & { id?: string }) =>
  task.id
    ? api.patch<Plan>(`/tasks/${task.id}`, normalizeTaskDraft(task))
    : api.post<Plan>(`/plans/${planId}/tasks`, normalizeTaskDraft(task));
export const deletePlannerTask = (id: string) => api.delete(`/tasks/${id}`);
export const movePlannerTask = (taskId: string, planId: string, start: string, end: string) =>
  api.patch<Plan>(`/tasks/${taskId}`, { planId, start, end });
export const publishPlanRange = (studentId: string, from: string, to: string, published: boolean) =>
  api.post("/plans/publish-range", { studentId, from, to, published });
