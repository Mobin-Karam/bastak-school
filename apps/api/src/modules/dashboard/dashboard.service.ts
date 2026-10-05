import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
@Injectable()
export class DashboardService {
  constructor(
    private db: DataSource,
    private authorization: AuthorizationService,
  ) {}
  async get(user: AuthenticatedUser, requested?: string) {
    const roles = user.roles || (user.role === "ADMIN" ? [] : [user.role]);
    const context = String(
      requested || roles.find((r) => r !== "STUDENT") || roles[0] || "",
    ).toUpperCase();
    if (!context || !roles.includes(context))
      throw new ApiException(
        403,
        "CONTEXT_FORBIDDEN",
        "این زمینه برای حساب شما فعال نیست.",
      );
    const ids = await this.studentIds(user.id, context);
    const values = ids.length ? ids : ["__none__"];
    const marks = values.map(() => "?").join(",");
    const scalar = async (sql: string, args: unknown[] = []) =>
      (await this.db.query(sql, args))[0]?.n || 0;
    const common = {
      context,
      generatedAt: new Date().toISOString(),
      assignedStudents: ids.length,
      unreadConversations: await scalar(
        `SELECT COUNT(*) n FROM chat_messages m JOIN conversation_members cm ON cm.conversationId=m.conversationId WHERE cm.userId=? AND cm.leftAt IS NULL AND m.senderId<>? AND m.readAt IS NULL`,
        [user.id, user.id],
      ),
    };
    if (context === "ADVISOR")
      return {
        ...common,
        attentionStudents: await scalar(
          `SELECT COUNT(DISTINCT p.studentId)n FROM plans p JOIN tasks t ON t.planId=p.id WHERE p.studentId IN (${marks}) AND p.date=date('now') AND t.completedAt IS NULL`,
          values,
        ),
        taskIssues: await scalar(
          `SELECT COUNT(*)n FROM task_issues WHERE studentId IN (${marks}) AND status='OPEN'`,
          values,
        ),
        recoveryRequests: await scalar(
          `SELECT COUNT(*)n FROM recovery_requests WHERE studentId IN (${marks}) AND status='PENDING'`,
          values,
        ),
        retryRequests: await scalar(
          `SELECT COUNT(*)n FROM exam_retry_requests WHERE studentId IN (${marks}) AND status='pending'`,
          values,
        ),
        todayPlanHealth: await this.planHealth(values),
        upcomingExams: await this.upcomingExams(values),
      };
    if (context === "TEACHER")
      return {
        ...common,
        subjects: await this.db.query(
          `SELECT DISTINCT s.id,s.name FROM subjects s JOIN student_subjects ss ON ss.subjectId=s.id WHERE ss.studentId IN (${marks}) AND ss.enabled=1`,
          values,
        ),
        upcomingExams: await this.upcomingExams(values),
        recentExamResults: await this.db.query(
          `SELECT ea.id,ea.score,ea.finishedAt,ea.studentId,e.title FROM exam_attempts ea JOIN exams e ON e.id=ea.examId WHERE ea.studentId IN (${marks}) AND ea.finishedAt IS NOT NULL ORDER BY ea.finishedAt DESC LIMIT 10`,
          values,
        ),
        studentsNeedingAttention: await scalar(
          `SELECT COUNT(*)n FROM mistakes WHERE studentId IN (${marks}) AND resolved=0`,
          values,
        ),
        contentTasks: {
          questions: await scalar(`SELECT COUNT(*)n FROM questions`),
          quizzes: await scalar(`SELECT COUNT(*)n FROM quizzes WHERE active=1`),
        },
      };
    if (context === "MENTOR")
      return {
        ...common,
        recentProgress: await this.planHealth(values),
        upcomingGoals: await this.upcomingExams(values),
        messages: common.unreadConversations,
      };
    if (context === "CONTENT_MANAGER")
      return {
        ...common,
        subjects: await scalar(`SELECT COUNT(*)n FROM subjects WHERE active=1`),
        questions: await scalar(`SELECT COUNT(*)n FROM questions`),
        quizzes: await scalar(`SELECT COUNT(*)n FROM quizzes`),
        exams: await scalar(`SELECT COUNT(*)n FROM exams`),
        draftCount: await scalar(
          `SELECT COUNT(*)n FROM quizzes WHERE active=0`,
        ),
        publishedCount: await scalar(
          `SELECT COUNT(*)n FROM quizzes WHERE active=1`,
        ),
        contentIssues: [],
      };
    if (context === "ORGANIZATION_ADMIN") {
      const orgs = user.organizationIds || [];
      const ov = orgs.length ? orgs : ["__none__"],
        om = ov.map(() => "?").join(",");
      return {
        ...common,
        organizations: orgs,
        members: await scalar(
          `SELECT COUNT(*)n FROM organization_memberships WHERE organizationId IN (${om}) AND status='ACTIVE'`,
          ov,
        ),
        students: await scalar(
          `SELECT COUNT(*)n FROM organization_memberships m JOIN students s ON s.userId=m.userId WHERE m.organizationId IN (${om}) AND m.status='ACTIVE'`,
          ov,
        ),
        staff: await scalar(
          `SELECT COUNT(DISTINCT m.userId)n FROM organization_memberships m LEFT JOIN students s ON s.userId=m.userId WHERE m.organizationId IN (${om}) AND m.status='ACTIVE' AND s.id IS NULL`,
          ov,
        ),
        activeUsers: await scalar(
          `SELECT COUNT(*)n FROM organization_memberships m JOIN users u ON u.id=m.userId WHERE m.organizationId IN (${om}) AND u.status='ACTIVE'`,
          ov,
        ),
        inactiveUsers: await scalar(
          `SELECT COUNT(*)n FROM organization_memberships m JOIN users u ON u.id=m.userId WHERE m.organizationId IN (${om}) AND u.status<>'ACTIVE'`,
          ov,
        ),
        analytics: {
          plans: await scalar(
            `SELECT COUNT(*)n FROM plans p JOIN students s ON s.id=p.studentId JOIN organization_memberships m ON m.userId=s.userId WHERE m.organizationId IN (${om})`,
            ov,
          ),
        },
        todayPlanHealth: await this.planHealthForOrganizations(ov),
        weeklyPlanHealth: await this.weeklyPlanHealthForOrganizations(ov),
        studentHealthSummary: await this.organizationStudentHealthSummary(ov),
        studentHealth: await this.organizationStudentHealth(ov),
        advisorCoverage: await this.organizationAdvisorCoverage(ov),
        notices: [],
      };
    }
    if (context === "PLATFORM_ADMIN")
      return {
        ...common,
        organizations: await scalar(`SELECT COUNT(*)n FROM organizations`),
        users: await scalar(`SELECT COUNT(*)n FROM users`),
        signupOverview: {
          enabledOrganizations: await scalar(`SELECT COUNT(*)n FROM organizations WHERE status='ACTIVE' AND studentSignupEnabled=1 AND studentSignupLimit>studentSignupCount`),
          remainingCapacity: await scalar(`SELECT COALESCE(SUM(studentSignupLimit-studentSignupCount),0)n FROM organizations WHERE status='ACTIVE' AND studentSignupEnabled=1 AND studentSignupLimit>studentSignupCount`),
          pendingAssignments: await scalar(`SELECT COUNT(*)n FROM students WHERE onboardingStatus='PENDING_ASSIGNMENT'`),
        },
        systemHealth: { database: "ok", sqlite: true },
        releaseStatus: {
          version: process.env.APP_VERSION || "2.0.0",
          environment: process.env.NODE_ENV || "development",
        },
        auditSummary: {
          events24h: await scalar(
            `SELECT COUNT(*)n FROM audit_logs WHERE createdAt>=datetime('now','-1 day')`,
          ),
          lockedLogins: await scalar(
            `SELECT COUNT(*)n FROM login_throttles WHERE lockedUntil>datetime('now')`,
          ),
        },
      };
    if (context === "GUARDIAN") return { ...common, children: ids.length };
    throw new ApiException(
      400,
      "UNSUPPORTED_CONTEXT",
      "داشبورد این نقش هنوز تعریف نشده است.",
    );
  }
  private async studentIds(userId: string, context: string) {
    if (
      context === "GUARDIAN" ||
      ["ADVISOR", "TEACHER", "MENTOR"].includes(context)
    ) {
      const rows = await this.db.query(
        `SELECT DISTINCT toStudentId id FROM user_relationships WHERE fromUserId=? AND status='ACTIVE' AND type=?`,
        [userId, context === "GUARDIAN" ? "GUARDIAN_OF" : `${context}_OF`],
      );
      return rows.map((r: { id: string }) => r.id);
    }
    return [];
  }
  /**
   * Organization-admin visibility is deliberately derived from active
   * organization memberships. The client only receives a small actionable
   * roster, never an unscoped student feed.
   */
  private async planHealthForOrganizations(organizationIds: string[]) {
    const marks = organizationIds.map(() => "?").join(",");
    const rows = await this.db.query(
      `SELECT COUNT(DISTINCT p.id) plans, COUNT(t.id) tasks,
        SUM(CASE WHEN t.completedAt IS NOT NULL THEN 1 ELSE 0 END) completed
       FROM plans p
       JOIN students s ON s.id=p.studentId
       LEFT JOIN tasks t ON t.planId=p.id
       WHERE EXISTS(SELECT 1 FROM organization_memberships m WHERE m.userId=s.userId AND m.organizationId IN (${marks}) AND m.status='ACTIVE')
         AND p.date=date('now') AND p.status='PUBLISHED'`,
      organizationIds,
    );
    const row = rows[0] || {};
    return {
      plans: Number(row.plans || 0),
      tasks: Number(row.tasks || 0),
      completed: Number(row.completed || 0),
    };
  }
  private async weeklyPlanHealthForOrganizations(organizationIds: string[]) {
    const marks = organizationIds.map(() => "?").join(",");
    const rows = await this.db.query(
      `SELECT COUNT(DISTINCT p.id) plans, COUNT(t.id) tasks,
        SUM(CASE WHEN t.completedAt IS NOT NULL THEN 1 ELSE 0 END) completed
       FROM plans p
       JOIN students s ON s.id=p.studentId
       LEFT JOIN tasks t ON t.planId=p.id
       WHERE EXISTS(SELECT 1 FROM organization_memberships m WHERE m.userId=s.userId AND m.organizationId IN (${marks}) AND m.status='ACTIVE')
         AND p.date BETWEEN date('now','-6 day') AND date('now')
         AND p.status='PUBLISHED'`,
      organizationIds,
    );
    const row = rows[0] || {};
    return {
      plans: Number(row.plans || 0),
      tasks: Number(row.tasks || 0),
      completed: Number(row.completed || 0),
    };
  }
  private async organizationStudentHealth(organizationIds: string[]) {
    const marks = organizationIds.map(() => "?").join(",");
    const rows = await this.db.query(
      `SELECT s.id, s.name,
        (SELECT MAX(ss.lastHeartbeatAt) FROM study_sessions ss WHERE ss.studentId=s.id) lastActiveAt,
        COUNT(DISTINCT p.id) plansToday,
        COUNT(t.id) tasksToday,
        SUM(CASE WHEN t.completedAt IS NOT NULL THEN 1 ELSE 0 END) completedToday,
        CASE WHEN EXISTS(SELECT 1 FROM user_relationships ur WHERE ur.toStudentId=s.id AND ur.organizationId IN (${marks}) AND ur.type='ADVISOR_OF' AND ur.status='ACTIVE') THEN 1 ELSE 0 END advisorAssigned,
        CASE WHEN EXISTS(SELECT 1 FROM daily_reports dr WHERE dr.studentId=s.id AND dr.planDate=date('now')) THEN 1 ELSE 0 END reportSubmitted,
        COALESCE((SELECT sp.syncStatus FROM student_presence sp WHERE sp.studentId=s.id), 'offline') syncStatus,
        (SELECT COUNT(*) FROM task_issues ti WHERE ti.studentId=s.id AND ti.status='OPEN') openIssues,
        (SELECT COUNT(*) FROM recovery_requests rr WHERE rr.studentId=s.id AND rr.status='pending') pendingRecoveries
       FROM students s
       LEFT JOIN plans p ON p.studentId=s.id AND p.date=date('now') AND p.status='PUBLISHED'
       LEFT JOIN tasks t ON t.planId=p.id
       WHERE EXISTS(SELECT 1 FROM organization_memberships m WHERE m.userId=s.userId AND m.organizationId IN (${marks}) AND m.status='ACTIVE')
       GROUP BY s.id, s.name
       HAVING COUNT(DISTINCT p.id)=0
          OR (COUNT(t.id)>0 AND SUM(CASE WHEN t.completedAt IS NOT NULL THEN 1 ELSE 0 END)=0)
          OR (SELECT COUNT(*) FROM task_issues ti WHERE ti.studentId=s.id AND ti.status='OPEN')>0
          OR (SELECT COUNT(*) FROM recovery_requests rr WHERE rr.studentId=s.id AND rr.status='pending')>0
          OR COALESCE((SELECT sp.syncStatus FROM student_presence sp WHERE sp.studentId=s.id), 'offline')='failed'
          OR NOT EXISTS(SELECT 1 FROM daily_reports dr WHERE dr.studentId=s.id AND dr.planDate=date('now'))
          OR NOT EXISTS(SELECT 1 FROM user_relationships ur WHERE ur.toStudentId=s.id AND ur.organizationId IN (${marks}) AND ur.type='ADVISOR_OF' AND ur.status='ACTIVE')
       ORDER BY CASE
         WHEN (SELECT COUNT(*) FROM recovery_requests rr WHERE rr.studentId=s.id AND rr.status='pending')>0 THEN 0
         WHEN (SELECT COUNT(*) FROM task_issues ti WHERE ti.studentId=s.id AND ti.status='OPEN')>0 THEN 1
         WHEN COALESCE((SELECT sp.syncStatus FROM student_presence sp WHERE sp.studentId=s.id), 'offline')='failed' THEN 2
         WHEN COUNT(DISTINCT p.id)=0 THEN 3
         WHEN COUNT(t.id)>0 AND SUM(CASE WHEN t.completedAt IS NOT NULL THEN 1 ELSE 0 END)=0 THEN 4
         WHEN NOT EXISTS(SELECT 1 FROM daily_reports dr WHERE dr.studentId=s.id AND dr.planDate=date('now')) THEN 5
         ELSE 6 END,
         (SELECT MAX(ss.lastHeartbeatAt) FROM study_sessions ss WHERE ss.studentId=s.id) ASC
       LIMIT 6`,
      [...organizationIds, ...organizationIds, ...organizationIds],
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name || "دانش‌آموز"),
      plansToday: Number(row.plansToday || 0),
      tasksToday: Number(row.tasksToday || 0),
      completedToday: Number(row.completedToday || 0),
      lastActiveAt: row.lastActiveAt ? String(row.lastActiveAt) : null,
      reportSubmitted: Boolean(row.reportSubmitted),
      syncStatus: String(row.syncStatus || "offline"),
      openIssues: Number(row.openIssues || 0),
      pendingRecoveries: Number(row.pendingRecoveries || 0),
      advisorAssigned: Boolean(row.advisorAssigned),
    }));
  }
  private async organizationStudentHealthSummary(organizationIds: string[]) {
    const marks = organizationIds.map(() => "?").join(",");
    const scope = `FROM students s WHERE EXISTS(SELECT 1 FROM organization_memberships m WHERE m.userId=s.userId AND m.organizationId IN (${marks}) AND m.status='ACTIVE')`;
    const scalar = async (condition: string, args = organizationIds) =>
      Number((await this.db.query(`SELECT COUNT(DISTINCT s.id) n ${scope} AND (${condition})`, args))[0]?.n || 0);
    return {
      noPlan: await scalar("NOT EXISTS(SELECT 1 FROM plans p WHERE p.studentId=s.id AND p.date=date('now') AND p.status='PUBLISHED')"),
      noReport: await scalar("NOT EXISTS(SELECT 1 FROM daily_reports dr WHERE dr.studentId=s.id AND dr.planDate=date('now'))"),
      syncFailed: await scalar("EXISTS(SELECT 1 FROM student_presence sp WHERE sp.studentId=s.id AND sp.syncStatus='failed')"),
      openIssues: await scalar("EXISTS(SELECT 1 FROM task_issues ti WHERE ti.studentId=s.id AND ti.status='OPEN')"),
      noAdvisor: await scalar(`NOT EXISTS(SELECT 1 FROM user_relationships ur WHERE ur.toStudentId=s.id AND ur.organizationId IN (${marks}) AND ur.type='ADVISOR_OF' AND ur.status='ACTIVE')`, [...organizationIds, ...organizationIds]),
    };
  }
  private async organizationAdvisorCoverage(organizationIds: string[]) {
    const marks = organizationIds.map(() => "?").join(",");
    const rows = await this.db.query(
      `SELECT u.id,
        COALESCE(NULLIF(TRIM(u.firstName || ' ' || u.lastName), ''), u.username) name,
        COUNT(DISTINCT ur.toStudentId) assignedStudents
       FROM user_relationships ur
       JOIN users u ON u.id=ur.fromUserId
       JOIN organization_memberships m ON m.userId=u.id AND m.organizationId=ur.organizationId
       WHERE ur.organizationId IN (${marks}) AND ur.type='ADVISOR_OF'
         AND ur.status='ACTIVE' AND m.status='ACTIVE' AND u.status='ACTIVE'
       GROUP BY u.id, u.firstName, u.lastName, u.username
       ORDER BY assignedStudents DESC, name COLLATE NOCASE ASC
       LIMIT 6`,
      organizationIds,
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name || "مشاور"),
      assignedStudents: Number(row.assignedStudents || 0),
    }));
  }
  async attentionQueue(user: AuthenticatedUser, requestedLimit?: number) {
    const context: UserContext = {
      ...user,
      roles: user.roles || [user.role],
      capabilities: user.capabilities || [],
      membershipIds: user.membershipIds || [],
      organizationIds: user.organizationIds || [],
    };
    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.isFinite(requestedLimit ?? Number.NaN)
          ? Math.floor(requestedLimit!)
          : 50,
      ),
    );
    const can = (capability: string) =>
      this.authorization.hasCapability(context, capability);
    const allowedStudentIds = new Set<string>();
    const canAccessStudent = async (studentId: string, capability: string) => {
      const key = `${capability}:${studentId}`;
      if (allowedStudentIds.has(key)) return true;
      const allowed = await this.authorization.canAccessStudent(
        context,
        studentId,
        capability,
      );
      if (allowed) allowedStudentIds.add(key);
      return allowed;
    };
    type Row = {
      id?: string;
      studentId?: string;
      studentName?: string;
      createdAt?: string;
      updatedAt?: string;
      planDate?: string;
      conversationId?: string;
      message?: string;
      failureCode?: string;
      deviceId?: string;
      username?: string;
      organizationName?: string;
    };
    type Item = {
      id: string;
      type:
        | "recovery"
        | "task_issue"
        | "retry_request"
        | "unread_chat"
        | "sync_failure"
        | "inactive_user";
      title: string;
      description: string;
      descriptionKind: "system" | "user";
      priority: "urgent" | "high" | "normal";
      owner: { id: string; label: string };
      dueAt: string | null;
      status: "open";
      student?: { id: string; name: string };
      deepLink: string;
      createdAt: string | null;
      meta?: Record<string, string>;
    };
    const items: Item[] = [];
    const add = async (
      row: Row,
      capability: string,
      item: Omit<Item, "owner">,
    ) => {
      if (row.studentId && !(await canAccessStudent(row.studentId, capability)))
        return;
      items.push({
        ...item,
        owner: { id: context.id, label: "مسئول زمینه کاری فعلی" },
      });
    };
    if (can("recovery_requests.read")) {
      const rows: Row[] = await this.db.query(
        `SELECT r.id,r.studentId,s.name studentName,r.createdAt,r.planDate,r.reason message FROM recovery_requests r JOIN students s ON s.id=r.studentId WHERE r.status='pending' ORDER BY r.createdAt DESC LIMIT ?`,
        [limit],
      );
      for (const row of rows)
        await add(row, "recovery_requests.read", {
          id: `recovery:${row.id}`,
          type: "recovery",
          title: "درخواست بازیابی برنامه",
          description: row.message || "درخواست بازیابی نیازمند بررسی است.",
          descriptionKind: row.message ? "user" : "system",
          priority: "high",
          dueAt: row.planDate || null,
          status: "open",
          student: { id: row.studentId!, name: row.studentName || "دانش‌آموز" },
          deepLink: "/admin/follow-up",
          createdAt: row.createdAt || null,
        });
    }
    if (can("students.read")) {
      const rows: Row[] = await this.db.query(
        `SELECT i.id,i.studentId,s.name studentName,i.createdAt,i.description message FROM task_issues i JOIN students s ON s.id=i.studentId WHERE i.status='OPEN' ORDER BY i.createdAt DESC LIMIT ?`,
        [limit],
      );
      for (const row of rows)
        await add(row, "students.read", {
          id: `task_issue:${row.id}`,
          type: "task_issue",
          title: "مسئله فعالیت",
          description:
            row.message || "دانش‌آموز برای یک فعالیت مشکل ثبت کرده است.",
          descriptionKind: row.message ? "user" : "system",
          priority: "high",
          dueAt: null,
          status: "open",
          student: { id: row.studentId!, name: row.studentName || "دانش‌آموز" },
          deepLink: `/admin/students?studentId=${encodeURIComponent(row.studentId!)}`,
          createdAt: row.createdAt || null,
        });
    }
    if (can("exams.read")) {
      const rows: Row[] = await this.db.query(
        `SELECT r.id,r.studentId,s.name studentName,r.createdAt,r.message FROM exam_retry_requests r JOIN students s ON s.id=r.studentId WHERE r.status='pending' ORDER BY r.createdAt DESC LIMIT ?`,
        [limit],
      );
      for (const row of rows)
        await add(row, "exams.read", {
          id: `retry:${row.id}`,
          type: "retry_request",
          title: "درخواست تلاش مجدد آزمون",
          description:
            row.message || "درخواست تلاش مجدد نیازمند تصمیم‌گیری است.",
          descriptionKind: row.message ? "user" : "system",
          priority: "normal",
          dueAt: null,
          status: "open",
          student: { id: row.studentId!, name: row.studentName || "دانش‌آموز" },
          deepLink: `/admin/exams?studentId=${encodeURIComponent(row.studentId!)}`,
          createdAt: row.createdAt || null,
        });
    }
    if (can("chat.read")) {
      const rows: Row[] = await this.db.query(
        `SELECT c.id conversationId,MAX(m.createdAt) createdAt,COUNT(*) message FROM chat_messages m JOIN conversation_members c ON c.conversationId=m.conversationId WHERE c.userId=? AND c.leftAt IS NULL AND m.senderId<>? AND m.readAt IS NULL GROUP BY c.conversationId ORDER BY MAX(m.createdAt) DESC LIMIT ?`,
        [context.id, context.id, limit],
      );
      for (const row of rows)
        items.push({
          id: `chat:${row.conversationId}`,
          type: "unread_chat",
          title: "گفت‌وگوی خوانده‌نشده",
          description: `${Number(row.message || 0).toLocaleString("fa-IR")} پیام منتظر پاسخ یا مشاهده است.`,
          descriptionKind: "system",
          priority: "normal",
          owner: { id: context.id, label: "شما" },
          dueAt: null,
          status: "open",
          deepLink: `/admin/communication/chat?conversationId=${encodeURIComponent(row.conversationId!)}`,
          createdAt: row.createdAt || null,
        });
    }
    if (can("student.live.read")) {
      const rows: Row[] = await this.db.query(
        `SELECT h.id,h.studentId,s.name studentName,h.updatedAt,h.failureCode,h.deviceId FROM student_sync_health h JOIN students s ON s.id=h.studentId WHERE h.status='failed' ORDER BY h.updatedAt DESC LIMIT ?`,
        [limit],
      );
      for (const row of rows)
        await add(row, "student.live.read", {
          id: `sync:${row.id}`,
          type: "sync_failure",
          title: "همگام‌سازی ناموفق",
          description: `دستگاه ${row.deviceId || "نامشخص"}${row.failureCode ? ` با خطای ${row.failureCode}` : ""} نیازمند بررسی است.`,
          descriptionKind: "system",
          priority: "urgent",
          dueAt: null,
          status: "open",
          student: { id: row.studentId!, name: row.studentName || "دانش‌آموز" },
          deepLink: `/admin/communication/live?studentId=${encodeURIComponent(row.studentId!)}`,
          createdAt: row.updatedAt || null,
          meta: {
            deviceId: row.deviceId || "",
            failureCode: row.failureCode || "",
          },
        });
    }
    if (can("users.read") && context.roles.includes("PLATFORM_ADMIN")) {
      const rows: Row[] = await this.db.query(
        `SELECT u.id,u.username,u.updatedAt,u.status message FROM users u WHERE u.status<>'ACTIVE' ORDER BY u.updatedAt DESC LIMIT ?`,
        [limit],
      );
      for (const row of rows)
        items.push({
          id: `inactive_user:${row.id}`,
          type: "inactive_user",
          title: "حساب غیرفعال",
          description: `حساب ${row.username || "کاربر"} در وضعیت ${row.message || "غیرفعال"} است.`,
          descriptionKind: "system",
          priority: "normal",
          owner: { id: context.id, label: "مسئول پلتفرم" },
          dueAt: null,
          status: "open",
          deepLink: "/admin/users",
          createdAt: row.updatedAt || null,
        });
    }
    const rank = { urgent: 0, high: 1, normal: 2 };
    return {
      generatedAt: new Date().toISOString(),
      items: items
        .sort((a, b) => {
          const priorityOrder = rank[a.priority] - rank[b.priority];
          if (priorityOrder) return priorityOrder;
          // A concrete due date is more actionable than an undated item of
          // the same priority. Keep the oldest unresolved items next.
          const dueOrder =
            a.dueAt && b.dueAt
              ? a.dueAt.localeCompare(b.dueAt)
              : a.dueAt
                ? -1
                : b.dueAt
                  ? 1
                  : 0;
          return (
            dueOrder ||
            String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
          );
        })
        .slice(0, limit),
    };
  }
  private planHealth(ids: string[]) {
    const marks = ids.map(() => "?").join(",");
    return this.db
      .query(
        `SELECT COUNT(DISTINCT p.id)plans,COUNT(t.id)tasks,SUM(CASE WHEN t.completedAt IS NOT NULL OR t.status='DONE' THEN 1 ELSE 0 END)completed FROM plans p LEFT JOIN tasks t ON t.planId=p.id WHERE p.studentId IN (${marks}) AND p.date=date('now')`,
        ids,
      )
      .then((r) => r[0]);
  }
  private upcomingExams(ids: string[]) {
    const marks = ids.map(() => "?").join(",");
    return this.db.query(
      `SELECT DISTINCT e.id,e.title,e.subject,e.startTime FROM exams e JOIN exam_assignments a ON a.examId=e.id WHERE a.studentId IN (${marks}) AND (e.startTime IS NULL OR e.startTime>=datetime('now')) ORDER BY e.startTime LIMIT 10`,
      ids,
    );
  }
}
