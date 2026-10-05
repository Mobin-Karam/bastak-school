import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { clampActivityLimit, normalizePresenceState, projectPresence, shouldPersistPresence } from "@moshaver/cmb-activity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, LessThan, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { ActivityEvent } from "../../database/entities/activity-event.entity";
import { Student } from "../../database/entities/student.entity";
import { StudentPresence } from "../../database/entities/student-presence.entity";
import { StudentSyncHealth } from "../../database/entities/student-sync-health.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { Task } from "../../database/entities/task.entity";
import { AuthenticatedUser } from "../auth";
import {
  AuthorizationService,
  UserContext,
} from "../authorization";
const EVENT_TYPES = [
  "study_started",
  "study_finished",
  "task_completed",
  "exam_started",
  "exam_submitted",
  "quiz_started",
  "quiz_submitted",
];
const SYNC_FAILURE_CODES = new Set(["NETWORK_UNAVAILABLE", "AUTHORIZATION", "CONFLICT", "VALIDATION", "SYNC_WORKER_FAILED", "UNKNOWN"]);
@Injectable()
export class ActivityService implements OnModuleInit {
  private readonly logger = new Logger(ActivityService.name);
  constructor(
    @InjectRepository(StudentPresence)
    private presence: Repository<StudentPresence>,
    @InjectRepository(StudentSyncHealth) private syncHealthRepo: Repository<StudentSyncHealth>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
    @InjectRepository(ActivityEvent) private events: Repository<ActivityEvent>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(Task) private tasks: Repository<Task>,
    private authorization: AuthorizationService,
    private db: DataSource,
  ) {}
  async onModuleInit() {
    try { await this.purgeStaleSyncHealth(); }
    catch (error) { this.logger.warn(`Sync-health retention cleanup was skipped: ${error instanceof Error ? error.message : "unknown error"}`); }
  }
  private student(userId: string) {
    return this.students.findOneOrFail({ where: { user: { id: userId } } });
  }
  async heartbeat(
    userId: string,
    input: { state?: string; currentTaskId?: string | null; syncStatus?: string },
  ) {
    const student = await this.student(userId);
    const state = normalizePresenceState(input.state);
    const syncStatus = ["online", "syncing", "failed", "offline"].includes(input.syncStatus || "") ? input.syncStatus as StudentPresence["syncStatus"] : "online";
    const now = new Date();
    let row = await this.presence.findOne({
      where: { student: { id: student.id } },
      relations: { currentTask: true },
    });
    const currentTask = input.currentTaskId
      ? await this.tasks.findOne({
          where: {
            id: input.currentTaskId,
            plan: { student: { id: student.id } },
          },
        })
      : null;
    if (input.currentTaskId && !currentTask)
      throw new ApiException(404, "TASK_NOT_FOUND", "فعالیت پیدا نشد.");
    if (row && row.syncStatus === syncStatus && !shouldPersistPresence({ state: row.state, resourceId: row.currentTask?.id, lastSeenAt: row.lastSeenAt }, { state, resourceId: currentTask?.id }, now))
      return this.publicPresence(row, now);
    row ||= this.presence.create({ student });
    Object.assign(row, { state, syncStatus, currentTask, lastSeenAt: now });
    return this.publicPresence(await this.presence.save(row), now);
  }
  async record(
    userId: string,
    input: {
      type: string;
      resourceType?: string;
      resourceId?: string;
      data?: Record<string, unknown>;
    },
  ) {
    if (!EVENT_TYPES.includes(input.type))
      throw new ApiException(
        400,
        "ACTIVITY_TYPE_INVALID",
        "نوع رویداد معتبر نیست.",
      );
    const student = await this.student(userId);
    return this.events.save(
      this.events.create({
        student,
        type: input.type,
        resourceType: String(input.resourceType || "").slice(0, 40),
        resourceId: String(input.resourceId || "").slice(0, 100),
        data: input.data || null,
      }),
    );
  }
  async reportSyncHealth(userId: string, input: { deviceId?: string; status?: string; pendingCount?: number; failureCode?: string; correlationId?: string }) {
    const student = await this.student(userId);
    const deviceId = String(input.deviceId || "").trim();
    if (!/^[a-zA-Z0-9:_-]{8,96}$/.test(deviceId)) throw new ApiException(400, "SYNC_DEVICE_INVALID", "شناسه دستگاه معتبر نیست.");
    const status = ["online", "syncing", "failed", "offline"].includes(input.status || "") ? input.status as StudentSyncHealth["status"] : "online";
    const pendingCount = Math.max(0, Math.min(10_000, Number.isInteger(input.pendingCount) ? input.pendingCount! : 0));
    const correlationId = String(input.correlationId || "").trim();
    if (correlationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(correlationId)) throw new ApiException(400, "SYNC_CORRELATION_INVALID", "شناسه پیگیری همگام‌سازی معتبر نیست.");
    let row = await this.syncHealthRepo.findOne({ where: { student: { id: student.id }, deviceId } });
    row ||= this.syncHealthRepo.create({ student, deviceId });
    Object.assign(row, { status, pendingCount, correlationId: correlationId || null, failureCode: status === "failed" ? this.normalizeSyncFailureCode(input.failureCode) : null, lastSuccessfulAt: status === "online" && pendingCount === 0 ? new Date() : row.lastSuccessfulAt || null });
    return this.publicSyncHealth(await this.syncHealthRepo.save(row));
  }
  async syncHealth(context: UserContext, studentId: string) {
    if (!(await this.authorization.canAccessStudent(context, studentId, "student.activity.read"))) throw new ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
    return (await this.syncHealthRepo.find({ where: { student: { id: studentId } }, order: { updatedAt: "DESC" }, take: 10 })).map((row) => this.publicSyncHealth(row));
  }
  async reviewSyncHealth(context: UserContext, studentId: string) {
    if (!(await this.authorization.canAccessStudent(context, studentId, "student.sync.support"))) throw new ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
    const health = await this.syncHealthRepo.find({ where: { student: { id: studentId } }, order: { updatedAt: "DESC" }, take: 10 });
    await this.audit.save(this.audit.create({ user: { id: context.id } as any, action: "student.sync_health_reviewed", entity: "student_sync_health", metadata: { studentId, devices: health.map((row) => ({ deviceId: row.deviceId, correlationId: row.correlationId || null, status: row.status, pendingCount: row.pendingCount })) } }));
    return { reviewed: true, devices: health.length };
  }
  async history(context: UserContext, studentId: string, limit = 50) {
    if (
      !(await this.authorization.canAccessStudent(
        context,
        studentId,
        "student.activity.read",
      ))
    )
      throw new ApiException(
        403,
        "STUDENT_FORBIDDEN",
        "به این دانش‌آموز دسترسی ندارید.",
      );
    return this.events.find({
      where: { student: { id: studentId } },
      order: { createdAt: "DESC" },
      take: clampActivityLimit(limit),
    });
  }
  async live(context: UserContext) {
    const all = await this.students.find({
        relations: { user: true },
        order: { createdAt: "DESC" },
      }),
      allowed = [];
    for (const student of all)
      if (
        await this.authorization.canAccessStudent(
          context,
          student.id,
          "student.live.read",
        )
      )
        allowed.push(student);
    const out = [];
    for (const student of allowed) {
      const [presence, attention] = await Promise.all([
        this.presence.findOne({
          where: { student: { id: student.id } },
          relations: { currentTask: true },
        }),
        this.attention(student.id),
      ]);
      out.push({
        id: student.id,
        name: student.name,
        grade: student.grade,
        major: student.major,
        presence: presence
          ? this.publicPresence(presence)
          : {
              online: false,
              state: "offline",
              lastSeenAt: null,
              currentTask: null,
            },
        attention,
      });
    }
    return out;
  }
  async attentionList(context: UserContext) {
    const rows = await this.live(context);
    return rows
      .filter((x) => x.attention.score > 0)
      .sort((a, b) => b.attention.score - a.attention.score);
  }
  private async attention(studentId: string) {
    const [missed, noStudy, upcoming, recovery, issues, presence] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)n FROM tasks t JOIN plans p ON p.id=t.planId WHERE p.studentId=? AND p.date<=date('now') AND t.completedAt IS NULL AND t.status<>'DONE'`,
        [studentId],
      ),
      this.db.query(
        `SELECT COUNT(*)n FROM study_sessions WHERE studentId=? AND startedAt>=datetime('now','-3 day')`,
        [studentId],
      ),
      this.db.query(
        `SELECT COUNT(*)n FROM exam_assignments a JOIN exams e ON e.id=a.examId WHERE a.studentId=? AND e.startTime BETWEEN datetime('now') AND datetime('now','+3 day')`,
        [studentId],
      ),
      this.db.query(
        `SELECT COUNT(*)n FROM recovery_requests WHERE studentId=? AND status='PENDING'`,
        [studentId],
      ),
      this.db.query(
        `SELECT COUNT(*)n FROM task_issues WHERE studentId=? AND status='OPEN'`,
        [studentId],
      ),
      this.presence.findOne({ where: { student: { id: studentId } } }),
    ]);
    const signals = [];
    if (missed[0].n)
      signals.push({ type: "MISSED_TASKS", count: missed[0].n, weight: 2 });
    if (!noStudy[0].n)
      signals.push({ type: "NO_RECENT_STUDY", count: 1, weight: 2 });
    if (upcoming[0].n)
      signals.push({ type: "UPCOMING_EXAM", count: upcoming[0].n, weight: 1 });
    if (recovery[0].n)
      signals.push({ type: "OPEN_RECOVERY", count: recovery[0].n, weight: 3 });
    if (issues[0].n)
      signals.push({ type: "TASK_ISSUE", count: issues[0].n, weight: 3 });
    if (presence?.syncStatus === "failed")
      signals.push({ type: "SYNC_FAILED", count: 1, weight: 4 });
    return { score: signals.reduce((n, s) => n + s.weight, 0), signals };
  }
  private publicSyncHealth(row: StudentSyncHealth) { return { deviceId: row.deviceId, correlationId: row.correlationId || null, status: row.status, pendingCount: row.pendingCount, failureCode: row.failureCode || null, lastSuccessfulAt: row.lastSuccessfulAt?.toISOString() || null, updatedAt: row.updatedAt.toISOString() }; }
  private normalizeSyncFailureCode(value?: string) {
    const normalized = String(value || "UNKNOWN").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 80);
    return SYNC_FAILURE_CODES.has(normalized) ? normalized : "UNKNOWN";
  }
  private async purgeStaleSyncHealth() {
    const configuredDays = Number(process.env.SYNC_HEALTH_RETENTION_DAYS || 90);
    const days = Number.isFinite(configuredDays) ? Math.max(7, Math.min(365, Math.floor(configuredDays))) : 90;
    await this.syncHealthRepo.delete({ updatedAt: LessThan(new Date(Date.now() - days * 86_400_000)) });
  }
  private publicPresence(row: StudentPresence, now = new Date()) {
    return { ...projectPresence({ state: row.state, lastSeenAt: row.lastSeenAt, resource: row.currentTask }, now), syncStatus: row.syncStatus };
  }
}
