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
exports.DocumentType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_document_entity_1 = require("./student-document.entity");
let DocumentType = class DocumentType {
    id;
    code;
    name;
    description;
    enabled;
    required;
    sortOrder;
    instructions;
    requiresVerification;
    createdAt;
    updatedAt;
    documents;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, code: { required: true, type: () => String }, name: { required: true, type: () => String }, description: { required: true, type: () => String }, enabled: { required: true, type: () => Boolean }, required: { required: true, type: () => Boolean }, sortOrder: { required: true, type: () => Number }, instructions: { required: true, type: () => String }, requiresVerification: { required: true, type: () => Boolean }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, documents: { required: true, type: () => [require("./student-document.entity").StudentDocument] } };
    }
};
exports.DocumentType = DocumentType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DocumentType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48 }),
    __metadata("design:type", String)
], DocumentType.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], DocumentType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: "" }),
    __metadata("design:type", String)
], DocumentType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], DocumentType.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], DocumentType.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], DocumentType.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], DocumentType.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], DocumentType.prototype, "requiresVerification", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DocumentType.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DocumentType.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_document_entity_1.StudentDocument, (document) => document.type),
    __metadata("design:type", Array)
], DocumentType.prototype, "documents", void 0);
exports.DocumentType = DocumentType = __decorate([
    (0, typeorm_1.Entity)("document_types"),
    (0, typeorm_1.Index)(["code"], { unique: true })
], DocumentType);
//# sourceMappingURL=document-type.entity.js.map