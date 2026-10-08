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
exports.UploadSyncDto = exports.SyncChangeDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class SyncChangeDto {
    id;
    clientMutationId;
    type;
    method;
    path;
    body;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String, maxLength: 160 }, clientMutationId: { required: false, type: () => String, maxLength: 160 }, type: { required: false, type: () => String, maxLength: 48 }, method: { required: true, enum: ["POST", "PATCH"], enum: ["POST", "PATCH"] }, path: { required: true, type: () => String, maxLength: 240 }, body: { required: false, type: () => Object }, createdAt: { required: false, type: () => String } };
    }
}
exports.SyncChangeDto = SyncChangeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SyncChangeDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SyncChangeDto.prototype, "clientMutationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(48),
    __metadata("design:type", String)
], SyncChangeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["POST", "PATCH"]),
    __metadata("design:type", String)
], SyncChangeDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], SyncChangeDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SyncChangeDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], SyncChangeDto.prototype, "createdAt", void 0);
class UploadSyncDto {
    changes;
    static _OPENAPI_METADATA_FACTORY() {
        return { changes: { required: true, type: () => [require("./sync.dto").SyncChangeDto] } };
    }
}
exports.UploadSyncDto = UploadSyncDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SyncChangeDto),
    __metadata("design:type", Array)
], UploadSyncDto.prototype, "changes", void 0);
//# sourceMappingURL=sync.dto.js.map