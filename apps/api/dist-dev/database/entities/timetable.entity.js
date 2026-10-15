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
exports.TimetableImport = exports.TimetableChange = exports.TimetableOccurrence = exports.TimetableOverride = exports.TimetableAllocation = exports.TimetableTeacherAvailability = exports.TimetableHoliday = exports.TimetableVersion = exports.TimetablePeriod = exports.TimetableDailySession = exports.TimetableBellSchedule = exports.TimetableLocation = exports.TimetableSection = exports.TimetableTerm = exports.TimetableAcademicYear = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let TimetableAcademicYear = class TimetableAcademicYear {
    id;
    organizationId;
    organization;
    name;
    startsOn;
    endsOn;
    timeZone;
    active;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, name: { required: true, type: () => String }, startsOn: { required: true, type: () => String }, endsOn: { required: true, type: () => String }, timeZone: { required: true, type: () => String }, active: { required: true, type: () => Boolean }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableAcademicYear = TimetableAcademicYear;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableAcademicYear.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableAcademicYear.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], TimetableAcademicYear.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableAcademicYear.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableAcademicYear.prototype, "startsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableAcademicYear.prototype, "endsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64, default: "Asia/Tehran" }),
    __metadata("design:type", String)
], TimetableAcademicYear.prototype, "timeZone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], TimetableAcademicYear.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableAcademicYear.prototype, "createdAt", void 0);
exports.TimetableAcademicYear = TimetableAcademicYear = __decorate([
    (0, typeorm_1.Entity)("timetable_academic_years"),
    (0, typeorm_1.Index)(["organizationId", "name"], { unique: true })
], TimetableAcademicYear);
let TimetableTerm = class TimetableTerm {
    id;
    yearId;
    year;
    name;
    startsOn;
    endsOn;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, yearId: { required: true, type: () => String }, year: { required: false, type: () => Object }, name: { required: true, type: () => String }, startsOn: { required: true, type: () => String }, endsOn: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableTerm = TimetableTerm;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableTerm.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableTerm.prototype, "yearId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableAcademicYear", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "yearId" }),
    __metadata("design:type", Object)
], TimetableTerm.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableTerm.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableTerm.prototype, "startsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableTerm.prototype, "endsOn", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableTerm.prototype, "createdAt", void 0);
exports.TimetableTerm = TimetableTerm = __decorate([
    (0, typeorm_1.Entity)("timetable_terms"),
    (0, typeorm_1.Index)(["yearId", "name"], { unique: true })
], TimetableTerm);
let TimetableSection = class TimetableSection {
    id;
    organizationId;
    organization;
    name;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, name: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableSection = TimetableSection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableSection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableSection.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], TimetableSection.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableSection.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableSection.prototype, "createdAt", void 0);
exports.TimetableSection = TimetableSection = __decorate([
    (0, typeorm_1.Entity)("timetable_sections"),
    (0, typeorm_1.Index)(["organizationId", "name"], { unique: true })
], TimetableSection);
let TimetableLocation = class TimetableLocation {
    id;
    organizationId;
    organization;
    name;
    capacity;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, name: { required: true, type: () => String }, capacity: { required: true, type: () => Number }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableLocation = TimetableLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableLocation.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], TimetableLocation.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableLocation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetableLocation.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableLocation.prototype, "createdAt", void 0);
exports.TimetableLocation = TimetableLocation = __decorate([
    (0, typeorm_1.Entity)("timetable_locations"),
    (0, typeorm_1.Index)(["organizationId", "name"], { unique: true })
], TimetableLocation);
let TimetableBellSchedule = class TimetableBellSchedule {
    id;
    organizationId;
    organization;
    sectionId;
    section;
    name;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, sectionId: { required: true, type: () => String, nullable: true }, section: { required: false, type: () => Object }, name: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableBellSchedule = TimetableBellSchedule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableBellSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableBellSchedule.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], TimetableBellSchedule.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimetableBellSchedule.prototype, "sectionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableSection", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "sectionId" }),
    __metadata("design:type", Object)
], TimetableBellSchedule.prototype, "section", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableBellSchedule.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableBellSchedule.prototype, "createdAt", void 0);
exports.TimetableBellSchedule = TimetableBellSchedule = __decorate([
    (0, typeorm_1.Entity)("timetable_bells"),
    (0, typeorm_1.Index)(["organizationId", "name"], { unique: true })
], TimetableBellSchedule);
let TimetableDailySession = class TimetableDailySession {
    id;
    bellId;
    bell;
    name;
    kind;
    startTime;
    endTime;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, bellId: { required: true, type: () => String }, bell: { required: false, type: () => Object }, name: { required: true, type: () => String }, kind: { required: true, enum: ["MORNING", "AFTERNOON", "OTHER"] }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableDailySession = TimetableDailySession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableDailySession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableDailySession.prototype, "bellId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableBellSchedule", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "bellId" }),
    __metadata("design:type", Object)
], TimetableDailySession.prototype, "bell", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableDailySession.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "MORNING" }),
    __metadata("design:type", String)
], TimetableDailySession.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5 }),
    __metadata("design:type", String)
], TimetableDailySession.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5 }),
    __metadata("design:type", String)
], TimetableDailySession.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableDailySession.prototype, "createdAt", void 0);
exports.TimetableDailySession = TimetableDailySession = __decorate([
    (0, typeorm_1.Entity)("timetable_daily_sessions"),
    (0, typeorm_1.Index)(["bellId", "name"], { unique: true })
], TimetableDailySession);
let TimetablePeriod = class TimetablePeriod {
    id;
    sessionId;
    session;
    name;
    weekdays;
    ordinal;
    startTime;
    endTime;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, sessionId: { required: true, type: () => String }, session: { required: false, type: () => Object }, name: { required: true, type: () => String }, weekdays: { required: true, type: () => [Number] }, ordinal: { required: true, type: () => Number }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetablePeriod = TimetablePeriod;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetablePeriod.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetablePeriod.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableDailySession", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "sessionId" }),
    __metadata("design:type", Object)
], TimetablePeriod.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetablePeriod.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], TimetablePeriod.prototype, "weekdays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetablePeriod.prototype, "ordinal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5 }),
    __metadata("design:type", String)
], TimetablePeriod.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5 }),
    __metadata("design:type", String)
], TimetablePeriod.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetablePeriod.prototype, "createdAt", void 0);
exports.TimetablePeriod = TimetablePeriod = __decorate([
    (0, typeorm_1.Entity)("timetable_periods"),
    (0, typeorm_1.Index)(["sessionId", "ordinal"], { unique: true })
], TimetablePeriod);
let TimetableVersion = class TimetableVersion {
    id;
    termId;
    term;
    name;
    state;
    revision;
    effectiveOn;
    publishedAt;
    reason;
    createdById;
    createdBy;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, termId: { required: true, type: () => String }, term: { required: false, type: () => Object }, name: { required: true, type: () => String }, state: { required: true, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, revision: { required: true, type: () => Number }, effectiveOn: { required: true, type: () => String }, publishedAt: { required: true, type: () => Date, nullable: true }, reason: { required: true, type: () => String }, createdById: { required: true, type: () => String }, createdBy: { required: false, type: () => Object }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableVersion = TimetableVersion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableVersion.prototype, "termId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableTerm", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "termId" }),
    __metadata("design:type", Object)
], TimetableVersion.prototype, "term", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableVersion.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "DRAFT" }),
    __metadata("design:type", String)
], TimetableVersion.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetableVersion.prototype, "revision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableVersion.prototype, "effectiveOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], TimetableVersion.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], TimetableVersion.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableVersion.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "createdById" }),
    __metadata("design:type", Object)
], TimetableVersion.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableVersion.prototype, "createdAt", void 0);
exports.TimetableVersion = TimetableVersion = __decorate([
    (0, typeorm_1.Entity)("timetable_versions")
], TimetableVersion);
let TimetableHoliday = class TimetableHoliday {
    id;
    termId;
    term;
    date;
    name;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, termId: { required: true, type: () => String }, term: { required: false, type: () => Object }, date: { required: true, type: () => String }, name: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableHoliday = TimetableHoliday;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableHoliday.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableHoliday.prototype, "termId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableTerm", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "termId" }),
    __metadata("design:type", Object)
], TimetableHoliday.prototype, "term", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableHoliday.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableHoliday.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableHoliday.prototype, "createdAt", void 0);
exports.TimetableHoliday = TimetableHoliday = __decorate([
    (0, typeorm_1.Entity)("timetable_holidays"),
    (0, typeorm_1.Index)(["termId", "date"], { unique: true })
], TimetableHoliday);
let TimetableTeacherAvailability = class TimetableTeacherAvailability {
    id;
    organizationId;
    organization;
    teacherId;
    teacher;
    weekday;
    startTime;
    endTime;
    startsOn;
    endsOn;
    reason;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, teacherId: { required: true, type: () => String }, teacher: { required: false, type: () => Object }, weekday: { required: true, type: () => Number }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, startsOn: { required: true, type: () => String }, endsOn: { required: true, type: () => String }, reason: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableTeacherAvailability = TimetableTeacherAvailability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], TimetableTeacherAvailability.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "teacherId" }),
    __metadata("design:type", Object)
], TimetableTeacherAvailability.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetableTeacherAvailability.prototype, "weekday", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5 }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5 }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "startsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "endsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], TimetableTeacherAvailability.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableTeacherAvailability.prototype, "createdAt", void 0);
exports.TimetableTeacherAvailability = TimetableTeacherAvailability = __decorate([
    (0, typeorm_1.Entity)("timetable_teacher_availability")
], TimetableTeacherAvailability);
let TimetableAllocation = class TimetableAllocation {
    id;
    versionId;
    version;
    classroomId;
    classroom;
    classBookId;
    classBook;
    lessonsPerWeek;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, versionId: { required: true, type: () => String }, version: { required: false, type: () => Object }, classroomId: { required: true, type: () => String }, classroom: { required: false, type: () => Object }, classBookId: { required: true, type: () => String }, classBook: { required: false, type: () => Object }, lessonsPerWeek: { required: true, type: () => Number }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableAllocation = TimetableAllocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableAllocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableAllocation.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableVersion", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "versionId" }),
    __metadata("design:type", Object)
], TimetableAllocation.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableAllocation.prototype, "classroomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationClass", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "classroomId" }),
    __metadata("design:type", Object)
], TimetableAllocation.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableAllocation.prototype, "classBookId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationClassBook", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "classBookId" }),
    __metadata("design:type", Object)
], TimetableAllocation.prototype, "classBook", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetableAllocation.prototype, "lessonsPerWeek", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableAllocation.prototype, "createdAt", void 0);
exports.TimetableAllocation = TimetableAllocation = __decorate([
    (0, typeorm_1.Entity)("timetable_allocations"),
    (0, typeorm_1.Index)(["versionId", "classBookId"], { unique: true })
], TimetableAllocation);
let TimetableOverride = class TimetableOverride {
    id;
    versionId;
    version;
    lessonId;
    lesson;
    date;
    cancelled;
    teacherId;
    teacher;
    locationId;
    location;
    startTime;
    endTime;
    reason;
    changedById;
    changedBy;
    changedByName;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, versionId: { required: true, type: () => String }, version: { required: false, type: () => Object }, lessonId: { required: true, type: () => String }, lesson: { required: false, type: () => Object }, date: { required: true, type: () => String }, cancelled: { required: true, type: () => Boolean }, teacherId: { required: true, type: () => String, nullable: true }, teacher: { required: false, type: () => Object }, locationId: { required: true, type: () => String, nullable: true }, location: { required: false, type: () => Object }, startTime: { required: true, type: () => String, nullable: true }, endTime: { required: true, type: () => String, nullable: true }, reason: { required: true, type: () => String }, changedById: { required: true, type: () => String }, changedBy: { required: false, type: () => Object }, changedByName: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableOverride = TimetableOverride;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableOverride.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableOverride.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableVersion", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "versionId" }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableOverride.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("SchoolScheduleEntry", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "lessonId" }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableOverride.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], TimetableOverride.prototype, "cancelled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "teacherId" }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableLocation", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "locationId" }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5, nullable: true }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5, nullable: true }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], TimetableOverride.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableOverride.prototype, "changedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "changedById" }),
    __metadata("design:type", Object)
], TimetableOverride.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableOverride.prototype, "changedByName", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableOverride.prototype, "createdAt", void 0);
exports.TimetableOverride = TimetableOverride = __decorate([
    (0, typeorm_1.Entity)("timetable_overrides"),
    (0, typeorm_1.Index)(["lessonId", "date"], { unique: true })
], TimetableOverride);
let TimetableOccurrence = class TimetableOccurrence {
    id;
    lessonId;
    lesson;
    date;
    attendanceSessionId;
    attendanceSession;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, lessonId: { required: true, type: () => String }, lesson: { required: false, type: () => Object }, date: { required: true, type: () => String }, attendanceSessionId: { required: true, type: () => String, nullable: true }, attendanceSession: { required: false, type: () => Object }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableOccurrence = TimetableOccurrence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableOccurrence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableOccurrence.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("SchoolScheduleEntry", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "lessonId" }),
    __metadata("design:type", Object)
], TimetableOccurrence.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TimetableOccurrence.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimetableOccurrence.prototype, "attendanceSessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("AttendanceSession", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "attendanceSessionId" }),
    __metadata("design:type", Object)
], TimetableOccurrence.prototype, "attendanceSession", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableOccurrence.prototype, "createdAt", void 0);
exports.TimetableOccurrence = TimetableOccurrence = __decorate([
    (0, typeorm_1.Entity)("timetable_occurrences"),
    (0, typeorm_1.Index)(["lessonId", "date"], { unique: true })
], TimetableOccurrence);
let TimetableChange = class TimetableChange {
    id;
    versionId;
    version;
    lessonId;
    lesson;
    action;
    reason;
    actorId;
    actor;
    actorName;
    beforeText;
    afterText;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, versionId: { required: true, type: () => String }, version: { required: false, type: () => Object }, lessonId: { required: true, type: () => String, nullable: true }, lesson: { required: false, type: () => Object }, action: { required: true, type: () => String }, reason: { required: true, type: () => String }, actorId: { required: true, type: () => String }, actor: { required: false, type: () => Object }, actorName: { required: true, type: () => String }, beforeText: { required: true, type: () => String }, afterText: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableChange = TimetableChange;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableChange.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableChange.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableVersion", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "versionId" }),
    __metadata("design:type", Object)
], TimetableChange.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], TimetableChange.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("SchoolScheduleEntry", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "lessonId" }),
    __metadata("design:type", Object)
], TimetableChange.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableChange.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], TimetableChange.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableChange.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "actorId" }),
    __metadata("design:type", Object)
], TimetableChange.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableChange.prototype, "actorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], TimetableChange.prototype, "beforeText", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], TimetableChange.prototype, "afterText", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableChange.prototype, "createdAt", void 0);
exports.TimetableChange = TimetableChange = __decorate([
    (0, typeorm_1.Entity)("timetable_changes")
], TimetableChange);
let TimetableImport = class TimetableImport {
    id;
    versionId;
    version;
    actorId;
    actor;
    filename;
    sheetName;
    fingerprint;
    sourceRows;
    rowCount;
    revision;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, versionId: { required: true, type: () => String }, version: { required: false, type: () => Object }, actorId: { required: true, type: () => String }, actor: { required: false, type: () => Object }, filename: { required: true, type: () => String }, sheetName: { required: true, type: () => String }, fingerprint: { required: true, type: () => String, description: "Stable server-derived identity of the approved source-to-lesson mapping." }, sourceRows: { required: true, description: "Raw source labels retained for audit; resolved IDs remain on the lesson rows." }, rowCount: { required: true, type: () => Number }, revision: { required: true, type: () => Number }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TimetableImport = TimetableImport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TimetableImport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableImport.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableVersion", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "versionId" }),
    __metadata("design:type", Object)
], TimetableImport.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TimetableImport.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { nullable: false, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "actorId" }),
    __metadata("design:type", Object)
], TimetableImport.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableImport.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240 }),
    __metadata("design:type", String)
], TimetableImport.prototype, "sheetName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64 }),
    __metadata("design:type", String)
], TimetableImport.prototype, "fingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], TimetableImport.prototype, "sourceRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetableImport.prototype, "rowCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], TimetableImport.prototype, "revision", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimetableImport.prototype, "createdAt", void 0);
exports.TimetableImport = TimetableImport = __decorate([
    (0, typeorm_1.Entity)("timetable_imports"),
    (0, typeorm_1.Index)(["versionId", "fingerprint"], { unique: true })
], TimetableImport);
//# sourceMappingURL=timetable.entity.js.map