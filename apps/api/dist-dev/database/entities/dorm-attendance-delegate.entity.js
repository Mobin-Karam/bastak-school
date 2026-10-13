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
exports.DormAttendanceDelegate = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const dorm_room_entity_1 = require("./dorm-room.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
let DormAttendanceDelegate = class DormAttendanceDelegate {
    id;
    organization;
    room;
    student;
    grantedBy;
    startsOn;
    endsOn;
    dormWide;
    revoked;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, room: { required: true, type: () => require("./dorm-room.entity").DormRoom }, student: { required: true, type: () => require("./student.entity").Student }, grantedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, startsOn: { required: true, type: () => String }, endsOn: { required: true, type: () => String }, dormWide: { required: true, type: () => Boolean }, revoked: { required: true, type: () => Boolean }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.DormAttendanceDelegate = DormAttendanceDelegate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DormAttendanceDelegate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], DormAttendanceDelegate.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dorm_room_entity_1.DormRoom, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", dorm_room_entity_1.DormRoom)
], DormAttendanceDelegate.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], DormAttendanceDelegate.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], DormAttendanceDelegate.prototype, "grantedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], DormAttendanceDelegate.prototype, "startsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], DormAttendanceDelegate.prototype, "endsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DormAttendanceDelegate.prototype, "dormWide", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DormAttendanceDelegate.prototype, "revoked", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DormAttendanceDelegate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DormAttendanceDelegate.prototype, "updatedAt", void 0);
exports.DormAttendanceDelegate = DormAttendanceDelegate = __decorate([
    (0, typeorm_1.Entity)("dorm_attendance_delegates"),
    (0, typeorm_1.Index)(["room"], { unique: true })
], DormAttendanceDelegate);
//# sourceMappingURL=dorm-attendance-delegate.entity.js.map