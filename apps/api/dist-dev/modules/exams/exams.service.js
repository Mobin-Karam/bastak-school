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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exam_attempt_entity_1 = require("../../database/entities/exam-attempt.entity");
const exam_entity_1 = require("../../database/entities/exam.entity");
const question_entity_1 = require("../../database/entities/question.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const api_exception_1 = require("../../common/exceptions/api.exception");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const typeorm_3 = require("typeorm");
const organization_entity_1 = require("../../database/entities/organization.entity");
const mistake_entity_1 = require("../../database/entities/mistake.entity");
const exam_scoring_service_1 = require("./exam-scoring.service");
const exam_retry_request_entity_1 = require("../../database/entities/exam-retry-request.entity");
const exam_class_assignment_entity_1 = require("../../database/entities/exam-class-assignment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
let ExamsService = class ExamsService {
    exams;
    questions;
    attempts;
    students;
    assignments;
    users;
    dataSource;
    mistakes;
    scoringEngine;
    retryRequests;
    classAssignments;
    classes;
    classEnrollments;
    constructor(exams, questions, attempts, students, assignments, users, dataSource, mistakes, scoringEngine, retryRequests, classAssignments, classes, classEnrollments) {
        this.exams = exams;
        this.questions = questions;
        this.attempts = attempts;
        this.students = students;
        this.assignments = assignments;
        this.users = users;
        this.dataSource = dataSource;
        this.mistakes = mistakes;
        this.scoringEngine = scoringEngine;
        this.retryRequests = retryRequests;
        this.classAssignments = classAssignments;
        this.classes = classes;
        this.classEnrollments = classEnrollments;
    }
    async list(includeAnswers = true) {
        const exams = await this.exams.find({ relations: { questions: true } });
        return exams.map((exam) => this.publicExam(exam, includeAnswers));
    }
    async listScoped(organizationIds, platform, includeAnswers = true) {
        const exams = await this.exams.find({
            where: platform ? {} : { organization: { id: (0, typeorm_3.In)(organizationIds) } },
            relations: {
                questions: true,
                organization: true,
                assignments: true,
                attempts: true,
                syllabus: true,
            },
        });
        return exams.map((exam) => this.publicExam(exam, includeAnswers));
    }
    async organizationIdForExam(id) {
        const exam = await this.exams.findOneOrFail({
            where: { id },
            relations: { organization: true },
        });
        return exam.organization?.id ?? null;
    }
    async examIdForQuestion(id) {
        const question = await this.questions.findOneOrFail({
            where: { id },
            relations: { exam: true },
        });
        return question.exam.id;
    }
    async analytics(examId) {
        const exam = await this.exams.findOne({
            where: { id: examId },
            relations: { questions: true },
        });
        if (!exam)
            throw new api_exception_1.ApiException(404, "EXAM_NOT_FOUND", "آزمون یافت نشد.");
        const attempts = await this.attempts.find({
            where: { exam: { id: examId }, status: (0, typeorm_3.In)(["submitted", "expired"]) },
            relations: { student: true },
        });
        const byGrade = new Map();
        for (const attempt of attempts) {
            const grade = attempt.student.grade || "نامشخص";
            const row = byGrade.get(grade) || { attempts: 0, total: 0 };
            row.attempts++;
            row.total += attempt.percentage ?? 0;
            byGrade.set(grade, row);
        }
        const questions = exam.questions.map((question) => {
            let correct = 0;
            let blank = 0;
            const responses = {
                a: 0,
                b: 0,
                c: 0,
                d: 0,
                blank: 0,
            };
            for (const attempt of attempts) {
                const selected = this.answerKey(question.options, attempt.answers.find((answer) => answer.questionId === question.id)
                    ?.selectedOption || "");
                if (!selected) {
                    blank++;
                    responses.blank++;
                }
                else {
                    responses[selected] = (responses[selected] || 0) + 1;
                    if (selected ===
                        this.answerKey(question.options, question.correctAnswer))
                        correct++;
                }
            }
            return {
                id: question.id,
                text: question.text,
                attempts: attempts.length,
                correct,
                blank,
                accuracy: attempts.length
                    ? Math.round((correct / attempts.length) * 100)
                    : null,
                responses,
            };
        });
        return {
            exam: { id: exam.id, title: exam.title },
            attempts: attempts.length,
            averagePercent: attempts.length
                ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / attempts.length)
                : null,
            byGrade: [...byGrade.entries()].map(([grade, value]) => ({
                grade,
                attempts: value.attempts,
                averagePercent: Math.round(value.total / value.attempts),
            })),
            questions,
        };
    }
    async listForStudent(userId) {
        const student = await this.studentForUser(userId);
        const exams = await this.exams.find({
            where: { published: true },
            relations: {
                questions: true,
                attempts: { student: true },
                syllabus: true,
            },
        });
        const visible = await this.visibleForStudent(exams, student);
        const bonuses = await this.retryBonuses(student.id);
        return visible.map((exam) => this.publicExam(exam, false, student.id, exam.attemptLimit + (bonuses.get(exam.id) || 0)));
    }
    async listForGuardianStudent(studentId) {
        const assigned = this.assignments
            ? await this.assignments.find({
                where: { student: { id: studentId } },
                relations: { exam: true },
            })
            : [];
        const ids = assigned.map((item) => item.exam.id);
        if (this.assignments && !ids.length)
            return [];
        const exams = await this.exams.find({
            where: this.assignments
                ? { id: (0, typeorm_3.In)(ids), published: true }
                : { published: true },
            relations: {
                questions: true,
                attempts: { student: true },
                syllabus: true,
            },
        });
        const bonuses = await this.retryBonuses(studentId);
        return exams.map((exam) => this.publicExam(exam, false, studentId, exam.attemptLimit + (bonuses.get(exam.id) || 0)));
    }
    async detail(examId, userId) {
        const student = await this.studentForUser(userId);
        await this.requireAssignment(examId, student.id);
        const exam = await this.exams.findOne({
            where: { id: examId, published: true },
            relations: {
                questions: true,
                attempts: { student: true },
                syllabus: true,
            },
        });
        if (!exam)
            throw new api_exception_1.ApiException(404, "EXAM_NOT_FOUND", "آزمون در دسترس نیست.");
        const allowedAttempts = await this.allowedAttempts(exam.id, student.id, exam.attemptLimit);
        return this.publicExam(exam, false, student.id, allowedAttempts);
    }
    async history(userId) {
        const student = await this.studentForUser(userId);
        const attempts = await this.attempts.find({
            where: { student: { id: student.id } },
            relations: { exam: true },
            order: { startedAt: "DESC" },
        });
        return attempts.map((attempt) => this.publicAttempt(attempt));
    }
    async progress(examId, userId) {
        const student = await this.studentForUser(userId);
        const attempt = await this.attempts.findOne({
            where: {
                exam: { id: examId },
                student: { id: student.id },
                finishedAt: (0, typeorm_2.IsNull)(),
            },
            relations: { exam: { questions: true } },
            order: { startedAt: "DESC" },
        });
        if (attempt && this.isExpired(attempt))
            return this.submit(attempt.id, [], userId);
        return attempt ? this.attemptProgress(attempt) : null;
    }
    async saveProgress(attemptId, answers, userId) {
        const student = await this.studentForUser(userId);
        const attempt = await this.attempts.findOne({
            where: { id: attemptId, student: { id: student.id } },
            relations: { exam: { questions: true } },
        });
        if (!attempt)
            throw new api_exception_1.ApiException(404, "ATTEMPT_NOT_FOUND", "تلاش آزمون پیدا نشد.");
        if (attempt.finishedAt)
            throw new api_exception_1.ApiException(409, "EXAM_ALREADY_SUBMITTED", "این آزمون قبلاً ثبت نهایی شده است.");
        if (this.isExpired(attempt))
            throw new api_exception_1.ApiException(409, "EXAM_ATTEMPT_EXPIRED", "زمان آزمون به پایان رسیده است.");
        const questionIds = new Set(attempt.exam.questions.map((question) => question.id));
        if (answers.some((answer) => !questionIds.has(answer.questionId)))
            throw new api_exception_1.ApiException(400, "QUESTION_NOT_IN_EXAM", "یکی از سؤال‌ها متعلق به این آزمون نیست.");
        const incoming = answers;
        this.enforceNavigationPolicy(attempt, incoming);
        const merged = this.mergeAnswers(attempt.answers || [], incoming);
        await this.attempts.update(attemptId, { answers: merged });
        return this.attemptProgress({ ...attempt, answers: merged });
    }
    async create(dto, actorUserId) {
        const [organization, createdBy] = await Promise.all([
            dto.organizationId
                ? this.exams.manager.findOneBy(organization_entity_1.Organization, { id: dto.organizationId })
                : Promise.resolve(null),
            actorUserId
                ? this.exams.manager.findOneBy(user_entity_1.User, { id: actorUserId })
                : Promise.resolve(null),
        ]);
        if (dto.organizationId && !organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان یافت نشد.");
        const exam = this.exams.create({
            title: dto.title,
            subject: dto.subject || "",
            duration: dto.duration || dto.durationMinutes || 1,
            attemptLimit: dto.attemptLimit || dto.maxAttempts || 1,
            published: dto.published ?? false,
            mode: dto.mode || "mock",
            description: dto.description || "",
            lifecycleStatus: dto.lifecycleStatus || (dto.published ? "scheduled" : "draft"),
            navigationMode: dto.navigationMode ||
                (dto.allowBackNavigation === false ? "sequential" : "free"),
            timerMode: dto.timerMode || "whole_exam",
            allowResume: dto.allowResume ?? true,
            allowLateStart: dto.allowLateStart ?? false,
            allowPracticeAfterDeadline: dto.allowPracticeAfterDeadline ?? false,
            autoSubmitOnTimeout: dto.autoSubmitOnTimeout ?? true,
            sessionPolicy: dto.sessionPolicy || "allow_resume",
            integrityMonitoring: dto.integrityMonitoring ?? false,
            instructions: dto.instructions || [],
            allowBackNavigation: dto.allowBackNavigation ?? true,
            scoring: this.normalizeScoring(dto.scoring),
            resultPolicy: dto.resultPolicy || "immediate",
            resultReleaseAt: nullableDate(dto.resultReleaseAt),
            answerKeyReleaseAt: nullableDate(dto.answerKeyReleaseAt),
            explanationReleaseAt: nullableDate(dto.explanationReleaseAt),
            rankingReleaseAt: nullableDate(dto.rankingReleaseAt),
            latestStartAt: nullableDate(dto.latestStartAt),
            resultsReleased: dto.resultPolicy === "manual" ? Boolean(dto.resultsReleased) : true,
            sections: dto.sections || [],
            startTime: dto.startTime || dto.openAt
                ? new Date(dto.startTime || dto.openAt || "")
                : null,
            endTime: dto.endTime || dto.closeAt
                ? new Date(dto.endTime || dto.closeAt || "")
                : null,
            questions: (dto.questions || []).map((question) => this.questions.create(this.normalizeQuestion(question))),
            organization,
            createdBy,
        });
        const saved = await this.exams.save(exam);
        return this.publicExam(await this.exams.findOneOrFail({
            where: { id: saved.id },
            relations: { questions: true },
        }));
    }
    async update(id, body) {
        const exam = await this.exams.findOneOrFail({
            where: { id },
            relations: { questions: true },
        });
        if (typeof body.title === "string")
            exam.title = body.title;
        if (typeof body.subject === "string")
            exam.subject = body.subject;
        const duration = body.durationMinutes ?? body.duration;
        if (duration !== undefined)
            exam.duration = Math.max(1, Number(duration));
        const attempts = body.maxAttempts ?? body.attemptLimit;
        if (attempts !== undefined)
            exam.attemptLimit = Math.max(1, Number(attempts));
        if (typeof body.published === "boolean")
            exam.published = body.published;
        if (["konkur", "mock", "practice", "quiz", "diagnostic"].includes(String(body.mode)))
            exam.mode = body.mode;
        if (Array.isArray(body.instructions))
            exam.instructions = body.instructions.map(String);
        if (typeof body.allowBackNavigation === "boolean")
            exam.allowBackNavigation = body.allowBackNavigation;
        if (body.scoring && typeof body.scoring === "object")
            exam.scoring = this.normalizeScoring(body.scoring);
        if (["immediate", "scheduled", "manual"].includes(String(body.resultPolicy)))
            exam.resultPolicy = body.resultPolicy;
        if (body.resultReleaseAt !== undefined)
            exam.resultReleaseAt = nullableDate(body.resultReleaseAt);
        if (body.answerKeyReleaseAt !== undefined)
            exam.answerKeyReleaseAt = nullableDate(body.answerKeyReleaseAt);
        if (body.explanationReleaseAt !== undefined)
            exam.explanationReleaseAt = nullableDate(body.explanationReleaseAt);
        if (body.rankingReleaseAt !== undefined)
            exam.rankingReleaseAt = nullableDate(body.rankingReleaseAt);
        if (body.latestStartAt !== undefined)
            exam.latestStartAt = nullableDate(body.latestStartAt);
        if (["free", "section_only", "sequential"].includes(String(body.navigationMode)))
            exam.navigationMode = body.navigationMode;
        if (["whole_exam", "per_section"].includes(String(body.timerMode)))
            exam.timerMode = body.timerMode;
        for (const key of [
            "allowResume",
            "allowLateStart",
            "allowPracticeAfterDeadline",
            "autoSubmitOnTimeout",
            "integrityMonitoring",
        ])
            if (typeof body[key] === "boolean")
                exam[key] = body[key];
        if (typeof body.resultsReleased === "boolean")
            exam.resultsReleased = body.resultsReleased;
        if (Array.isArray(body.sections))
            exam.sections = body.sections;
        if (body.openAt !== undefined || body.startTime !== undefined)
            exam.startTime = nullableDate(body.openAt ?? body.startTime);
        if (body.closeAt !== undefined || body.endTime !== undefined)
            exam.endTime = nullableDate(body.closeAt ?? body.endTime);
        await this.exams.save(exam);
        return this.publicExam(exam);
    }
    async remove(id) {
        await this.exams.delete(id);
        return { id, deleted: true };
    }
    async start(examId, userId) {
        const exam = await this.exams.findOne({
            where: { id: examId, published: true },
            relations: { questions: true },
        });
        if (!exam)
            throw new api_exception_1.ApiException(404, "EXAM_NOT_FOUND", "آزمون در دسترس نیست.");
        const student = await this.studentForUser(userId);
        await this.requireAssignment(examId, student.id);
        const active = await this.attempts.findOne({
            where: {
                exam: { id: examId },
                student: { id: student.id },
                finishedAt: (0, typeorm_2.IsNull)(),
            },
            relations: { exam: { questions: true } },
            order: { startedAt: "DESC" },
        });
        if (active)
            return this.attemptProgress(active);
        const now = new Date();
        if (exam.startTime && now < exam.startTime)
            throw new api_exception_1.ApiException(409, "EXAM_NOT_OPEN", "زمان شروع آزمون هنوز نرسیده است.");
        if (exam.endTime && now >= exam.endTime)
            throw new api_exception_1.ApiException(409, "EXAM_CLOSED", "مهلت شرکت در آزمون به پایان رسیده است.");
        if (exam.latestStartAt && now >= exam.latestStartAt && !exam.allowLateStart)
            throw new api_exception_1.ApiException(409, "EXAM_LATEST_START_PASSED", "مهلت شروع این آزمون به پایان رسیده است.");
        if (!exam.questions.length)
            throw new api_exception_1.ApiException(409, "EXAM_HAS_NO_QUESTIONS", "این آزمون هنوز سؤال قابل پاسخ ندارد.");
        const used = await this.attempts.count({
            where: { exam: { id: examId }, student: { id: student.id } },
        });
        const allowedAttempts = await this.allowedAttempts(examId, student.id, exam.attemptLimit);
        if (used >= allowedAttempts)
            throw new api_exception_1.ApiException(409, "ATTEMPT_LIMIT_REACHED", "تعداد دفعات مجاز آزمون تکمیل شده است.");
        const durationEnd = new Date(now.getTime() + exam.duration * 60_000);
        const expiresAt = exam.endTime && exam.endTime < durationEnd ? exam.endTime : durationEnd;
        const attempt = await this.attempts.save(this.attempts.create({
            exam,
            student,
            status: "active",
            startedAt: now,
            expiresAt,
            lastHeartbeatAt: now,
            currentSectionId: exam.sections?.[0]?.id || "",
        }));
        return this.attemptProgress({
            ...attempt,
            exam,
            answers: [],
        });
    }
    async submit(attemptId, answers = [], userId) {
        const student = await this.studentForUser(userId);
        const attempt = await this.attempts.findOne({
            where: { id: attemptId, student: { id: student.id } },
            relations: { exam: { questions: true } },
        });
        if (!attempt)
            throw new api_exception_1.ApiException(404, "ATTEMPT_NOT_FOUND", "تلاش آزمون پیدا نشد.");
        if (attempt.finishedAt)
            return this.result(attempt, attempt.answers || []);
        const finalAnswers = this.isExpired(attempt)
            ? attempt.answers || []
            : this.mergeAnswers(attempt.answers || [], answers);
        const evaluation = (this.scoringEngine || new exam_scoring_service_1.ExamScoringService()).evaluate(attempt.exam, finalAnswers);
        const score = Math.round(evaluation.percentage);
        const finishedAt = new Date();
        await this.attempts.update(attemptId, {
            answers: finalAnswers,
            score,
            status: this.isExpired(attempt) ? "expired" : "submitted",
            finishedAt,
            submittedAt: finishedAt,
            rawScore: evaluation.rawScore,
            percentage: evaluation.percentage,
            correctCount: evaluation.correct,
            incorrectCount: evaluation.wrong,
            unansweredCount: evaluation.unanswered,
        });
        const answerMap = new Map(finalAnswers.map((answer) => [
            answer.questionId,
            answer.selectedOption || "",
        ]));
        const questions = attempt.exam.questions || [];
        if (this.mistakes) {
            for (const question of questions.filter((item) => answerMap.get(item.id) &&
                answerMap.get(item.id) !== item.correctAnswer)) {
                const existing = await this.mistakes.findOne({
                    where: { studentId: student.id, questionId: question.id },
                });
                if (!existing)
                    await this.mistakes.save(this.mistakes.create({
                        studentId: student.id,
                        questionId: question.id,
                        reason: "",
                        resolved: false,
                    }));
            }
        }
        return this.result({
            ...attempt,
            answers: finalAnswers,
            score,
            percentage: evaluation.percentage,
            rawScore: evaluation.rawScore,
            correctCount: evaluation.correct,
            incorrectCount: evaluation.wrong,
            unansweredCount: evaluation.unanswered,
            finishedAt,
            submittedAt: finishedAt,
        }, finalAnswers);
    }
    async submitExam(examId, answers = [], userId) {
        const student = await this.studentForUser(userId);
        await this.requireAssignment(examId, student.id);
        const attempt = await this.attempts.findOne({
            where: {
                exam: { id: examId },
                student: { id: student.id },
                finishedAt: (0, typeorm_2.IsNull)(),
            },
            order: { startedAt: "DESC" },
        });
        if (!attempt)
            throw new api_exception_1.ApiException(409, "NO_ACTIVE_ATTEMPT", "تلاش فعالی برای این آزمون وجود ندارد.");
        return this.submit(attempt.id, answers, userId);
    }
    async heartbeat(examId, attemptId, userId, currentSectionId) {
        const student = await this.studentForUser(userId);
        const attempt = await this.attempts.findOne({
            where: {
                id: attemptId,
                exam: { id: examId },
                student: { id: student.id },
            },
            relations: { exam: true },
        });
        if (!attempt)
            throw new api_exception_1.ApiException(404, "EXAM_ATTEMPT_NOT_FOUND", "تلاش آزمون پیدا نشد.");
        if (attempt.finishedAt)
            throw new api_exception_1.ApiException(409, "EXAM_ALREADY_SUBMITTED", "این آزمون قبلاً ثبت نهایی شده است.");
        if (this.isExpired(attempt))
            throw new api_exception_1.ApiException(409, "EXAM_ATTEMPT_EXPIRED", "زمان آزمون به پایان رسیده است.");
        if (currentSectionId &&
            !attempt.exam.sections.some((section) => section.id === currentSectionId))
            throw new api_exception_1.ApiException(400, "SECTION_NOT_IN_EXAM", "دفترچه انتخاب‌شده متعلق به این آزمون نیست.");
        const lastHeartbeatAt = new Date();
        await this.attempts.update(attempt.id, {
            lastHeartbeatAt,
            ...(currentSectionId ? { currentSectionId } : {}),
        });
        return {
            attemptId: attempt.id,
            status: "active",
            serverTime: lastHeartbeatAt.toISOString(),
            expiresAt: this.deadline(attempt).toISOString(),
        };
    }
    result(attempt, answers, privileged = false) {
        const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedOption || ""]));
        const questions = attempt.exam.questions || [];
        const evaluation = (this.scoringEngine || new exam_scoring_service_1.ExamScoringService()).evaluate(attempt.exam, answers);
        const status = this.resultStatus(attempt.exam);
        const released = privileged || status === "released";
        const now = new Date();
        const answerKeyReleased = privileged ||
            Boolean(attempt.exam.answerKeyReleaseAt
                ? now >= attempt.exam.answerKeyReleaseAt
                : released);
        const explanationsReleased = privileged ||
            Boolean(attempt.exam.explanationReleaseAt
                ? now >= attempt.exam.explanationReleaseAt
                : answerKeyReleased);
        return {
            id: attempt.id,
            status,
            score: released ? (attempt.percentage ?? evaluation.percentage) : null,
            taraz: null,
            rank: null,
            percentile: null,
            correct: released ? evaluation.correct : undefined,
            wrong: released ? evaluation.wrong : undefined,
            unanswered: released ? evaluation.unanswered : undefined,
            total: questions.length,
            subjects: released ? evaluation.subjects : undefined,
            topics: released ? evaluation.topics : undefined,
            finishedAt: attempt.finishedAt,
            answerKeyReleased,
            explanationsReleased,
            review: answerKeyReleased
                ? questions.map((question) => ({
                    questionId: question.id,
                    question: question.text,
                    selectedOption: answerMap.get(question.id) || null,
                    correctOption: question.correctAnswer,
                    explanation: explanationsReleased
                        ? question.explanation
                        : undefined,
                    isCorrect: answerMap.get(question.id) === question.correctAnswer,
                    subject: question.subject,
                    topic: question.topic,
                }))
                : undefined,
        };
    }
    async studentForUser(userId) {
        const student = await this.students.findOne({
            where: { user: { id: userId } },
        });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return student;
    }
    isExpired(attempt) {
        return new Date() >= this.deadline(attempt);
    }
    deadline(attempt) {
        const durationEnd = attempt.expiresAt ||
            new Date(attempt.startedAt.getTime() + attempt.exam.duration * 60_000);
        return attempt.exam.endTime && attempt.exam.endTime < durationEnd
            ? attempt.exam.endTime
            : durationEnd;
    }
    attemptProgress(attempt) {
        const deadline = this.deadline(attempt);
        return {
            runId: attempt.id,
            startedAt: attempt.startedAt,
            examCloseAt: attempt.exam.endTime || null,
            deadlineAt: deadline.toISOString(),
            serverTime: new Date().toISOString(),
            finishedAt: attempt.finishedAt || null,
            savedAnswers: (attempt.answers || []).map((answer, index) => ({
                ...answer,
                clientUpdatedAt: answer.clientUpdatedAt || attempt.startedAt.toISOString(),
                revision: answer.revision ?? index + 1,
            })),
            remainingSeconds: Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 1000)),
            allowBackNavigation: attempt.exam.allowBackNavigation,
            navigationMode: attempt.exam.navigationMode ||
                (attempt.exam.allowBackNavigation ? "free" : "sequential"),
            timerMode: attempt.exam.timerMode || "whole_exam",
            currentSectionId: attempt.currentSectionId || attempt.exam.sections?.[0]?.id || "",
            sections: attempt.exam.sections || [],
            quiz: {
                id: attempt.exam.id,
                examId: attempt.exam.id,
                title: attempt.exam.title,
                durationMinutes: attempt.exam.duration,
                questions: (attempt.exam.questions || []).map((question) => ({
                    id: question.id,
                    question: question.text,
                    options: this.fourOptions(question.options),
                    subject: question.subject,
                    topic: question.topic,
                    sectionId: question.sectionId,
                    mediaUrl: question.mediaUrl,
                })),
            },
        };
    }
    enforceNavigationPolicy(attempt, incoming) {
        if (attempt.exam.allowBackNavigation !== false)
            return;
        const questionIndex = new Map(attempt.exam.questions.map((question, index) => [question.id, index]));
        const combined = [...(attempt.answers || []), ...incoming].filter((answer) => answer.visited);
        const furthest = combined.reduce((best, answer) => Math.max(best, questionIndex.get(answer.questionId) ?? -1), -1);
        const furthestVisit = combined
            .filter((answer) => (questionIndex.get(answer.questionId) ?? -1) === furthest)
            .map((answer) => Date.parse(answer.clientUpdatedAt || ""))
            .filter(Number.isFinite)
            .reduce((latest, value) => Math.max(latest, value), 0);
        const existing = new Map((attempt.answers || []).map((answer) => [answer.questionId, answer]));
        const changedEarlierAnswer = incoming.some((answer) => {
            const index = questionIndex.get(answer.questionId) ?? -1;
            const previous = existing.get(answer.questionId);
            const changed = !previous || (answer.revision ?? 0) > (previous.revision ?? 0);
            const changedAt = Date.parse(answer.clientUpdatedAt || "");
            return (changed &&
                index < furthest &&
                (!Number.isFinite(changedAt) || changedAt >= furthestVisit));
        });
        if (changedEarlierAnswer)
            throw new api_exception_1.ApiException(409, "BACK_NAVIGATION_FORBIDDEN", "بازگشت و تغییر پاسخ سؤال‌های قبلی در این آزمون مجاز نیست.");
    }
    publicAttempt(attempt, fallbackExam) {
        const exam = attempt.exam ||
            (typeof fallbackExam === "object" ? fallbackExam : undefined);
        const status = attempt.finishedAt ? this.resultStatus(exam) : "active";
        return {
            id: attempt.id,
            examId: exam?.id ??
                (typeof fallbackExam === "string" ? fallbackExam : undefined),
            title: exam?.title ?? "",
            status,
            score: status === "released" ? attempt.score : null,
            subjectSummary: status === "released" && exam
                ? this.subjectSummary(exam, attempt.answers || [])
                : undefined,
            startedAt: attempt.startedAt,
            finishedAt: attempt.finishedAt || null,
            answeredCount: (attempt.answers || []).filter((answer) => answer.selectedOption).length,
        };
    }
    subjectSummary(exam, answers) {
        const selected = new Map(answers.map((answer) => [answer.questionId, answer.selectedOption]));
        const rows = new Map();
        for (const question of exam.questions || []) {
            const subject = question.subject || exam.subject || "عمومی";
            const row = rows.get(subject) || {
                correct: 0,
                wrong: 0,
                unanswered: 0,
                total: 0,
            };
            const answer = selected.get(question.id);
            row.total += 1;
            if (!answer)
                row.unanswered += 1;
            else if (answer === question.correctAnswer)
                row.correct += 1;
            else
                row.wrong += 1;
            rows.set(subject, row);
        }
        return [...rows.entries()].map(([subject, row]) => ({
            subject,
            ...row,
            percentage: row.total ? Math.round((row.correct / row.total) * 100) : 0,
        }));
    }
    answerKey(options, answer) {
        const normalized = answer.trim().toLowerCase();
        const keys = ["a", "b", "c", "d"];
        if (keys.includes(normalized) && keys.indexOf(normalized) < options.length)
            return normalized;
        const index = options.indexOf(answer);
        return index >= 0 ? keys[index] : "";
    }
    publicExam(exam, includeAnswers = true, studentId, allowedAttempts = exam.attemptLimit) {
        const studentAttempts = studentId
            ? (exam.attempts || [])
                .filter((attempt) => attempt.student?.id === studentId)
                .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())
            : [];
        const activeAttempt = studentAttempts.find((attempt) => !attempt.finishedAt);
        const latestFinished = studentAttempts.find((attempt) => Boolean(attempt.finishedAt));
        const now = new Date();
        const beforeWindow = Boolean(exam.startTime && now < exam.startTime);
        const afterWindow = Boolean(exam.endTime && now >= exam.endTime);
        const attemptsUsed = studentAttempts.length;
        const canStart = Boolean(exam.published &&
            exam.questions?.length &&
            !beforeWindow &&
            !afterWindow &&
            (activeAttempt || attemptsUsed < allowedAttempts));
        const reason = beforeWindow
            ? "زمان شروع آزمون هنوز نرسیده است."
            : afterWindow
                ? "مهلت شرکت در آزمون به پایان رسیده است."
                : !exam.questions?.length
                    ? "آزمون هنوز سؤال ندارد."
                    : attemptsUsed >= allowedAttempts && !activeAttempt
                        ? "تعداد تلاش‌های مجاز تکمیل شده است."
                        : undefined;
        const state = activeAttempt
            ? "active"
            : latestFinished
                ? this.resultStatus(exam)
                : beforeWindow
                    ? "upcoming"
                    : afterWindow
                        ? "closed"
                        : canStart
                            ? "available"
                            : "closed";
        const status = exam.lifecycleStatus === "cancelled"
            ? "cancelled"
            : !exam.published || exam.lifecycleStatus === "draft"
                ? "draft"
                : activeAttempt
                    ? "live"
                    : latestFinished
                        ? this.resultStatus(exam) === "released"
                            ? "result_available"
                            : "result_pending"
                        : beforeWindow
                            ? "scheduled"
                            : afterWindow
                                ? "expired"
                                : "available";
        return {
            serverTime: now.toISOString(),
            id: exam.id,
            title: exam.title,
            description: exam.description || "",
            subject: exam.subject,
            subjects: [
                ...new Set([
                    exam.subject,
                    ...(exam.questions || []).map((question) => question.subject),
                ].filter(Boolean)),
            ],
            organization: exam.organization
                ? { id: exam.organization.id, name: exam.organization.name }
                : null,
            createdAt: exam.createdAt?.toISOString(),
            updatedAt: exam.updatedAt?.toISOString(),
            mode: exam.mode === "standard" ? "mock" : exam.mode,
            status,
            instructions: exam.instructions || [],
            allowBackNavigation: exam.allowBackNavigation ?? true,
            navigationMode: exam.navigationMode ||
                (exam.allowBackNavigation ? "free" : "sequential"),
            timerMode: exam.timerMode || "whole_exam",
            allowResume: exam.allowResume ?? true,
            allowLateStart: exam.allowLateStart ?? false,
            allowPracticeAfterDeadline: exam.allowPracticeAfterDeadline ?? false,
            autoSubmitOnTimeout: exam.autoSubmitOnTimeout ?? true,
            sessionPolicy: exam.sessionPolicy || "allow_resume",
            integrityMonitoring: exam.integrityMonitoring ?? false,
            scoring: this.normalizeScoring(exam.scoring),
            resultPolicy: exam.resultPolicy || "immediate",
            resultReleaseAt: exam.resultReleaseAt?.toISOString() || null,
            answerKeyReleaseAt: exam.answerKeyReleaseAt?.toISOString() || null,
            explanationReleaseAt: exam.explanationReleaseAt?.toISOString() || null,
            rankingReleaseAt: exam.rankingReleaseAt?.toISOString() || null,
            resultsReleased: exam.resultsReleased,
            sections: exam.sections || [],
            syllabus: (exam.syllabus || []).map((item) => ({
                id: item.id,
                subject: item.subject,
                description: item.description,
                required: item.required,
                track: item.track,
            })),
            duration: exam.duration,
            durationMinutes: exam.duration,
            attemptLimit: exam.attemptLimit,
            maxAttempts: exam.attemptLimit,
            startTime: exam.startTime,
            endTime: exam.endTime,
            availableFrom: exam.startTime?.toISOString(),
            availableUntil: exam.endTime?.toISOString(),
            latestStartAt: exam.latestStartAt?.toISOString() || null,
            openAt: exam.startTime?.toISOString(),
            closeAt: exam.endTime?.toISOString(),
            isoDate: exam.startTime?.toISOString().slice(0, 10) ||
                new Date().toISOString().slice(0, 10),
            published: exam.published,
            audienceRules: this.normalizedAudienceRules(exam.audienceRules),
            questions: includeAnswers
                ? exam.questions?.map((question) => this.publicQuestion(question)) || []
                : undefined,
            delivery: {
                questionCount: exam.questions?.length || 0,
                assignmentCount: exam.assignments?.length || 0,
                attemptCount: exam.attempts?.length || 0,
                activeAttemptCount: (exam.attempts || []).filter((attempt) => !attempt.finishedAt).length,
                completedAttemptCount: (exam.attempts || []).filter((attempt) => Boolean(attempt.finishedAt)).length,
                notStartedCount: Math.max(0, (exam.assignments?.length || 0) -
                    new Set((exam.attempts || [])
                        .map((attempt) => attempt.student?.id)
                        .filter(Boolean)).size),
                allowedAttempts,
                attemptsUsed: studentId ? attemptsUsed : 0,
                activeAttemptId: activeAttempt?.id || null,
                canStart,
                reason,
                state,
                lastAttempt: studentAttempts[0]
                    ? this.publicAttempt(studentAttempts[0], exam)
                    : null,
            },
        };
    }
    async allowedAttempts(examId, studentId, base) {
        if (!this.retryRequests)
            return base;
        const bonus = await this.retryRequests.count({
            where: {
                exam: { id: examId },
                student: { id: studentId },
                status: exam_retry_request_entity_1.RetryRequestStatus.APPROVED,
            },
        });
        return base + bonus;
    }
    async retryBonuses(studentId) {
        const bonuses = new Map();
        if (!this.retryRequests)
            return bonuses;
        const rows = await this.retryRequests.find({
            where: {
                student: { id: studentId },
                status: exam_retry_request_entity_1.RetryRequestStatus.APPROVED,
            },
            relations: { exam: true },
        });
        for (const row of rows)
            bonuses.set(row.exam.id, (bonuses.get(row.exam.id) || 0) + 1);
        return bonuses;
    }
    async questionsForExam(examId) {
        const exam = await this.exams.findOneOrFail({
            where: { id: examId },
            relations: { questions: true },
        });
        return exam.questions.map((question) => this.publicQuestion(question));
    }
    async addQuestion(examId, question) {
        const exam = await this.exams.findOneByOrFail({ id: examId });
        const saved = await this.questions.save(this.questions.create({ ...this.normalizeQuestion(question), exam }));
        return this.publicQuestion(saved);
    }
    async updateQuestion(id, body) {
        const question = await this.questions.findOneOrFail({ where: { id } });
        if (typeof body.text === "string" || typeof body.question === "string")
            question.text = String(body.text ?? body.question);
        if (Array.isArray(body.options))
            question.options = body.options.map(String);
        if (typeof body.correctAnswer === "string" ||
            typeof body.correctOption === "string")
            question.correctAnswer = String(body.correctAnswer ?? body.correctOption);
        if (typeof body.explanation === "string")
            question.explanation = body.explanation;
        return this.publicQuestion(await this.questions.save(question));
    }
    async deleteQuestion(id, examId) {
        const question = await this.questions.findOneOrFail({
            where: { id },
            relations: { exam: true },
        });
        if (examId && question.exam.id !== examId)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سؤال برای این آزمون پیدا نشد.");
        await this.questions.delete(id);
        return { id, deleted: true };
    }
    async historyForStudent(studentId) {
        const attempts = await this.attempts.find({
            where: { student: { id: studentId } },
            relations: { exam: true },
            order: { startedAt: "DESC" },
        });
        return attempts.map((attempt) => this.publicAttempt(attempt));
    }
    async attemptForStudent(studentId, attemptId) {
        const attempt = await this.attempts.findOneOrFail({
            where: { id: attemptId, student: { id: studentId } },
            relations: { exam: { questions: true }, student: true },
        });
        return {
            ...this.publicAttempt(attempt),
            studentId,
            result: this.result(attempt, attempt.answers || [], true),
        };
    }
    importQuestions(examId, questions = []) {
        return this.exams.findOneByOrFail({ id: examId }).then((exam) => this.questions.save(questions.map((question) => this.questions.create({
            ...this.normalizeQuestion(question),
            exam,
        }))));
    }
    async assign(examId, studentIds, actorUserId) {
        if (!this.assignments || !this.users || !this.dataSource)
            throw new api_exception_1.ApiException(503, "ASSIGNMENTS_UNAVAILABLE", "تخصیص آزمون در دسترس نیست.");
        return this.dataSource.transaction(async (manager) => {
            const exam = await manager.findOne(exam_entity_1.Exam, { where: { id: examId } });
            const actor = await manager.findOne(user_entity_1.User, { where: { id: actorUserId } });
            const students = await manager.find(student_entity_1.Student, {
                where: { id: (0, typeorm_3.In)([...new Set(studentIds)]) },
            });
            if (!exam || !actor || students.length !== new Set(studentIds).size)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "آزمون، کاربر یا دانش‌آموز یافت نشد.");
            for (const student of students) {
                const exists = await manager.findOne(exam_assignment_entity_1.ExamAssignment, {
                    where: { exam: { id: examId }, student: { id: student.id } },
                });
                if (!exists)
                    await manager.save(exam_assignment_entity_1.ExamAssignment, manager.create(exam_assignment_entity_1.ExamAssignment, {
                        exam,
                        student,
                        assignedBy: actor,
                    }));
            }
            return { examId, studentIds: students.map((student) => student.id) };
        });
    }
    async assignmentsForExam(examId) {
        if (!this.assignments)
            throw new api_exception_1.ApiException(503, "ASSIGNMENTS_UNAVAILABLE", "تخصیص آزمون در دسترس نیست.");
        const assignments = await this.assignments.find({
            where: { exam: { id: examId } },
            relations: { student: true, assignedBy: true },
            order: { assignedAt: "DESC" },
        });
        return assignments.map((assignment) => ({
            id: assignment.id,
            assignedAt: assignment.assignedAt,
            source: "direct",
            student: {
                id: assignment.student.id,
                name: assignment.student.name,
                grade: assignment.student.grade,
                major: assignment.student.major,
            },
            assignedBy: assignment.assignedBy
                ? {
                    id: assignment.assignedBy.id,
                    name: [assignment.assignedBy.firstName, assignment.assignedBy.lastName]
                        .filter(Boolean)
                        .join(" ") || assignment.assignedBy.username,
                }
                : null,
        }));
    }
    async unassign(examId, studentId) {
        if (!this.assignments)
            throw new api_exception_1.ApiException(503, "ASSIGNMENTS_UNAVAILABLE", "تخصیص آزمون در دسترس نیست.");
        const started = await this.attempts.exist({
            where: { exam: { id: examId }, student: { id: studentId } },
        });
        if (started)
            throw new api_exception_1.ApiException(409, "EXAM_ASSIGNMENT_STARTED", "پس از شروع آزمون، حذف تخصیص مجاز نیست.");
        const result = await this.assignments.delete({
            exam: { id: examId },
            student: { id: studentId },
        });
        if (!result.affected)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "تخصیص آزمون یافت نشد.");
        return { examId, studentId, removed: true };
    }
    async requireAssignment(examId, studentId) {
        if (!this.assignments)
            return;
        const direct = this.assignments
            ? await this.assignments.findOne({
                where: { exam: { id: examId }, student: { id: studentId } },
            })
            : null;
        if (direct)
            return;
        const student = await this.students.findOneByOrFail({ id: studentId });
        const exam = await this.exams.findOneBy({ id: examId });
        if (!exam || !(await this.visibleForStudent([exam], student)).length)
            throw new api_exception_1.ApiException(404, "EXAM_NOT_ASSIGNED", "آزمون برای این دانش‌آموز در دسترس نیست.");
    }
    async setAudienceRules(examId, rules) {
        const exam = await this.exams.findOneByOrFail({ id: examId });
        exam.audienceRules = {
            gradeIds: [...new Set(rules.gradeIds)].sort((a, b) => a - b),
            educationTypeIds: [
                ...new Set(rules.educationTypeIds.map((value) => value.trim()).filter(Boolean)),
            ].sort(),
            trackIds: [
                ...new Set(rules.trackIds.map((value) => value.trim()).filter(Boolean)),
            ].sort(),
            learnerProfiles: [...new Set(rules.learnerProfiles)].sort(),
            independentTypes: [...new Set(rules.independentTypes)].sort(),
        };
        return this.exams.save(exam).then((row) => row.audienceRules);
    }
    async setClassAssignments(examId, classIds) {
        if (!this.classAssignments || !this.classes || !this.dataSource)
            throw new api_exception_1.ApiException(503, "CLASS_ASSIGNMENTS_UNAVAILABLE", "تخصیص کلاسی در دسترس نیست.");
        const unique = [...new Set(classIds)];
        const [exam, classrooms] = await Promise.all([
            this.exams.findOne({
                where: { id: examId },
                relations: { organization: true },
            }),
            unique.length
                ? this.classes.find({
                    where: { id: (0, typeorm_3.In)(unique) },
                    relations: { organization: true },
                })
                : [],
        ]);
        if (!exam ||
            classrooms.length !== unique.length ||
            classrooms.some((item) => item.status !== "ACTIVE" ||
                item.organization?.id !== exam.organization?.id))
            throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس انتخاب‌شده در دسترس نیست.");
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(exam_class_assignment_entity_1.ExamClassAssignment, { exam: { id: examId } });
            if (classrooms.length)
                await manager.save(exam_class_assignment_entity_1.ExamClassAssignment, classrooms.map((classroom) => manager.create(exam_class_assignment_entity_1.ExamClassAssignment, { exam, classroom })));
        });
        return this.listClassAssignments(examId);
    }
    async listClassAssignments(examId) {
        if (!this.classAssignments)
            throw new api_exception_1.ApiException(503, "CLASS_ASSIGNMENTS_UNAVAILABLE", "تخصیص کلاسی در دسترس نیست.");
        return this.classAssignments
            .find({
            where: { exam: { id: examId } },
            relations: { classroom: { enrollments: true } },
            order: { createdAt: "DESC" },
        })
            .then((rows) => rows.map((row) => ({
            id: row.id,
            classId: row.classroom.id,
            name: row.classroom.name,
            code: row.classroom.code,
            schoolYear: row.classroom.schoolYear,
            enrollmentCount: row.classroom.enrollments.length,
        })));
    }
    async visibleForStudent(exams, student) {
        if (!this.assignments)
            return exams;
        const direct = await this.assignments.find({
            where: { student: { id: student.id } },
            relations: { exam: true },
        });
        const directIds = new Set(direct.map((row) => row.exam.id));
        const classRows = this.classEnrollments
            ? await this.classEnrollments.find({
                where: {
                    student: { id: student.id },
                    classroom: { status: "ACTIVE" },
                },
                relations: { classroom: true },
            })
            : [];
        const classIds = new Set(classRows.map((row) => row.classroom.id));
        const mappedClasses = this.classAssignments && classIds.size
            ? await this.classAssignments.find({
                where: { classroom: { id: (0, typeorm_3.In)([...classIds]) } },
                relations: { exam: true },
            })
            : [];
        const classExamIds = new Set(mappedClasses.map((row) => row.exam.id));
        return exams.filter((exam) => directIds.has(exam.id) ||
            classExamIds.has(exam.id) ||
            this.matchesAudienceRules(student, exam.audienceRules));
    }
    matchesAudienceRules(student, rules) {
        const value = this.normalizedAudienceRules(rules);
        const configured = value.gradeIds?.length ||
            value.educationTypeIds?.length ||
            value.trackIds?.length ||
            value.learnerProfiles?.length ||
            value.independentTypes?.length;
        if (!configured)
            return false;
        return ((!value.gradeIds.length ||
            value.gradeIds.includes(student.gradeId || 0)) &&
            (!value.educationTypeIds.length ||
                value.educationTypeIds.includes(student.educationTypeId)) &&
            (!value.trackIds.length || value.trackIds.includes(student.trackId)) &&
            (!value.learnerProfiles.length ||
                value.learnerProfiles.includes(student.learnerProfile || "school")) &&
            (!value.independentTypes.length ||
                value.independentTypes.includes(student.independentType || "")));
    }
    normalizedAudienceRules(rules) {
        return {
            gradeIds: rules?.gradeIds || [],
            educationTypeIds: rules?.educationTypeIds || [],
            trackIds: rules?.trackIds || [],
            learnerProfiles: rules?.learnerProfiles || [],
            independentTypes: rules?.independentTypes || [],
        };
    }
    normalizeQuestion(question) {
        return {
            text: question.text || question.question || "",
            options: question.options || [],
            correctAnswer: question.correctAnswer || question.correctOption || "",
            explanation: question.explanation || "",
            subject: question.subject || "",
            topic: question.topic || "",
            sectionId: question.sectionId || "",
            mediaUrl: question.mediaUrl || "",
            difficulty: question.difficulty || "medium",
            source: question.source || "",
            tags: question.tags || [],
        };
    }
    publicQuestion(question) {
        return {
            id: question.id,
            text: question.text,
            question: question.text,
            options: question.options,
            correctAnswer: question.correctAnswer,
            correctOption: question.correctAnswer,
            explanation: question.explanation,
            subject: question.subject,
            topic: question.topic,
            sectionId: question.sectionId,
            mediaUrl: question.mediaUrl,
            difficulty: question.difficulty,
            source: question.source,
            tags: question.tags || [],
        };
    }
    fourOptions(options) {
        const normalized = [...(options || [])].slice(0, 4);
        while (normalized.length < 4)
            normalized.push("");
        return normalized;
    }
    mergeAnswers(current, incoming) {
        const merged = new Map(current.map((answer) => [answer.questionId, answer]));
        for (const raw of incoming) {
            const previous = merged.get(raw.questionId);
            const answer = {
                questionId: raw.questionId,
                selectedOption: raw.selectedOption ?? null,
                marked: Boolean(raw.marked),
                visited: Boolean(raw.visited),
                clientUpdatedAt: raw.clientUpdatedAt || new Date().toISOString(),
                revision: raw.revision ?? (previous?.revision ?? 0) + 1,
            };
            const previousRevision = previous?.revision ?? 0;
            const previousTime = Date.parse(previous?.clientUpdatedAt || "");
            const incomingTime = Date.parse(answer.clientUpdatedAt || "");
            if (!previous ||
                (answer.revision ?? 0) > previousRevision ||
                ((answer.revision ?? 0) === previousRevision &&
                    (!Number.isFinite(previousTime) || incomingTime > previousTime)))
                merged.set(answer.questionId, answer);
        }
        return [...merged.values()];
    }
    async resultForStudent(attemptId, userId) {
        const student = await this.studentForUser(userId);
        const attempt = await this.attempts.findOne({
            where: { id: attemptId, student: { id: student.id } },
            relations: { exam: { questions: true } },
        });
        if (!attempt)
            throw new api_exception_1.ApiException(404, "ATTEMPT_NOT_FOUND", "تلاش آزمون پیدا نشد.");
        if (!attempt.finishedAt)
            throw new api_exception_1.ApiException(409, "ATTEMPT_ACTIVE", "این تلاش هنوز به پایان نرسیده است.");
        return this.result(attempt, attempt.answers || []);
    }
    resultStatus(exam) {
        if (!exam)
            return "calculating";
        if (exam.resultPolicy === "immediate")
            return "released";
        if (exam.resultPolicy === "scheduled")
            return exam.resultReleaseAt && new Date() >= exam.resultReleaseAt
                ? "released"
                : "calculating";
        return exam.resultsReleased ? "released" : "withheld";
    }
    normalizeScoring(scoring) {
        const wrong = Number(scoring?.wrong ?? 0);
        return {
            correct: Number(scoring?.correct ?? 1),
            wrong,
            unanswered: Number(scoring?.unanswered ?? 0),
            negativeMarking: Boolean(scoring?.negativeMarking || wrong < 0),
        };
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exam_entity_1.Exam)),
    __param(1, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(2, (0, typeorm_1.InjectRepository)(exam_attempt_entity_1.ExamAttempt)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, common_1.Optional)()),
    __param(4, (0, typeorm_1.InjectRepository)(exam_assignment_entity_1.ExamAssignment)),
    __param(5, (0, common_1.Optional)()),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __param(7, (0, typeorm_1.InjectRepository)(mistake_entity_1.Mistake)),
    __param(8, (0, common_1.Optional)()),
    __param(9, (0, common_1.Optional)()),
    __param(9, (0, typeorm_1.InjectRepository)(exam_retry_request_entity_1.ExamRetryRequest)),
    __param(10, (0, common_1.Optional)()),
    __param(10, (0, typeorm_1.InjectRepository)(exam_class_assignment_entity_1.ExamClassAssignment)),
    __param(11, (0, common_1.Optional)()),
    __param(11, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(12, (0, common_1.Optional)()),
    __param(12, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource,
        typeorm_2.Repository,
        exam_scoring_service_1.ExamScoringService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ExamsService);
function nullableDate(value) {
    if (!value)
        return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}
//# sourceMappingURL=exams.service.js.map