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
exports.SetClassGroupMembersDto = exports.CreateClassGroupDto = exports.UpdateClassGroupDto = exports.MAX_CLASS_GROUP_MEMBERS = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.MAX_CLASS_GROUP_MEMBERS = 1000;
class UpdateClassGroupDto {
    code;
    name;
    description;
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: false, type: () => String, maxLength: 80, pattern: "\\S" }, name: { required: false, type: () => String, maxLength: 160, pattern: "\\S" }, description: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.UpdateClassGroupDto = UpdateClassGroupDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/\S/),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateClassGroupDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/\S/),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateClassGroupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateClassGroupDto.prototype, "description", void 0);
class CreateClassGroupDto {
    classId;
    code;
    name;
    description;
    static _OPENAPI_METADATA_FACTORY() {
        return { classId: { required: true, type: () => String, format: "uuid" }, code: { required: true, type: () => String, maxLength: 80, pattern: "\\S" }, name: { required: true, type: () => String, maxLength: 160, pattern: "\\S" }, description: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.CreateClassGroupDto = CreateClassGroupDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateClassGroupDto.prototype, "classId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/\S/),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateClassGroupDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/\S/),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateClassGroupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateClassGroupDto.prototype, "description", void 0);
class SetClassGroupMembersDto {
    studentIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentIds: { required: true, type: () => [String], uniqueItems: true, format: "uuid" } };
    }
}
exports.SetClassGroupMembersDto = SetClassGroupMembersDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.ArrayMaxSize)(exports.MAX_CLASS_GROUP_MEMBERS),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], SetClassGroupMembersDto.prototype, "studentIds", void 0);
//# sourceMappingURL=class-groups.dto.js.map