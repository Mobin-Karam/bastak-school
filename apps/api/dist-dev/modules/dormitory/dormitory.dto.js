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
exports.SendDormAnnouncementDto = exports.SetDormRoomAssignmentsDto = exports.CreateDormRoomDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateDormRoomDto {
    organizationId;
    code;
    name;
    building;
    floor;
    capacity;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, code: { required: true, type: () => String, minLength: 1, maxLength: 80 }, name: { required: true, type: () => String, minLength: 1, maxLength: 160 }, building: { required: false, type: () => String, minLength: 1, maxLength: 120 }, floor: { required: false, type: () => Number, minimum: 1, maximum: 200 }, capacity: { required: false, type: () => Number, minimum: 1, maximum: 12 } };
    }
}
exports.CreateDormRoomDto = CreateDormRoomDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDormRoomDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateDormRoomDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateDormRoomDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateDormRoomDto.prototype, "building", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], CreateDormRoomDto.prototype, "floor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateDormRoomDto.prototype, "capacity", void 0);
class SetDormRoomAssignmentsDto {
    studentIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentIds: { required: true, type: () => [String], format: "uuid" } };
    }
}
exports.SetDormRoomAssignmentsDto = SetDormRoomAssignmentsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], SetDormRoomAssignmentsDto.prototype, "studentIds", void 0);
class SendDormAnnouncementDto {
    organizationId;
    title;
    body;
    target;
    roomId;
    studentId;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, title: { required: true, type: () => String, minLength: 1, maxLength: 180 }, body: { required: true, type: () => String, minLength: 1, maxLength: 4000 }, target: { required: true, enum: ["ROOM", "STUDENT"], enum: ["ROOM", "STUDENT"] }, roomId: { required: false, type: () => String, format: "uuid" }, studentId: { required: false, type: () => String, format: "uuid" } };
    }
}
exports.SendDormAnnouncementDto = SendDormAnnouncementDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendDormAnnouncementDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], SendDormAnnouncementDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], SendDormAnnouncementDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["ROOM", "STUDENT"]),
    __metadata("design:type", String)
], SendDormAnnouncementDto.prototype, "target", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.target === "ROOM"),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendDormAnnouncementDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.target === "STUDENT"),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendDormAnnouncementDto.prototype, "studentId", void 0);
//# sourceMappingURL=dormitory.dto.js.map