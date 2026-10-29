import { Injectable, Optional } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuthenticatedUser } from "../auth";
import { NotificationsService } from "../notifications";
import { NotificationType } from "../../database/entities/notification.entity";

type CountRow = { count?: number | string };
type PrincipalDashboardContract = {
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
  sessionReviews?: {
    mode: "all_sessions" | "absences_only";
    pendingCount: number;
    items: Array<{
      id: string;
      contextType: string;
      contextId: string;
      title: string;
      sessionDate: string;
      status: string;
      expected: number | null;
      marked: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      lastReviewedAt: string | null;
    }>;
  };
  operations?: {
    activeStudents: number;
    currentlyOut: number;
    scheduleEntries: number;
    staff: number;
  };
  todayAbsences?: Array<{
    id: string;
    name: string;
    context: string;
    sessions: number;
  }>;
  pendingLeaveRequests?: Array<{
    id: string;
    studentName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  }>;
  principalLists?: {
    counts?: { dorm: number; reports: number; leave: number; groups: number };
    teacherSessions: Array<{
      id: string;
      title: string;
      teacherName: string;
      sessionDate: string;
      present: number;
      absent: number;
      marked: number;
    }>;
    teacherReports: Array<{
      id: string;
      teacherName: string;
      studentName: string;
      message: string;
      createdAt: string;
      seenAt: string | null;
    }>;
    dormAttendance: Array<{
      id: string;
      name: string;
      total: number;
      present: number;
      absent: number;
    }>;
    classGroupAttendance: Array<{
      id: string;
      name: string;
      total: number;
      present: number;
      absent: number;
      sessionDate: string;
    }>;
    teacherLeaveRequests: Array<{
      id: string;
      teacherName: string;
      type: "leave" | "return";
      startDate: string;
      endDate: string;
      status: "pending";
    }>;
  };
};

/**
 * Purpose-built leadership projection. Every query is bound to the active
 * organization; capability checks shape the response instead of trusting UI
 * visibility as an authorization boundary.
 */
@Injectable()
export class PrincipalDashboardService {
  constructor(
    private readonly db: DataSource,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async get(
    user: AuthenticatedUser,
    from?: string,
    to?: string,
    classId?: string,
  ): Promise<PrincipalDashboardContract> {
    const roles = user.roles?.length ? user.roles : [user.role];
    if (
      !roles.some((role) =>
        ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role),
      )
    )
      throw new ApiException(
        403,
        "PRINCIPAL_DASHBOARD_FORBIDDEN",
        "میز عملیاتی مدیر فقط برای مدیر مدرسه در دسترس است.",
      );
    const organizationId = user.activeOrganizationId;
    if (!organizationId)
      throw new ApiException(
        403,
        "ORGANIZATION_REQUIRED",
        "مدرسه فعال مشخص نیست.",
      );

    const end = to === undefined ? this.today() : this.isoDate(to);
    const start =
      from === undefined
        ? this.daysBefore(end ?? this.today(), 6)
        : this.isoDate(from);
    if (!start || !end)
      throw new ApiException(
        400,
        "DATE_RANGE_INVALID",
        "تاریخ گزارش معتبر نیست.",
      );
    if (start > end)
      throw new ApiException(
        400,
        "DATE_RANGE_INVALID",
        "بازهٔ گزارش معتبر نیست.",
      );
    if (this.dateDistance(start, end) > 30)
      throw new ApiException(
        400,
        "DATE_RANGE_TOO_LARGE",
        "بازهٔ گزارش نمی‌تواند بیشتر از ۳۱ روز باشد.",
      );

    const can = (capability: string) =>
      user.capabilities?.includes(capability) ?? false;
    if (classId) {
      const ownsClass = await this.scalar(
        "SELECT COUNT(id) count FROM education_classes WHERE id=? AND organizationId=? AND status='ACTIVE'",
        [classId, organizationId],
      );
      if (!ownsClass)
        throw new ApiException(
          404,
          "CLASS_NOT_FOUND",
          "کلاس در مدرسهٔ فعال پیدا نشد.",
        );
    }
    const response: PrincipalDashboardContract = {
      organizationId,
      generatedAt: new Date().toISOString(),
      from: start,
      to: end,
    };

    if (can("attendance.review"))
      response.attendance = await this.attendance(
        organizationId,
        start,
        end,
        classId,
      );
    if (can("attendance.review") && end === this.today())
      await this.notifyOverdueTeacherSessions(user, organizationId, end);
    if (can("analytics.read") && can("students.read"))
      response.behaviour = await this.behaviour(
        organizationId,
        start,
        end,
        classId,
      );
    if (
      can("attendance.review") ||
      can("leave.read") ||
      can("exit.read") ||
      can("permission_requests.read")
    )
      response.queues = await this.queues(organizationId, can);
    if (can("attendance.review"))
      response.sessionReviews = await this.sessionReviews(
        organizationId,
        classId,
      );
    if (
      can("students.read") ||
      can("dormitory.read") ||
      can("schedule.read.all") ||
      can("exit.read")
    )
      response.operations = await this.operations(organizationId, can);
    if (
      can("students.read") &&
      (can("attendance.read") ||
        can("attendance.reports.read") ||
        can("attendance.review"))
    )
      response.todayAbsences = await this.todayAbsences(organizationId, end);
    if (can("leave.read"))
      response.pendingLeaveRequests =
        await this.pendingLeaveRequests(organizationId);
    if (can("attendance.review") || can("leave.read"))
      response.principalLists = await this.principalLists(organizationId, end, {
        attendanceReview: can("attendance.review"),
        leaveRead: can("leave.read"),
      });
    return response;
  }

  private async principalLists(
    organizationId: string,
    day: string,
    permissions: { attendanceReview: boolean; leaveRead: boolean },
  ) {
    const [
      teacherSessions,
      teacherReports,
      dormAttendance,
      classGroupAttendance,
      teacherLeaveRequests,
      counts,
    ] = await Promise.all([
      permissions.attendanceReview
        ? this.db.query(
            `SELECT s.id, COALESCE(NULLIF(s.titleSnapshot,''),'جلسه کلاس') title,
            TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) teacherName,
            s.sessionDate,
            SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
            SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
            COUNT(r.id) marked
           FROM attendance_sessions s
           LEFT JOIN users u ON u.id=s.assignedStaffId
           LEFT JOIN attendance_records r ON r.sessionId=s.id
           WHERE s.organizationId=? AND s.contextType='class'
             AND COALESCE(s.operationalDate,date(s.sessionDate))=?
           GROUP BY s.id, u.firstName, u.lastName
           ORDER BY s.sessionDate DESC LIMIT 12`,
            [organizationId, day],
          )
        : Promise.resolve([]),
      permissions.attendanceReview
        ? this.db.query(
            `SELECT r.id, TRIM(COALESCE(t.firstName,'') || ' ' || COALESCE(t.lastName,'')) teacherName,
            COALESCE(NULLIF(student.name,''),TRIM(COALESCE(su.firstName,'') || ' ' || COALESCE(su.lastName,'')),'دانش‌آموز') studentName,
            r.message, r.createdAt, r.seenAt
           FROM teacher_student_reports r
           JOIN users t ON t.id=r.teacherId
           JOIN students student ON student.id=r.studentId
           LEFT JOIN users su ON su.id=student.userId
           WHERE r.organizationId=? ORDER BY r.createdAt DESC LIMIT 12`,
            [organizationId],
          )
        : Promise.resolve([]),
      permissions.attendanceReview
        ? this.db.query(
            `SELECT s.contextId id, COALESCE(NULLIF(d.name,''),NULLIF(s.titleSnapshot,''),'اتاق خوابگاه') name,
            COUNT(r.id) total, SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
            SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent
           FROM attendance_sessions s
           LEFT JOIN dorm_rooms d ON d.id=s.contextId
           LEFT JOIN attendance_records r ON r.sessionId=s.id
           WHERE s.organizationId=? AND s.contextType='dorm'
             AND COALESCE(s.operationalDate,date(s.sessionDate))=?
           GROUP BY s.contextId, d.name, s.titleSnapshot ORDER BY absent DESC, total DESC LIMIT 12`,
            [organizationId, day],
          )
        : Promise.resolve([]),
      permissions.attendanceReview
        ? this.db.query(
            `SELECT s.id, COALESCE(NULLIF(g.name,''),NULLIF(s.titleSnapshot,''),'گروه کلاس') name,
              s.sessionDate, COUNT(r.id) total,
              SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
              SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent
             FROM attendance_sessions s
             LEFT JOIN study_groups g ON g.id=s.contextId
             LEFT JOIN attendance_records r ON r.sessionId=s.id
             WHERE s.organizationId=? AND s.contextType IN ('class_group','study_group')
               AND COALESCE(s.operationalDate,date(s.sessionDate))=?
             GROUP BY s.id, g.name, s.titleSnapshot
             ORDER BY s.sessionDate DESC LIMIT 12`,
            [organizationId, day],
          )
        : Promise.resolve([]),
      permissions.leaveRead
        ? this.db.query(
            `SELECT l.id, TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) teacherName,
            l.startDate, l.endDate, l.returnDate, l.status, l.returnStatus
           FROM teacher_leave_requests l JOIN users u ON u.id=l.teacherId
           WHERE l.organizationId=? AND (l.status='pending' OR l.returnStatus='pending')
           ORDER BY l.createdAt ASC LIMIT 12`,
            [organizationId],
          )
        : Promise.resolve([]),
      Promise.all([
        permissions.attendanceReview
          ? this.scalar(
              `SELECT COUNT(DISTINCT r.id) count FROM attendance_records r JOIN attendance_sessions s ON s.id=r.sessionId WHERE s.organizationId=? AND s.contextType='dorm' AND r.status='absent' AND r.reviewStatus='pending'`,
              [organizationId],
            )
          : Promise.resolve(0),
        permissions.attendanceReview
          ? this.scalar(
              `SELECT COUNT(id) count FROM teacher_student_reports WHERE organizationId=? AND seenAt IS NULL`,
              [organizationId],
            )
          : Promise.resolve(0),
        permissions.leaveRead
          ? this.scalar(
              `SELECT COUNT(id) count FROM teacher_leave_requests WHERE organizationId=? AND (status='pending' OR returnStatus='pending')`,
              [organizationId],
            )
          : Promise.resolve(0),
        permissions.attendanceReview
          ? this.scalar(
              `SELECT COUNT(DISTINCT s.id) count FROM attendance_sessions s WHERE s.organizationId=? AND s.contextType IN ('class_group','study_group') AND COALESCE(s.operationalDate,date(s.sessionDate))=?`,
              [organizationId, day],
            )
          : Promise.resolve(0),
      ]),
    ]);
    return {
      counts: {
        dorm: Number(counts[0] ?? 0),
        reports: Number(counts[1] ?? 0),
        leave: Number(counts[2] ?? 0),
        groups: Number(counts[3] ?? 0),
      },
      teacherSessions: teacherSessions.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        title: String(row.title),
        teacherName: String(row.teacherName).trim() || "استاد",
        sessionDate: String(row.sessionDate),
        present: Number(row.present ?? 0),
        absent: Number(row.absent ?? 0),
        marked: Number(row.marked ?? 0),
      })),
      teacherReports: teacherReports.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        teacherName: String(row.teacherName).trim() || "استاد",
        studentName: String(row.studentName),
        message: String(row.message),
        createdAt: String(row.createdAt),
        seenAt: row.seenAt == null ? null : String(row.seenAt),
      })),
      dormAttendance: dormAttendance.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        total: Number(row.total ?? 0),
        present: Number(row.present ?? 0),
        absent: Number(row.absent ?? 0),
      })),
      classGroupAttendance: classGroupAttendance.map(
        (row: Record<string, unknown>) => ({
          id: String(row.id),
          name: String(row.name),
          total: Number(row.total ?? 0),
          present: Number(row.present ?? 0),
          absent: Number(row.absent ?? 0),
          sessionDate: String(row.sessionDate),
        }),
      ),
      teacherLeaveRequests: teacherLeaveRequests.map(
        (row: Record<string, unknown>) => ({
          id: String(row.id),
          teacherName: String(row.teacherName).trim() || "استاد",
          type:
            row.returnStatus === "pending"
              ? ("return" as const)
              : ("leave" as const),
          startDate:
            row.returnStatus === "pending"
              ? String(row.returnDate)
              : String(row.startDate),
          endDate:
            row.returnStatus === "pending"
              ? String(row.returnDate)
              : String(row.endDate),
          status: "pending" as const,
        }),
      ),
    };
  }

  private async todayAbsences(organizationId: string, day: string) {
    const rows = await this.db.query(
      `SELECT r.studentId id,
        TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) name,
        COALESCE(ec.name, NULLIF(MAX(s.titleSnapshot), ''), 'بدون عنوان') context,
        COUNT(r.id) sessions
       FROM attendance_records r
       JOIN attendance_sessions s ON s.id=r.sessionId
       JOIN students student ON student.id=r.studentId
       LEFT JOIN users u ON u.id=student.userId
       LEFT JOIN education_classes ec ON ec.id=s.contextId AND ec.organizationId=s.organizationId
       WHERE s.organizationId=?
         AND COALESCE(s.operationalDate,date(s.sessionDate))=?
         AND r.status='absent'
       GROUP BY r.studentId, u.firstName, u.lastName, ec.name
       ORDER BY sessions DESC, name ASC
       LIMIT 12`,
      [organizationId, day],
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name || "دانش آموز"),
      context: String(row.context),
      sessions: Number(row.sessions ?? 0),
    }));
  }

  private async pendingLeaveRequests(organizationId: string) {
    const rows = await this.db.query(
      `SELECT l.id,
        TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) studentName,
        l.leaveType, l.startDate, l.endDate
       FROM leave_requests l
       JOIN students student ON student.id=l.studentId
       LEFT JOIN users u ON u.id=student.userId
       WHERE l.organizationId=? AND l.status='PENDING'
       ORDER BY l.createdAt ASC
       LIMIT 12`,
      [organizationId],
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      studentName: String(row.studentName || "دانش آموز"),
      leaveType: String(row.leaveType),
      startDate: String(row.startDate),
      endDate: String(row.endDate),
    }));
  }

  private async attendance(
    organizationId: string,
    from: string,
    to: string,
    classId?: string,
  ) {
    const filterByClass = classId ? " AND s.contextId=?" : "";
    const rangeParams = classId
      ? [organizationId, from, to, classId]
      : [organizationId, from, to];
    const totals = await this.one(
      `SELECT
        SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN r.status='excused' THEN 1 ELSE 0 END) excused,
        COUNT(r.id) total
       FROM attendance_records r
       JOIN attendance_sessions s ON s.id=r.sessionId
       WHERE s.organizationId=? AND COALESCE(s.operationalDate,date(s.sessionDate)) BETWEEN ? AND ?${filterByClass}`,
      rangeParams,
    );
    const count = (key: string) => Number(totals[key] ?? 0);
    const total = count("total");
    const present = count("present");
    const late = count("late");
    const trendRows = await this.db.query(
      `SELECT COALESCE(s.operationalDate,date(s.sessionDate)) date,
        SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN r.status='excused' THEN 1 ELSE 0 END) excused
       FROM attendance_records r JOIN attendance_sessions s ON s.id=r.sessionId
       WHERE s.organizationId=? AND COALESCE(s.operationalDate,date(s.sessionDate)) BETWEEN ? AND ?${filterByClass}
       GROUP BY COALESCE(s.operationalDate,date(s.sessionDate)) ORDER BY COALESCE(s.operationalDate,date(s.sessionDate)) ASC`,
      rangeParams,
    );
    const classRows = await this.db.query(
      `SELECT s.contextId id, COALESCE(ec.name,NULLIF(MAX(s.titleSnapshot),''),'بدون عنوان') name,
        SUM(COALESCE(json_array_length(s.rosterSnapshot),0)) expected, SUM(COALESCE(records.marked,0)) marked
       FROM attendance_sessions s
       LEFT JOIN (SELECT sessionId,COUNT(id) marked FROM attendance_records GROUP BY sessionId) records ON records.sessionId=s.id
       LEFT JOIN education_classes ec ON ec.id=s.contextId AND ec.organizationId=s.organizationId
       WHERE s.organizationId=? AND s.contextType='class'
         AND COALESCE(s.operationalDate,date(s.sessionDate)) BETWEEN ? AND ?${filterByClass}
       GROUP BY s.contextId ORDER BY marked DESC LIMIT 8`,
      rangeParams,
    );
    const daily = await this.one(
      `SELECT SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN r.status='excused' THEN 1 ELSE 0 END) excused,
        COUNT(r.id) total FROM attendance_records r JOIN attendance_sessions s ON s.id=r.sessionId
       WHERE s.organizationId=? AND COALESCE(s.operationalDate,date(s.sessionDate))=?${classId ? " AND s.contextId=?" : ""}`,
      classId ? [organizationId, to, classId] : [organizationId, to],
    );
    const dailyTotal = Number(daily.total ?? 0);
    const dailyPresent = Number(daily.present ?? 0);
    const dailyLate = Number(daily.late ?? 0);
    return {
      today: {
        present: dailyPresent,
        absent: Number(daily.absent ?? 0),
        late: dailyLate,
        excused: Number(daily.excused ?? 0),
        rate: dailyTotal
          ? Math.round(((dailyPresent + dailyLate) / dailyTotal) * 100)
          : null,
      },
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
        const expected = Number(row.expected ?? 0);
        return {
          id: String(row.id),
          name: String(row.name),
          expected,
          marked,
          rate: expected
            ? Math.min(100, Math.round((marked / expected) * 100))
            : null,
        };
      }),
    };
  }

  private async behaviour(
    organizationId: string,
    from: string,
    to: string,
    classId?: string,
  ) {
    const attendance = await this.attendance(organizationId, from, to, classId);
    const classScope = classId
      ? " AND EXISTS (SELECT 1 FROM education_class_enrollments e WHERE e.studentId=s.id AND e.classroomId=?)"
      : "";
    const scopedRangeParams = classId
      ? [organizationId, from, to, classId]
      : [organizationId, from, to];
    const task = await this.one(
      `SELECT COUNT(t.id) total, SUM(CASE WHEN t.completedAt IS NOT NULL OR t.status='DONE' THEN 1 ELSE 0 END) complete
       FROM tasks t JOIN plans p ON p.id=t.planId JOIN students s ON s.id=p.studentId
       JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE' AND date(p.date) BETWEEN ? AND ?${classScope}`,
      scopedRangeParams,
    );
    const study = await this.one(
      `SELECT COUNT(DISTINCT ss.studentId) participants FROM study_sessions ss JOIN students s ON s.id=ss.studentId
       JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE' AND ss.status='FINISHED'
         AND date(ss.createdAt) BETWEEN ? AND ?${classScope}`,
      scopedRangeParams,
    );
    const exams = await this.one(
      `SELECT COUNT(DISTINCT ea.studentId) participants FROM exam_attempts ea JOIN students s ON s.id=ea.studentId
       JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE' AND ea.finishedAt IS NOT NULL
         AND date(ea.finishedAt) BETWEEN ? AND ?${classScope}`,
      scopedRangeParams,
    );
    const taskTotal = Number(task.total ?? 0);
    const activeStudents = await this.scalar(
      `SELECT COUNT(DISTINCT s.id) count FROM students s JOIN organization_memberships m ON m.userId=s.userId
       WHERE m.organizationId=? AND m.status='ACTIVE'${classId ? " AND EXISTS (SELECT 1 FROM education_class_enrollments e WHERE e.studentId=s.id AND e.classroomId=?)" : ""}`,
      classId ? [organizationId, classId] : [organizationId],
    );
    const riskRows = await this.db.query(
      `SELECT s.id id, TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) name,
        SUM(CASE WHEN r.status='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late
       FROM attendance_records r JOIN attendance_sessions a ON a.id=r.sessionId
       JOIN students s ON s.id=r.studentId JOIN users u ON u.id=s.userId
       WHERE a.organizationId=? AND COALESCE(a.operationalDate,date(a.sessionDate)) BETWEEN ? AND ?${classId ? " AND a.contextId=?" : ""}
       GROUP BY s.id, u.firstName, u.lastName HAVING absent > 0 OR late > 0
       ORDER BY absent DESC, late DESC LIMIT 8`,
      classId
        ? [organizationId, from, to, classId]
        : [organizationId, from, to],
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
              Math.round(
                (Number(study.participants ?? 0) / activeStudents) * 100,
              ),
            )
          : null,
      },
      {
        key: "assessmentParticipation",
        label: "مشارکت آزمون",
        value: activeStudents
          ? Math.min(
              100,
              Math.round(
                (Number(exams.participants ?? 0) / activeStudents) * 100,
              ),
            )
          : null,
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
      {
        key: "absenceFree",
        label: "بدون غیبت",
        value:
          attendance.present + attendance.absent + attendance.late
            ? Math.round(
                (attendance.present /
                  (attendance.present + attendance.absent + attendance.late)) *
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

  private async sessionReviews(organizationId: string, classId?: string) {
    const policies = await this.db.query(
      "SELECT principalReviewMode FROM attendance_policies WHERE organizationId=? LIMIT 1",
      [organizationId],
    );
    const mode: "all_sessions" | "absences_only" =
      policies[0]?.principalReviewMode === "all_sessions"
        ? "all_sessions"
        : "absences_only";
    const dueBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const classFilter = classId
      ? " AND s.contextType='class' AND s.contextId=?"
      : "";
    const parameters = classId
      ? [organizationId, dueBefore, classId]
      : [organizationId, dueBefore];
    const base = `FROM attendance_sessions s
      LEFT JOIN attendance_records r ON r.sessionId=s.id
      LEFT JOIN (SELECT sessionId, reviewedRevision, MAX(reviewedAt) reviewedAt FROM attendance_session_reviews GROUP BY sessionId, reviewedRevision) latest ON latest.sessionId=s.id AND latest.reviewedRevision=s.revision
      WHERE s.organizationId=? AND s.status IN ('submitted','finalized')
        ${mode === "absences_only" ? "AND EXISTS (SELECT 1 FROM attendance_records absent_record WHERE absent_record.sessionId=s.id AND absent_record.physicalStatus='absent')" : ""}
        AND (latest.reviewedAt IS NULL OR latest.reviewedAt<=?)${classFilter}`;
    const pendingCount = await this.scalar(
      `SELECT COUNT(DISTINCT s.id) count ${base}`,
      parameters,
    );
    const rows = await this.db.query(
      `SELECT s.id, s.contextType, s.contextId, COALESCE(NULLIF(s.titleSnapshot,''),'جلسه ثبت‌شده') title,
        s.sessionDate, s.status, json_array_length(s.rosterSnapshot) expected, latest.reviewedAt lastReviewedAt,
        COUNT(r.id) marked,
        SUM(CASE WHEN r.status='present' THEN 1 ELSE 0 END) present,
        SUM(CASE WHEN r.physicalStatus='absent' THEN 1 ELSE 0 END) absent,
        SUM(CASE WHEN r.status='late' THEN 1 ELSE 0 END) late,
        SUM(CASE WHEN r.status='excused' THEN 1 ELSE 0 END) excused
       ${base} GROUP BY s.id ORDER BY s.sessionDate DESC LIMIT 10`,
      parameters,
    );
    return {
      mode,
      pendingCount,
      items: rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        contextType: String(row.contextType),
        contextId: String(row.contextId),
        title: String(row.title),
        sessionDate: String(row.sessionDate),
        status: String(row.status),
        expected: row.expected == null ? null : Number(row.expected),
        marked: Number(row.marked ?? 0),
        present: Number(row.present ?? 0),
        absent: Number(row.absent ?? 0),
        late: Number(row.late ?? 0),
        excused: Number(row.excused ?? 0),
        lastReviewedAt:
          row.lastReviewedAt == null ? null : String(row.lastReviewedAt),
      })),
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
      currentlyOut: can("exit.read")
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
  /** Creates one durable notification per missed legacy occurrence and principal. */
  private async notifyOverdueTeacherSessions(
    user: AuthenticatedUser,
    organizationId: string,
    date: string,
  ) {
    if (!this.notifications) return;
    const notifications = this.notifications;
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date())
      .replace(":", "");
    const currentTime = `${now.slice(0, 2)}:${now.slice(2, 4)}`;
    const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 1) % 7;
    const rows = await this.db.query(
      `SELECT e.id, e.title, e.endTime, COALESCE(NULLIF(e.classroomNameSnapshot,''),'کلاس') classroomName,
        TRIM(COALESCE(u.firstName,'') || ' ' || COALESCE(u.lastName,'')) teacherName
       FROM school_schedule_entries e
       LEFT JOIN users u ON u.id=e.teacherId
       WHERE e.organizationId=? AND e.status='ACTIVE' AND e.weekday=?
         AND e.academicYearId IS NOT NULL AND e.termId IS NOT NULL
         AND (e.startsOn IS NULL OR e.startsOn<=?) AND (e.endsOn IS NULL OR e.endsOn>=?)
         AND e.endTime<?
         AND NOT EXISTS (SELECT 1 FROM attendance_sessions s WHERE s.organizationId=e.organizationId AND s.occurrenceKey=('legacy-schedule:' || e.id || ':' || ?))`,
      [organizationId, weekday, date, date, currentTime, date],
    );
    await Promise.all(
      (rows as Array<Record<string, unknown>>).map((row) =>
        notifications.createForUser(user.id, {
          type: NotificationType.WARNING,
          category: "attendance_overdue",
          priority: "high",
          title: "حضور و غیاب استاد ثبت نشده است",
          body: `${String(row.teacherName).trim() || "استاد"} برای ${String(row.classroomName)} · ${String(row.title)} تا پایان زمان جلسه حضور و غیاب ثبت نکرده است.`,
          url: "/admin/attendance?section=sessions",
          organizationId,
          dedupeKey: `attendance-overdue:${date}:${String(row.id)}:${user.id}`,
        }),
      ),
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
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
      ? null
      : value;
  }
  private dateDistance(from: string, to: string) {
    return Math.round(
      (Date.parse(`${to}T00:00:00.000Z`) -
        Date.parse(`${from}T00:00:00.000Z`)) /
        86_400_000,
    );
  }
}
