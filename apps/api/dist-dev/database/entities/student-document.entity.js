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
exports.StudentDocument = exports.DocumentStatus = exports.DocumentTypeCode = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var DocumentTypeCode;
(function (DocumentTypeCode) {
    DocumentTypeCode["SHENASNAME"] = "SHENASNAME";
    DocumentTypeCode["NATIONAL_CARD"] = "NATIONAL_CARD";
    DocumentTypeCode["PARENT_DOCUMENTS"] = "PARENT_DOCUMENTS";
    DocumentTypeCode["PERSONAL_PHOTO"] = "PERSONAL_PHOTO";
    DocumentTypeCode["HEALTH_RECORD"] = "HEALTH_RECORD";
    DocumentTypeCode["VACCINATION_RECORD"] = "VACCINATION_RECORD";
    DocumentTypeCode["INSURANCE_INFO"] = "INSURANCE_INFO";
    DocumentTypeCode["CONSENT_FORMS"] = "CONSENT_FORMS";
    DocumentTypeCode["TRANSPORT_INFO"] = "TRANSPORT_INFO";
    DocumentTypeCode["TUITION_INFO"] = "TUITION_INFO";
    DocumentTypeCode["LEGAL_GUARDIAN_SIGNATURE"] = "LEGAL_GUARDIAN_SIGNATURE";
})(DocumentTypeCode || (exports.DocumentTypeCode = DocumentTypeCode = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["SUBMITTED"] = "SUBMITTED";
    DocumentStatus["VERIFIED"] = "VERIFIED";
    DocumentStatus["REJECTED"] = "REJECTED";
    DocumentStatus["NEEDS_CORRECTION"] = "NEEDS_CORRECTION";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
let StudentDocument = class StudentDocument {
    id;
    student;
    type;
    fileName;
    fileUrl;
    originalFileName;
    status;
    verificationNote;
    verifiedBy;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, type: { required: true, enum: require("./student-document.entity").DocumentTypeCode }, fileName: { required: true, type: () => String }, fileUrl: { required: true, type: () => String }, originalFileName: { required: false, type: () => String, nullable: true }, status: { required: true, enum: require("./student-document.entity").DocumentStatus }, verificationNote: { required: false, type: () => String, nullable: true }, verifiedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudentDocument = StudentDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], StudentDocument.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48 }),
    __metadata("design:type", String)
], StudentDocument.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], StudentDocument.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], StudentDocument.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", Object)
], StudentDocument.prototype, "originalFileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, default: DocumentStatus.PENDING }),
    __metadata("design:type", String)
], StudentDocument.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], StudentDocument.prototype, "verificationNote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], StudentDocument.prototype, "verifiedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentDocument.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentDocument.prototype, "updatedAt", void 0);
exports.StudentDocument = StudentDocument = __decorate([
    (0, typeorm_1.Entity)("student_documents"),
    (0, typeorm_1.Index)(["student", "type"], { unique: true })
], StudentDocument);
//# sourceMappingURL=student-document.entity.js.map