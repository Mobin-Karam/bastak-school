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
exports.DormRoom = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const dorm_room_assignment_entity_1 = require("./dorm-room-assignment.entity");
let DormRoom = class DormRoom {
    id;
    organization;
    code;
    name;
    building;
    floor;
    capacity;
    status;
    assignments;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, code: { required: true, type: () => String }, name: { required: true, type: () => String }, building: { required: true, type: () => String, description: "A residence can have several buildings; room codes remain unique per school." }, floor: { required: true, type: () => Number }, capacity: { required: true, type: () => Number }, status: { required: true, enum: ["ARCHIVED", "ACTIVE"] }, assignments: { required: true, type: () => [require("./dorm-room-assignment.entity").DormRoomAssignment] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.DormRoom = DormRoom;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DormRoom.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], DormRoom.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], DormRoom.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], DormRoom.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: "ساختمان اصلی" }),
    __metadata("design:type", String)
], DormRoom.prototype, "building", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 1 }),
    __metadata("design:type", Number)
], DormRoom.prototype, "floor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 1 }),
    __metadata("design:type", Number)
], DormRoom.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24, default: "ACTIVE" }),
    __metadata("design:type", String)
], DormRoom.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dorm_room_assignment_entity_1.DormRoomAssignment, (assignment) => assignment.room),
    __metadata("design:type", Array)
], DormRoom.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DormRoom.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DormRoom.prototype, "updatedAt", void 0);
exports.DormRoom = DormRoom = __decorate([
    (0, typeorm_1.Entity)("dorm_rooms"),
    (0, typeorm_1.Index)(["organization", "code"], { unique: true })
], DormRoom);
//# sourceMappingURL=dorm-room.entity.js.map