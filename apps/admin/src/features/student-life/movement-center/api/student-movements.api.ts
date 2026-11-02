import { api } from "../../../../shared/api/api";
import type { ExitPermission } from "../../exit-permissions/api/exit-permissions.api";

export type MovementState =
  "review" | "awaiting_departure" | "outside" | "overdue" | "archive" | "all";

export type MovementLeave = {
  id: string;
  studentName: string;
  studentId: string;
  leaveType: "SCHOOL_EXIT" | "LEAVE";
  reviewerRole: "PRINCIPAL" | "SCHOOL_SUPERVISOR";
  startDate: string;
  endDate: string;
  reason: string;
  note: string;
  includesLunch: boolean;
  includesDinner: boolean;
  exitPermissionId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
};

export type StudentMovement = {
  id: string;
  kind: "leave" | "exit";
  state: Exclude<MovementState, "all">;
  leave: MovementLeave | null;
  exit: ExitPermission | null;
};

/**
 * A linked leave and exit have different identifiers. History must always use
 * the identifier belonging to the endpoint kind; otherwise an exit history
 * lookup can accidentally send the linked leave-request id.
 */
export const movementHistoryId = (movement: Pick<StudentMovement, "kind" | "leave" | "exit">) =>
  movement.kind === "leave" ? (movement.leave?.id ?? null) : (movement.exit?.id ?? null);

export type StudentMovementResult = {
  counts: {
    pendingLongLeaves: number;
    pendingShortExits: number;
    awaitingDeparture: number;
    currentlyOutside: number;
    overdueReturns: number;
  };
  items: StudentMovement[];
};

export type StudentMovementHistoryEvent = {
  id: string;
  type: string;
  note: string;
  actorName: string | null;
  createdAt: string;
};

export const getStudentMovements = (input: { organizationId?: string; state?: MovementState }) => {
  const query = new URLSearchParams();
  if (input.organizationId) query.set("organizationId", input.organizationId);
  if (input.state && input.state !== "all") query.set("state", input.state);
  const suffix = query.size ? `?${query.toString()}` : "";
  return api.get<StudentMovementResult>(`/student-movements${suffix}`);
};

export const resolveOverdueMovement = (
  id: string,
  outcome: "returned" | "outside_school" | "breach",
  note?: string,
) =>
  api.post<ExitPermission>(`/student-movements/${encodeURIComponent(id)}/resolve-overdue`, {
    outcome,
    note,
  });

export const confirmStudentInSchool = (id: string, note?: string) =>
  api.post<ExitPermission>(`/student-movements/${encodeURIComponent(id)}/confirm-in-school`, {
    note,
  });

export const getStudentMovementHistory = (
  kind: StudentMovement["kind"],
  id: string,
  organizationId?: string,
) => {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  return api.get<StudentMovementHistoryEvent[]>(
    `/student-movements/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/history${query}`,
  );
};
