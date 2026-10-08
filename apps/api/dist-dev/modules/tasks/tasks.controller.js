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
exports.TasksController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const complete_task_dto_1 = require("./dto/complete-task.dto");
const create_task_comment_dto_1 = require("./dto/create-task-comment.dto");
const create_task_issue_dto_1 = require("./dto/create-task-issue.dto");
const tasks_service_1 = require("./tasks.service");
let TasksController = class TasksController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    detail(user, id) {
        return this.tasks.detail(user.id, id).then(envelope_1.ok);
    }
    complete(user, id, dto) {
        return this.tasks.complete(user.id, id, dto).then(envelope_1.ok);
    }
    comment(user, id, dto) {
        return this.tasks.addComment(user.id, id, dto).then(envelope_1.ok);
    }
    issue(user, id, dto) {
        return this.tasks.reportIssue(user.id, id, dto).then(envelope_1.ok);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(":id/complete"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, complete_task_dto_1.CompleteTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(":id/comments"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_task_comment_dto_1.CreateTaskCommentDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "comment", null);
__decorate([
    (0, common_1.Post)(":id/issues"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_task_issue_dto_1.CreateTaskIssueDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "issue", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)("student/tasks"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map