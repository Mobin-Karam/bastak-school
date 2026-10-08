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
exports.UpdateRelationshipDto = exports.CreateRelationshipDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const user_relationship_entity_1 = require("../../../database/entities/user-relationship.entity");
class CreateRelationshipDto {
    fromUserId;
    toStudentId;
    organizationId;
    type;
    static _OPENAPI_METADATA_FACTORY() {
        return { fromUserId: { required: true, type: () => String, format: "uuid" }, toStudentId: { required: true, type: () => String, format: "uuid" }, organizationId: { required: false, type: () => String, format: "uuid" }, type: { required: true, enum: require("../../../database/entities/user-relationship.entity").RelationshipType } };
    }
}
exports.CreateRelationshipDto = CreateRelationshipDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRelationshipDto.prototype, "fromUserId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRelationshipDto.prototype, "toStudentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRelationshipDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(user_relationship_entity_1.RelationshipType),
    __metadata("design:type", String)
], CreateRelationshipDto.prototype, "type", void 0);
class UpdateRelationshipDto {
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: require("../../../database/entities/user-relationship.entity").RelationshipStatus } };
    }
}
exports.UpdateRelationshipDto = UpdateRelationshipDto;
__decorate([
    (0, class_validator_1.IsEnum)(user_relationship_entity_1.RelationshipStatus),
    __metadata("design:type", String)
], UpdateRelationshipDto.prototype, "status", void 0);
//# sourceMappingURL=relationship.dto.js.map