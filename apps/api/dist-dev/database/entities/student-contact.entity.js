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
exports.StudentContact = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
let StudentContact = class StudentContact {
    id;
    student;
    type;
    fullName;
    nationalCode;
    phoneNumber;
    occupation;
    linkedUser;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, type: { required: true, enum: ["FATHER", "MOTHER", "LEGAL_GUARDIAN", "EMERGENCY"] }, fullName: { required: true, type: () => String }, nationalCode: { required: false, type: () => String, nullable: true }, phoneNumber: { required: false, type: () => String, nullable: true }, occupation: { required: false, type: () => String, nullable: true }, linkedUser: { required: false, type: () => require("./user.entity").User, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudentContact = StudentContact;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentContact.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], StudentContact.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24 }),
    __metadata("design:type", String)
], StudentContact.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], StudentContact.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], StudentContact.prototype, "nationalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, nullable: true }),
    __metadata("design:type", Object)
], StudentContact.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 160, nullable: true }),
    __metadata("design:type", Object)
], StudentContact.prototype, "occupation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], StudentContact.prototype, "linkedUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentContact.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentContact.prototype, "updatedAt", void 0);
exports.StudentContact = StudentContact = __decorate([
    (0, typeorm_1.Entity)("student_contacts"),
    (0, typeorm_1.Index)(["student", "type"], { unique: true })
], StudentContact);
//# sourceMappingURL=student-contact.entity.js.map