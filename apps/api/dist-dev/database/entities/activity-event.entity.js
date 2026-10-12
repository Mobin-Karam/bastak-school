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
exports.ActivityEvent = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let ActivityEvent = class ActivityEvent {
    id;
    student;
    type;
    resourceType;
    resourceId;
    data;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, type: { required: true, type: () => String }, resourceType: { required: true, type: () => String }, resourceId: { required: true, type: () => String }, data: { required: false, type: "object", additionalProperties: true, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ActivityEvent = ActivityEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ActivityEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], ActivityEvent.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48 }),
    __metadata("design:type", String)
], ActivityEvent.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40, default: "" }),
    __metadata("design:type", String)
], ActivityEvent.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: "" }),
    __metadata("design:type", String)
], ActivityEvent.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], ActivityEvent.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ActivityEvent.prototype, "createdAt", void 0);
exports.ActivityEvent = ActivityEvent = __decorate([
    (0, typeorm_1.Entity)("activity_events")
], ActivityEvent);
//# sourceMappingURL=activity-event.entity.js.map