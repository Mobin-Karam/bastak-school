import { api } from "../../../../shared/api/api";
import { addDays, todayIso } from "../../../../shared/lib/utils";

export type PrincipalDashboardContract = {
  organizationId: string;
  generatedAt: string;
  from: string;
  to: string;
  attendance?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number | null;
    trend: Array<{ date: string; present: number; absent: number; late: number; excused: number }>;
    classes: Array<{
      id: string;
      name: string;
      expected: number;
      marked: number;
      rate: number | null;
    }>;
  };
  behaviour?: {
    dimensions: Array<{ key: string; label: string; value: number | null }>;
    risks: Array<{
      id: string;
      name: string;
      absent: number;
      late: number;
      attention: "high" | "medium";
    }>;
  };
  queues?: {
    attendanceReviews: number;
    leaveRequests: number;
    exitRequests: number;
    permissionRequests: number;
  };
  operations?: {
    activeStudents: number;
    currentlyOut: number;
    scheduleEntries: number;
    staff: number;
  };
};

export const getPrincipalDashboard = (range: "7d" | "30d") => {
  const to = todayIso();
  const from = addDays(to, range === "30d" ? -29 : -6);
  return api.get<PrincipalDashboardContract>(
    `/dashboard/principal?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
};
