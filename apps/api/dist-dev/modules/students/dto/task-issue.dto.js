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
exports.UpdateTaskIssueDto = exports.StaffTaskIssueStatus = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var StaffTaskIssueStatus;
(function (StaffTaskIssueStatus) {
    StaffTaskIssueStatus["OPEN"] = "open";
    StaffTaskIssueStatus["RESOLVED"] = "resolved";
    StaffTaskIssueStatus["DISMISSED"] = "dismissed";
})(StaffTaskIssueStatus || (exports.StaffTaskIssueStatus = StaffTaskIssueStatus = {}));
class UpdateTaskIssueDto {
    status;
    advisorNote;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: require("./task-issue.dto").StaffTaskIssueStatus }, advisorNote: { required: false, type: () => String, maxLength: 2000 } };
    }
}
exports.UpdateTaskIssueDto = UpdateTaskIssueDto;
__decorate([
    (0, class_validator_1.IsEnum)(StaffTaskIssueStatus),
    __metadata("design:type", String)
], UpdateTaskIssueDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateTaskIssueDto.prototype, "advisorNote", void 0);
//# sourceMappingURL=task-issue.dto.js.map