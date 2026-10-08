"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudySessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const student_entity_1 = require("../../database/entities/student.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const notifications_1 = require("../notifications");
let StudySessionsService = class StudySessionsService {
    sessions;
    students;
    tasks;
    relationships;
    notifications;
    constructor(sessions, students, tasks, relationships, notifications) {
        this.sessions = sessions;
        this.students = students;
        this.tasks = tasks;
        this.relationships = relationships;
        this.notifications = notifications;
    }
    async start(userId, taskId) {
        const student = await this.studentForUser(userId);
        const task = await this.tasks.findOne({ where: { id: taskId, plan: { student: { id: student.id } } }, relations: { plan: true } });
        if (!task)
            throw this.notFound();
        const existing = await this.sessions.findOne({ where: { student: { id: student.id }, status: study_session_entity_1.StudySessionStatus.ACTIVE } });
        if (existing)
            return this.publicSession(existing);
        const now = new Date();
        const session = await this.sessions.save(this.sessions.create({
            student,
            task,
            status: study_session_entity_1.StudySessionStatus.ACTIVE,
            startedAt: now,
            lastStartedAt: now,
            lastHeartbeatAt: now,
            elapsedSeconds: 0,
        }));
        return this.publicSession(session);
    }
    async active(userId) {
        const student = await this.studentForUser(userId);
        const session = await this.sessions.findOne({ where: { student: { id: student.id }, status: study_session_entity_1.StudySessionStatus.ACTIVE }, relations: { task: true } });
        return session ? this.publicSession(session) : null;
    }
    async heartbeat(userId, sessionId) {
        const session = await this.sessionForUser(userId, sessionId);
        if (session.status !== study_session_entity_1.StudySessionStatus.ACTIVE)
            return this.publicSession(session);
        const now = new Date();
        session.elapsedSeconds += this.secondsSince(session.lastStartedAt || session.startedAt, now);
        session.lastStartedAt = now;
        session.lastHeartbeatAt = now;
        const saved = await this.sessions.save(session);
        await this.notifyOvertime(saved);
        return this.publicSession(saved);
    }
    async pause(userId, sessionId) {
        const session = await this.sessionForUser(userId, sessionId);
        if (session.status === study_session_entity_1.StudySessionStatus.FINISHED)
            return this.publicSession(session);
        const now = new Date();
        if (session.status === study_session_entity_1.StudySessionStatus.ACTIVE) {
            session.elapsedSeconds += this.secondsSince(session.lastStartedAt || session.startedAt, now);
            session.pausedAt = now;
            session.lastHeartbeatAt = now;
            session.status = study_session_entity_1.StudySessionStatus.PAUSED;
        }
        return this.publicSession(await this.sessions.save(session));
    }
    async resume(userId, sessionId) {
        const session = await this.sessionForUser(userId, sessionId);
        if (session.status === study_session_entity_1.StudySessionStatus.PAUSED) {
            const now = new Date();
            session.status = study_session_entity_1.StudySessionStatus.ACTIVE;
            session.lastStartedAt = now;
            session.lastHeartbeatAt = now;
        }
        return this.publicSession(await this.sessions.save(session));
    }
    async finish(userId, sessionId, dto) {
        const session = await this.sessionForUser(userId, sessionId);
        if (session.status !== study_session_entity_1.StudySessionStatus.FINISHED) {
            const now = new Date();
            if (session.status === study_session_entity_1.StudySessionStatus.ACTIVE)
                session.elapsedSeconds += this.secondsSince(session.lastStartedAt || session.startedAt, now);
            session.status = study_session_entity_1.StudySessionStatus.FINISHED;
            session.finishedAt = now;
            session.lastHeartbeatAt = now;
            session.actualTests = dto.actualTests ?? session.actualTests;
            session.difficulty = dto.difficulty ?? session.difficulty;
            session.note = dto.note ?? session.note;
        }
        return this.publicSession(await this.sessions.save(session));
    }
    async studentForUser(userId) {
        const student = await this.students.findOne({ where: { user: { id: userId } } });
        if (!student)
            throw this.notFound();
        return student;
    }
    async sessionForUser(userId, sessionId) {
        const session = await this.sessions.findOne({ where: { id: sessionId, student: { user: { id: userId } } }, relations: { task: true, student: true } });
        if (!session)
            throw this.notFound();
        return session;
    }
    publicSession(session) {
        return {
            id: session.id,
            taskId: session.task?.id,
            status: session.status,
            startedAt: session.startedAt,
            lastHeartbeatAt: session.lastHeartbeatAt,
            pausedAt: session.pausedAt,
            finishedAt: session.finishedAt,
            elapsedSeconds: session.elapsedSeconds,
            actualTests: session.actualTests,
            difficulty: session.difficulty,
            note: session.note,
        };
    }
    secondsSince(start, end) {
        return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    }
    async notifyOvertime(session) {
        const limitSeconds = Math.max(0, Number(session.task?.duration || 0) * 60);
        if (!limitSeconds || session.elapsedSeconds < limitSeconds || !this.relationships || !this.notifications || !session.student?.id)
            return;
        const advisers = await this.relationships.find({
            where: { toStudent: { id: session.student.id }, type: user_relationship_entity_1.RelationshipType.ADVISOR_OF, status: user_relationship_entity_1.RelationshipStatus.ACTIVE },
            relations: { fromUser: true },
        });
        if (!advisers.length)
            return;
        const excessiveAt = Math.max(Math.ceil(limitSeconds * 1.5), limitSeconds + 15 * 60);
        const overtimeMinutes = Math.max(0, Math.floor((session.elapsedSeconds - limitSeconds) / 60));
        const studentName = session.student.name || "دانش‌آموز";
        const taskTitle = session.task.title || session.task.subject || "تکلیف مطالعه";
        const recipients = advisers.map((item) => item.fromUser.id);
        const notify = (level) => this.notifications.createForUsers(recipients, {
            type: "STUDY_OVERTIME", category: "study", priority: level === "excessive" ? "high" : "normal",
            title: level === "excessive" ? "ادامه طولانی جلسه مطالعه" : "رسیدن به سقف زمان مطالعه",
            body: level === "excessive"
                ? `${studentName} مطالعه «${taskTitle}» را ${overtimeMinutes.toLocaleString("fa-IR")} دقیقه بیشتر از زمان تعیین‌شده ادامه داده است.`
                : `${studentName} به سقف ${Math.round(limitSeconds / 60).toLocaleString("fa-IR")} دقیقه‌ای مطالعه «${taskTitle}» رسیده و همچنان ادامه می‌دهد.`,
            url: `/admin/planner?studentId=${encodeURIComponent(session.student.id)}`,
            data: { studentId: session.student.id, taskId: session.task.id, sessionId: session.id, level, elapsedSeconds: session.elapsedSeconds, limitSeconds },
            dedupeKey: `study-overtime:${session.id}:${level}`,
        });
        await notify("limit");
        if (session.elapsedSeconds >= excessiveAt)
            await notify("excessive");
    }
    notFound() {
        return new api_exception_1.ApiException(404, "STUDY_SESSION_NOT_FOUND", "جلسه مطالعه پیدا نشد.");
    }
};
exports.StudySessionsService = StudySessionsService;
exports.StudySessionsService = StudySessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(study_session_entity_1.StudySession)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_1.NotificationsService])
], StudySessionsService);
//# sourceMappingURL=study-sessions.service.js.map