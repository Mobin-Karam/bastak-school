import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuthenticatedUser } from "../auth";

type CountRow = { count?: number | string };
type PrincipalDashboardContract = {
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
    trend: Array<{
      date: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }>;
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

/**
 * Purpose-built leadership projection. Every query is bound to the active
 * organization; capability checks shape the response instead of trusting UI
 * visibility as an authorization boundary.
 */
@Injectable()
export class PrincipalDashboardService {
  constructor(private readonly db: DataSource) {}

  async get(
    user: AuthenticatedUser,
    from?: string,
    to?: string,
  ): Promise<PrincipalDashboardContract> {
    const organizationId =
      user.activeOrganizationId ?? user.organizationIds?.[0];
    if (!organizationId)
      throw new ApiException(
        403,
        "ORGANIZATION_REQUIRED",
        "مدرسه فعال مشخص نیست.",
      );

    const end = this.isoDate(to) ?? this.today();
    const start = this.isoDate(from) ?? this.daysBefore(end, 6);
    if (start > end)
      throw new ApiException(
        400,
        "DATE_RANGE_INVALID",
        "بازهٔ گزارش معتبر نیست.",
      );

    const can = (capability: string) =>
      user.capabilities?.includes(capability) ?? false;
    const response: PrincipalDashboardContract = {
      organizationId,
      generatedAt: new Date().toISOString(),
      from: start,
      to: end,
    };

    if (
      can("attendance.read") ||
      can("attendance.reports.read") ||
      can("attendance.review")
    )
      response.attendance = await this.attendance(organizationId, start, end);
    if (can("analytics.read") && can("students.read"))
      response.behaviour = await this.behaviour(organizationId, start, end);
    if (
      can("attendance.review") ||
      can("leave.read") ||
      can("exit.read") ||
      can("permission_requests.read")
    )
      response.queues = await this.queues(organizationId, can);
    if (
      can("students.read") ||
      can("dormitory.read") ||
      can("schedule.read.all")
    )
      response.operations = await this.operations(organizationId, can);
    return response;
  }

  private async attendance(organizationId: string, from: string, to: string) {
    const totals = await this.one(
      `SELECT
        SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN r.status='excused' THEN 1 ELSE 0 END) excused,
        COUNT(r.id) total
       FROM attendance_records r
       JOIN attendance_sessions s ON s.id=r.sessionId
       WHERE s.organizationId=? AND date(s.sessionDate) BETWEEN ? AND ?`,
      [organizationId, from, to],
    );
    const count = (key: string) => Number(totals[key] ?? 0);
    const total = count("total");
    const present = count("present");
    const late = count("late");
    const trendRows = await this.db.query(
      `SELECT date(s.sessionDate) date,
        SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN r.status='excused' THEN 1 ELSE 0 END) excused
       FROM attendance_records r JOIN attendance_sessions s ON s.id=r.sessionId
       WHERE s.organizationId=? AND date(s.sessionDate) BETWEEN ? AND ?
       GROUP BY date(s.sessionDate) ORDER BY date(s.sessionDate) ASC`,
      [organizationId, from, to],
    );
    const classRows = await this.db.query(
      `SELECT s.contextId id, COALESCE(NULLIF(s.titleSnapshot,''),'بدون عنوان') name,
        COUNT(r.id) marked,
        SUM(CASE WHEN r.status IN ('present','late') THEN 1 ELSE 0 END) onTime
       FROM attendance_records r JOIN attendance_sessions s ON s.id=r.sessionId
       WHERE s.organizationId=? AND s.contextType IN ('class','class_group')
         AND date(s.sessionDate) BETWEEN ? AND ?
       GROUP BY s.contextId, s.titleSnapshot ORDER BY marked DESC LIMIT 8`,
      [organizationId, from, to],
    );
    return {
      present,
      absent: count("absent"),
      late,
      excused: count("excused"),
      rate: total ? Math.round(((present + late) / total) * 100) : null,
      trend: trendRows.map((row: Record<string, unknown>) => ({
        date: String(row.date),
        present: Number(row.present ?? 0),
        absent: Number(row.absent ?? 0),
        late: Number(row.late ?? 0),
        excused: Number(row.excused ?? 0),
      })),
      classes: classRows.map((row: Record<string, unknown>) => {
        const marked = Number(row.marked ?? 0);
        return {
          id: String(row.id),
          name: String(row.name),
          expected: marked,
          marked,
          rate: marked
            ? Math.round((Number(row.onTime ?? 0) / marked) * 100)
            : null,
        };
      }),
    };
  }

  private async behaviour(organizationId: string, from: string, to: string) {
    const attendance = await this.attendance(organizationId, from, to);
    const task = await this.one(
      `SELECT COUNT(t.id) total, SUM(CASE WHEN t.completedAt IS NOT NULL OR t.status='DONE' THEN 1 ELSE 0 END) complete
       FROM tasks t JOIN plans p ON p.id=t.planId JOIN students s ON s.id=p.studentId
       JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE' AND date(p.date) BETWEEN ? AND ?`,
      [organizationId, from, to],
    );
    const study = await this.one(
      `SELECT COUNT(ss.id) sessions FROM study_sessions ss JOIN students s ON s.id=ss.studentId
       JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE' AND ss.status='FINISHED'
         AND date(ss.createdAt) BETWEEN ? AND ?`,
      [organizationId, from, to],
    );
    const exams = await this.one(
      `SELECT AVG(ea.score) average FROM exam_attempts ea JOIN students s ON s.id=ea.studentId
       JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE' AND ea.finishedAt IS NOT NULL
         AND date(ea.finishedAt) BETWEEN ? AND ?`,
      [organizationId, from, to],
    );
    const taskTotal = Number(task.total ?? 0);
    const activeStudents = await this.scalar(
      `SELECT COUNT(DISTINCT s.id) count FROM students s JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE'`,
      [organizationId],
    );
    const riskRows = await this.db.query(
      `SELECT s.id id, TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) name,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late
       FROM attendance_records r JOIN attendance_sessions a ON a.id=r.sessionId
       JOIN students s ON s.id=r.studentId JOIN users u ON u.id=s.userId
       WHERE a.organizationId=? AND date(a.sessionDate) BETWEEN ? AND ?
       GROUP BY s.id, u.firstName, u.lastName HAVING absent > 0 OR late > 0
       ORDER BY absent DESC, late DESC LIMIT 8`,
      [organizationId, from, to],
    );
    const dimensions = [
      { key: "attendance", label: "حضور", value: attendance.rate },
      {
        key: "tasks",
        label: "تکلیف",
        value: taskTotal
          ? Math.round((Number(task.complete ?? 0) / taskTotal) * 100)
          : null,
      },
      {
        key: "study",
        label: "مطالعه",
        value: activeStudents
          ? Math.min(
              100,
              Math.round((Number(study.sessions ?? 0) / activeStudents) * 20),
            )
          : null,
      },
      {
        key: "exams",
        label: "آزمون",
        value: exams.average == null ? null : Math.round(Number(exams.average)),
      },
      {
        key: "punctuality",
        label: "وقت‌شناسی",
        value:
          attendance.present + attendance.late
            ? Math.round(
                (attendance.present / (attendance.present + attendance.late)) *
                  100,
              )
            : null,
      },
    ];
    return {
      dimensions,
      risks: riskRows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name).trim() || "دانش‌آموز",
        absent: Number(row.absent ?? 0),
        late: Number(row.late ?? 0),
        attention:
          Number(row.absent ?? 0) >= 2
            ? ("high" as const)
            : ("medium" as const),
      })),
    };
  }

  private async queues(
    organizationId: string,
    can: (capability: string) => boolean,
  ) {
    return {
      attendanceReviews: can("attendance.review")
        ? await this.scalar(
            `SELECT COUNT(r.id) count FROM attendance_records r JOIN attendance_sessions s ON s.id=r.sessionId WHERE s.organizationId=? AND r.reviewStatus='pending'`,
            [organizationId],
          )
        : 0,
      leaveRequests: can("leave.read")
        ? await this.scalar(
            "SELECT COUNT(id) count FROM leave_requests WHERE organizationId=? AND status='PENDING'",
            [organizationId],
          )
        : 0,
      exitRequests: can("exit.read")
        ? await this.scalar(
            "SELECT COUNT(id) count FROM exit_permissions WHERE organizationId=? AND status='PENDING'",
            [organizationId],
          )
        : 0,
      permissionRequests: can("permission_requests.read")
        ? await this.scalar(
            "SELECT COUNT(id) count FROM permission_requests WHERE organizationId=? AND status='PENDING'",
            [organizationId],
          )
        : 0,
    };
  }

  private async operations(
    organizationId: string,
    can: (capability: string) => boolean,
  ) {
    const activeStudents = can("students.read")
      ? await this.scalar(
          "SELECT COUNT(s.id) count FROM students s JOIN organization_memberships m ON m.userId=s.userId WHERE m.organizationId=? AND m.status='ACTIVE' AND s.accountStatus='active'",
          [organizationId],
        )
      : 0;
    return {
      activeStudents,
      currentlyOut: can("dormitory.read")
        ? await this.scalar(
            "SELECT COUNT(id) count FROM exit_permissions WHERE organizationId=? AND status='APPROVED' AND actualDepartureAt IS NOT NULL AND actualReturnAt IS NULL",
            [organizationId],
          )
        : 0,
      scheduleEntries: can("schedule.read.all")
        ? await this.scalar(
            "SELECT COUNT(id) count FROM school_schedule_entries WHERE organizationId=? AND status='ACTIVE'",
            [organizationId],
          )
        : 0,
      staff: can("students.read")
        ? await this.scalar(
            "SELECT COUNT(DISTINCT m.userId) count FROM organization_memberships m LEFT JOIN students s ON s.userId=m.userId WHERE m.organizationId=? AND m.status='ACTIVE' AND s.id IS NULL",
            [organizationId],
          )
        : 0,
    };
  }

  private async one(sql: string, parameters: unknown[]) {
    return (
      ((await this.db.query(sql, parameters))[0] as Record<string, unknown>) ??
      {}
    );
  }
  private async scalar(sql: string, parameters: unknown[]) {
    const row = (await this.db.query(sql, parameters))[0] as
      CountRow | undefined;
    return Number(row?.count ?? 0);
  }
  private today() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  private daysBefore(date: string, days: number) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() - days);
    return value.toISOString().slice(0, 10);
  }
  private isoDate(value?: string) {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }
}
