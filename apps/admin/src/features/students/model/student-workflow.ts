export type StudentWorkflowAction = {
  id: "planner" | "learning" | "reports" | "exams";
  destination: string;
};

type WorkflowDefinition = Pick<StudentWorkflowAction, "id"> & {
  capability: string;
  path: string;
};

/**
 * The student directory is the hand-off point for operational work. Keep the
 * links here in one capability-aware model so a selected student is carried
 * through to the next workspace instead of making an operator select them
 * again.
 */
const workflowDefinitions: readonly WorkflowDefinition[] = [
  {
    id: "planner",
    capability: "plans.read",
    path: "planner",
  },
  {
    id: "learning",
    capability: "learning.read",
    path: "learning",
  },
  {
    id: "reports",
    capability: "reports.read",
    path: "reports",
  },
  {
    id: "exams",
    capability: "exams.read",
    path: "exams",
  },
];

export function studentWorkflowActions(
  studentId: string,
  capabilities: readonly string[],
): StudentWorkflowAction[] {
  if (!studentId) return [];

  return workflowDefinitions
    .filter((item) => capabilities.includes(item.capability))
    .map(({ capability: _capability, path, id }) => ({
      id,
      destination: `/admin/${path}?studentId=${encodeURIComponent(studentId)}`,
    }));
}
