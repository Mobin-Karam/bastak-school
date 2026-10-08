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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTaskDto = exports.TaskCompletionStatus = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var TaskCompletionStatus;
(function (TaskCompletionStatus) {
    TaskCompletionStatus["DONE"] = "done";
    TaskCompletionStatus["PARTIAL"] = "partial";
    TaskCompletionStatus["SKIPPED"] = "skipped";
})(TaskCompletionStatus || (exports.TaskCompletionStatus = TaskCompletionStatus = {}));
class CompleteTaskDto {
    status;
    actualMinutes;
    actualTests;
    difficulty;
    note;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, enum: require("./complete-task.dto").TaskCompletionStatus }, actualMinutes: { required: false, type: () => Number, minimum: 0, maximum: 1000000 }, actualTests: { required: false, type: () => Number, minimum: 0, maximum: 1000000 }, difficulty: { required: false, type: () => String, maxLength: 64 }, note: { required: false, type: () => String, maxLength: 2000 } };
    }
}
exports.CompleteTaskDto = CompleteTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaskCompletionStatus),
    __metadata("design:type", String)
], CompleteTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000000),
    __metadata("design:type", Number)
], CompleteTaskDto.prototype, "actualMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000000),
    __metadata("design:type", Number)
], CompleteTaskDto.prototype, "actualTests", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CompleteTaskDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CompleteTaskDto.prototype, "note", void 0);
//# sourceMappingURL=complete-task.dto.js.map