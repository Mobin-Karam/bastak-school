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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const recommendation_entity_1 = require("../../database/entities/recommendation.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const recommendation_entity_2 = require("../../database/entities/recommendation.entity");
const authorization_1 = require("../authorization");
let AnalyticsService = class AnalyticsService {
    db;
    students;
    recommendations;
    users;
    authorization;
    constructor(db, students, recommendations, users, authorization) {
        this.db = db;
        this.students = students;
        this.recommendations = recommendations;
        this.users = users;
        this.authorization = authorization;
    }
    async analytics(context, studentId, projection = "staff") { if (!await this.authorization.canAccessStudent(context, studentId, "analytics.read") && projection !== "self")
        throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید."); return this.metrics(studentId, projection); }
    async self(userId) { const student = await this.students.findOneByOrFail({ user: { id: userId } }); return this.metrics(student.id, "self"); }
    async metrics(studentId, projection) { const one = async (sql) => (await this.db.query(sql, [studentId]))[0]; const [tasks, study, exams, quiz, reviews, subjects] = await Promise.all([one(`SELECT COUNT(*)total,SUM(CASE WHEN t.completedAt IS NOT NULL OR t.status='DONE' THEN 1 ELSE 0 END)completed FROM tasks t JOIN plans p ON p.id=t.planId WHERE p.studentId=?`), one(`SELECT SUM(elapsedSeconds)seconds,COUNT(*)sessions FROM study_sessions WHERE studentId=? AND status='FINISHED'`), one(`SELECT AVG(score)average,COUNT(*)attempts FROM exam_attempts WHERE studentId=? AND finishedAt IS NOT NULL`), one(`SELECT AVG(percent)average,COUNT(*)attempts FROM quiz_attempts WHERE studentId=? AND submittedAt IS NOT NULL`), one(`SELECT COUNT(*)reviews,AVG(newMastery)mastery FROM learning_reviews r JOIN learning_items i ON i.id=r.itemId WHERE i.studentId=?`), this.db.query(`SELECT i.subject,COUNT(*)items,AVG(i.mastery)mastery FROM learning_items i WHERE i.studentId=? GROUP BY i.subject`, [studentId])]); const completion = tasks.total ? Math.round(tasks.completed / tasks.total * 100) : null; const result = { studentId, planCompletion: completion, taskCompletion: completion, studyDurationMinutes: study.seconds == null ? null : Math.round(study.seconds / 60), studySessions: study.sessions || 0, examPerformance: exams.average == null ? null : Math.round(exams.average * 10) / 10, examAttempts: exams.attempts || 0, questionAccuracy: quiz.average == null ? null : Math.round(quiz.average * 10) / 10, quizAttempts: quiz.attempts || 0, reviewConsistency: reviews.reviews || 0, averageMastery: reviews.mastery == null ? null : Math.round(reviews.mastery * 10) / 10, subjectPerformance: subjects }; if (projection === "guardian")
        return { studentId, planCompletion: result.planCompletion, studyDurationMinutes: result.studyDurationMinutes, examPerformance: result.examPerformance, encouragement: "روند را با حمایت و گفت‌وگو دنبال کنید." }; return result; }
    async listRecommendations(context, studentId, includeEvidence = true) { if (!await this.authorization.canAccessStudent(context, studentId, "recommendations.read"))
        throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "دسترسی ندارید."); const rows = await this.recommendations.find({ where: { student: { id: studentId } }, order: { createdAt: "DESC" } }); return includeEvidence ? rows : rows.map(({ evidence: _e, reason: _r, ...x }) => x); }
    async selfRecommendations(userId) { const student = await this.students.findOneByOrFail({ user: { id: userId } }); const rows = await this.recommendations.find({ where: { student: { id: student.id }, status: recommendation_entity_2.RecommendationStatus.PROPOSED }, order: { createdAt: "DESC" } }); return rows.map(r => ({ id: r.id, type: r.type, title: r.title, status: r.status, createdAt: r.createdAt })); }
    async createRecommendation(context, userId, studentId, input) { if (!await this.authorization.canAccessStudent(context, studentId, "recommendations.manage"))
        throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "دسترسی ندارید."); const [student, user] = await Promise.all([this.students.findOneByOrFail({ id: studentId }), this.users.findOneByOrFail({ id: userId })]); return this.recommendations.save(this.recommendations.create({ student, createdByUser: user, createdByType: "STAFF", type: input.type, title: input.title, reason: input.reason, evidence: input.evidence, status: recommendation_entity_2.RecommendationStatus.PROPOSED })); }
    async act(userId, id, status) { const student = await this.students.findOneByOrFail({ user: { id: userId } }); const row = await this.recommendations.findOne({ where: { id, student: { id: student.id } } }); if (!row)
        throw new api_exception_1.ApiException(404, "RECOMMENDATION_NOT_FOUND", "پیشنهاد پیدا نشد."); if (![recommendation_entity_2.RecommendationStatus.ACCEPTED, recommendation_entity_2.RecommendationStatus.REJECTED, recommendation_entity_2.RecommendationStatus.DISMISSED].includes(status))
        throw new api_exception_1.ApiException(400, "STATUS_INVALID", "وضعیت معتبر نیست."); row.status = status; row.actedAt = new Date(); return this.recommendations.save(row); }
    studentHealth(studentId) { return this.metrics(studentId, "staff"); }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(recommendation_entity_1.Recommendation)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.DataSource, typeorm_2.Repository, typeorm_2.Repository, typeorm_2.Repository, authorization_1.AuthorizationService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map