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
exports.SchoolScheduleEntry = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const education_class_entity_1 = require("./education-class.entity");
const education_class_book_entity_1 = require("./education-class-book.entity");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let SchoolScheduleEntry = class SchoolScheduleEntry {
    id;
    organization;
    classroom;
    classBook;
    teacher;
    title;
    weekday;
    startTime;
    endTime;
    room;
    status;
    versionId;
    version;
    periodId;
    period;
    locationId;
    location;
    startsOn;
    endsOn;
    notes;
    classroomNameSnapshot;
    teacherNameSnapshot;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, classroom: { required: false, type: () => require("./education-class.entity").EducationClass, nullable: true }, classBook: { required: false, type: () => require("./education-class-book.entity").EducationClassBook, nullable: true }, teacher: { required: false, type: () => require("./user.entity").User, nullable: true }, title: { required: true, type: () => String }, weekday: { required: true, type: () => Number }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, room: { required: true, type: () => String }, status: { required: true, enum: ["ARCHIVED", "ACTIVE"] }, versionId: { required: true, type: () => String, nullable: true }, version: { required: false, type: () => Object }, periodId: { required: true, type: () => String, nullable: true }, period: { required: false, type: () => Object }, locationId: { required: true, type: () => String, nullable: true }, location: { required: false, type: () => Object }, startsOn: { required: true, type: () => String, nullable: true }, endsOn: { required: true, type: () => String, nullable: true }, notes: { required: true, type: () => String }, classroomNameSnapshot: { required: true, type: () => String }, teacherNameSnapshot: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SchoolScheduleEntry = SchoolScheduleEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], SchoolScheduleEntry.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_class_entity_1.EducationClass, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_class_book_entity_1.EducationClassBook, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "classBook", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer" }),
    __metadata("design:type", Number)
], SchoolScheduleEntry.prototype, "weekday", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5 }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5 }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: "" }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: "ACTIVE" }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableVersion", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "versionId" }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetablePeriod", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "periodId" }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "period", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableLocation", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "locationId" }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "startsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], SchoolScheduleEntry.prototype, "endsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240, default: "" }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "classroomNameSnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240, default: "" }),
    __metadata("design:type", String)
], SchoolScheduleEntry.prototype, "teacherNameSnapshot", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SchoolScheduleEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SchoolScheduleEntry.prototype, "updatedAt", void 0);
exports.SchoolScheduleEntry = SchoolScheduleEntry = __decorate([
    (0, typeorm_1.Entity)("school_schedule_entries"),
    (0, typeorm_1.Index)(["organization", "weekday", "startTime"])
], SchoolScheduleEntry);
//# sourceMappingURL=school-schedule-entry.entity.js.map