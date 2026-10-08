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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const student_entity_1 = require("../../database/entities/student.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const task_comment_entity_1 = require("../../database/entities/task-comment.entity");
const task_issue_entity_1 = require("../../database/entities/task-issue.entity");
const complete_task_dto_1 = require("./dto/complete-task.dto");
let TasksService = class TasksService {
    tasks;
    students;
    comments;
    issues;
    constructor(tasks, students, comments, issues) {
        this.tasks = tasks;
        this.students = students;
        this.comments = comments;
        this.issues = issues;
    }
    async detail(userId, taskId) {
        const task = await this.ownedTask(userId, taskId);
        const [comments, issues] = await Promise.all([
            this.comments.find({ where: { task: { id: task.id }, student: { user: { id: userId } } }, order: { createdAt: "ASC" } }),
            this.issues.find({ where: { task: { id: task.id }, student: { user: { id: userId } } }, order: { createdAt: "ASC" } }),
        ]);
        return { task, comments, issues };
    }
    async complete(userId, taskId, dto = {}) {
        const task = await this.ownedTask(userId, taskId);
        const completedAt = new Date();
        task.completedAt = completedAt;
        task.status = dto.status || complete_task_dto_1.TaskCompletionStatus.DONE;
        task.actualMinutes = dto.actualMinutes ?? task.actualMinutes ?? 0;
        task.actualTests = dto.actualTests ?? task.actualTests ?? 0;
        task.completionDifficulty = dto.difficulty ?? task.completionDifficulty ?? "";
        task.completionNote = dto.note ?? task.completionNote ?? "";
        await this.tasks.save(task);
        return { id: task.id, status: task.status, completedAt, actualMinutes: task.actualMinutes, actualTests: task.actualTests, difficulty: task.completionDifficulty, note: task.completionNote };
    }
    async addComment(userId, taskId, dto) {
        const { task, student } = await this.taskAndStudent(userId, taskId);
        return this.comments.save(this.comments.create({ task, student, text: dto.text.trim() }));
    }
    async reportIssue(userId, taskId, dto) {
        const { task, student } = await this.taskAndStudent(userId, taskId);
        return this.issues.save(this.issues.create({ task, student, type: dto.type.trim(), description: dto.description?.trim() || "", status: "OPEN" }));
    }
    async ownedTask(userId, taskId) {
        return (await this.taskAndStudent(userId, taskId)).task;
    }
    async taskAndStudent(userId, taskId) {
        const student = await this.students.findOne({ where: { user: { id: userId } } });
        const task = student ? await this.tasks.findOne({ where: { id: taskId, plan: { student: { id: student.id } } }, relations: { plan: true } }) : null;
        if (!student || !task)
            throw new api_exception_1.ApiException(404, "TASK_NOT_FOUND", "فعالیت پیدا نشد.");
        return { task, student };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(task_comment_entity_1.TaskComment)),
    __param(3, (0, typeorm_1.InjectRepository)(task_issue_entity_1.TaskIssue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TasksService);
//# sourceMappingURL=tasks.service.js.map