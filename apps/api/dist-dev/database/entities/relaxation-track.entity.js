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
exports.RelaxationTrack = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let RelaxationTrack = class RelaxationTrack {
    id;
    title;
    artist;
    url;
    active;
    organizationId;
    gradeIds;
    availableFrom;
    availableUntil;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, artist: { required: true, type: () => String }, url: { required: true, type: () => String }, active: { required: true, type: () => Boolean }, organizationId: { required: false, type: () => String, nullable: true }, gradeIds: { required: false, type: () => [Number], nullable: true }, availableFrom: { required: false, type: () => String, nullable: true }, availableUntil: { required: false, type: () => String, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.RelaxationTrack = RelaxationTrack;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RelaxationTrack.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], RelaxationTrack.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: "" }),
    __metadata("design:type", String)
], RelaxationTrack.prototype, "artist", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1600 }),
    __metadata("design:type", String)
], RelaxationTrack.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RelaxationTrack.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], RelaxationTrack.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], RelaxationTrack.prototype, "gradeIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], RelaxationTrack.prototype, "availableFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], RelaxationTrack.prototype, "availableUntil", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RelaxationTrack.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RelaxationTrack.prototype, "updatedAt", void 0);
exports.RelaxationTrack = RelaxationTrack = __decorate([
    (0, typeorm_1.Entity)("relaxation_tracks")
], RelaxationTrack);
//# sourceMappingURL=relaxation-track.entity.js.map