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
exports.StudentsController = exports.StudentParityController = exports.StudentController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const students_service_1 = require("./students.service");
const learning_dto_1 = require("./dto/learning.dto");
let StudentController = class StudentController {
    students;
    constructor(students) {
        this.students = students;
    }
    dashboard(user) {
        return this.students.dashboard(user?.id).then(envelope_1.ok);
    }
    today(user) {
        return this.students.today(user?.id).then(envelope_1.ok);
    }
    plans(user, date) {
        return this.students.day(user?.id, date).then((data) => (0, envelope_1.ok)(data.plan ? [data.plan] : []));
    }
    progress(user) {
        return this.students.progress(user?.id).then(envelope_1.ok);
    }
    weeklyProgress(user) {
        return this.students.progress(user?.id).then(envelope_1.ok);
    }
    reviews(user) {
        return this.students.reviews(user?.id).then(envelope_1.ok);
    }
    learningSummary(user) {
        return this.students.learning(user?.id).then((data) => (0, envelope_1.ok)(data.summary));
    }
    learningItems(user) {
        return this.students.learning(user?.id).then((data) => (0, envelope_1.ok)(data.items));
    }
    chatPrivacy(user) {
        return this.students.chatPrivacy(user.id).then(envelope_1.ok);
    }
    updateChatPrivacy(user, enabled) {
        return this.students.updateChatPrivacy(user.id, enabled).then(envelope_1.ok);
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)("dashboard"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)("today"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "today", null);
__decorate([
    openapi.ApiQuery({ name: "date", required: false }),
    (0, common_1.Get)("plans"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "plans", null);
__decorate([
    (0, common_1.Get)("progress"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "progress", null);
__decorate([
    (0, common_1.Get)("progress/weekly"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "weeklyProgress", null);
__decorate([
    (0, common_1.Get)("reviews"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "reviews", null);
__decorate([
    (0, common_1.Get)("learning/summary"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "learningSummary", null);
__decorate([
    (0, common_1.Get)("learning/items"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "learningItems", null);
__decorate([
    (0, common_1.Get)("chat-privacy"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "chatPrivacy", null);
__decorate([
    (0, common_1.Patch)("chat-privacy"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("guardianReadOnly")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "updateChatPrivacy", null);
exports.StudentController = StudentController = __decorate([
    (0, common_1.Controller)("student"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentController);
let StudentParityController = class StudentParityController {
    students;
    constructor(students) {
        this.students = students;
    }
    reviews(user) {
        return this.students.reviews(user?.id).then(envelope_1.ok);
    }
    weeklyProgress(user) {
        return this.students.progress(user?.id).then(envelope_1.ok);
    }
    learningSummary(user) {
        return this.students.learning(user?.id).then((data) => (0, envelope_1.ok)(data.summary));
    }
    learningItems(user) {
        return this.students.learning(user?.id).then((data) => (0, envelope_1.ok)(data.items));
    }
    async createLearning(user, dto) { return (0, envelope_1.ok)(await this.students.createLearningItem(await this.students.studentIdForUser(user.id), dto)); }
    async updateLearning(user, id, dto) { return (0, envelope_1.ok)(await this.students.updateLearningItem(await this.students.studentIdForUser(user.id), id, dto)); }
    async deleteLearning(user, id) { return (0, envelope_1.ok)(await this.students.deleteLearningItem(await this.students.studentIdForUser(user.id), id)); }
    async reviewLearning(user, id, dto) { return (0, envelope_1.ok)(await this.students.reviewLearningItem(await this.students.studentIdForUser(user.id), id, dto.rating)); }
    async learningHistory(user, id) { return (0, envelope_1.ok)(await this.students.learningReviewHistory(await this.students.studentIdForUser(user.id), id)); }
};
exports.StudentParityController = StudentParityController;
__decorate([
    (0, common_1.Get)("reviews"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentParityController.prototype, "reviews", null);
__decorate([
    (0, common_1.Get)("progress/weekly"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentParityController.prototype, "weeklyProgress", null);
__decorate([
    (0, common_1.Get)("learning/summary"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentParityController.prototype, "learningSummary", null);
__decorate([
    (0, common_1.Get)("learning/items"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentParityController.prototype, "learningItems", null);
__decorate([
    (0, common_1.Post)("learning/items"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, learning_dto_1.CreateLearningItemDto]),
    __metadata("design:returntype", Promise)
], StudentParityController.prototype, "createLearning", null);
__decorate([
    (0, common_1.Patch)("learning/items/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, learning_dto_1.UpdateLearningItemDto]),
    __metadata("design:returntype", Promise)
], StudentParityController.prototype, "updateLearning", null);
__decorate([
    (0, common_1.Delete)("learning/items/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentParityController.prototype, "deleteLearning", null);
__decorate([
    (0, common_1.Post)("learning/items/:id/review"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.review"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, learning_dto_1.ReviewLearningItemDto]),
    __metadata("design:returntype", Promise)
], StudentParityController.prototype, "reviewLearning", null);
__decorate([
    (0, common_1.Get)("learning/items/:id/reviews"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentParityController.prototype, "learningHistory", null);
exports.StudentParityController = StudentParityController = __decorate([
    (0, common_1.Controller)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentParityController);
let StudentsController = class StudentsController {
    students;
    constructor(students) {
        this.students = students;
    }
    me(user) {
        return this.students.find(user.id).then(envelope_1.ok);
    }
    meProfile(user) {
        return this.students.find(user.id).then((student) => (0, envelope_1.ok)({
            ...student,
            identity: {
                firstName: student?.user?.firstName ?? "",
                lastName: student?.user?.lastName ?? "",
                fullName: student?.name ?? "",
                nationalCode: student?.nationalCode ?? null,
                phoneNumber: student?.user?.phoneNumber ?? null,
                email: student?.user?.email ?? null,
                profilePhoto: student?.user?.chatAvatarUrl ?? "",
            },
            education: {
                learnerProfile: student?.learnerProfile ?? "school",
                independentType: student?.independentType ?? null,
                learningLevel: student?.learningLevel ?? "",
                gradeId: student?.gradeId ?? null,
                educationTypeId: student?.educationTypeId ?? "",
                trackId: student?.trackId ?? "",
                grade: student?.grade ?? "",
                major: student?.major ?? "",
                targetUniversity: student?.targetUniversity ?? "",
                targetField: student?.targetField ?? "",
                targetRank: student?.targetRank ?? "",
                dailyCapacity: student?.dailyCapacity ?? "",
            },
            attendanceSummary: {
                totalSessions: 0,
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
            },
        }));
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Get)("me"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "me", null);
__decorate([
    (0, common_1.Get)("me/profile"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentsController.prototype, "meProfile", null);
exports.StudentsController = StudentsController = __decorate([
    (0, common_1.Controller)("students"),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map