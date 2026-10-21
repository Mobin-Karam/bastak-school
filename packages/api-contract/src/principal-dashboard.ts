export type PrincipalDashboardTrendPoint = {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

export type PrincipalDashboardClassAttendance = {
  id: string;
  name: string;
  expected: number;
  marked: number;
  rate: number | null;
};

export type PrincipalDashboardRiskStudent = {
  id: string;
  name: string;
  absent: number;
  late: number;
  attention: "high" | "medium";
};

/** Capability-shaped, organization-scoped leadership dashboard response. */
export type PrincipalDashboardContract = {
  organizationId: string;
  generatedAt: string;
  from: string;
  to: string;
  attendance?: {
    today: {
      present: number;
      absent: number;
      late: number;
      excused: number;
      rate: number | null;
    };
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number | null;
    trend: PrincipalDashboardTrendPoint[];
    classes: PrincipalDashboardClassAttendance[];
  };
  behaviour?: {
    dimensions: Array<{ key: string; label: string; value: number | null }>;
    risks: PrincipalDashboardRiskStudent[];
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
