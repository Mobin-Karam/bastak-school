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
exports.SchoolPrayerTime = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
let SchoolPrayerTime = class SchoolPrayerTime {
    id;
    organization;
    date;
    fajr;
    sunrise;
    dhuhr;
    asr;
    maghrib;
    isha;
    source;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, date: { required: true, type: () => String, description: "ISO day in the school's local calendar; blank means the organization default." }, fajr: { required: true, type: () => String }, sunrise: { required: true, type: () => String }, dhuhr: { required: true, type: () => String }, asr: { required: true, type: () => String }, maghrib: { required: true, type: () => String }, isha: { required: true, type: () => String }, source: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SchoolPrayerTime = SchoolPrayerTime;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], SchoolPrayerTime.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "fajr", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "sunrise", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "dhuhr", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "asr", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "maghrib", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "isha", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160, default: "" }),
    __metadata("design:type", String)
], SchoolPrayerTime.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SchoolPrayerTime.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SchoolPrayerTime.prototype, "updatedAt", void 0);
exports.SchoolPrayerTime = SchoolPrayerTime = __decorate([
    (0, typeorm_1.Entity)("school_prayer_times"),
    (0, typeorm_1.Index)(["organization", "date"], { unique: true })
], SchoolPrayerTime);
//# sourceMappingURL=school-prayer-time.entity.js.map