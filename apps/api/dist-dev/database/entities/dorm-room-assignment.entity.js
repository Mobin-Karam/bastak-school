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
exports.DormRoomAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const dorm_room_entity_1 = require("./dorm-room.entity");
const student_entity_1 = require("./student.entity");
let DormRoomAssignment = class DormRoomAssignment {
    id;
    room;
    student;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, room: { required: true, type: () => require("./dorm-room.entity").DormRoom }, student: { required: true, type: () => require("./student.entity").Student }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.DormRoomAssignment = DormRoomAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DormRoomAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dorm_room_entity_1.DormRoom, (room) => room.assignments, {
        onDelete: "CASCADE",
    }),
    __metadata("design:type", dorm_room_entity_1.DormRoom)
], DormRoomAssignment.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], DormRoomAssignment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DormRoomAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DormRoomAssignment.prototype, "updatedAt", void 0);
exports.DormRoomAssignment = DormRoomAssignment = __decorate([
    (0, typeorm_1.Entity)("dorm_room_assignments"),
    (0, typeorm_1.Index)(["room", "student"], { unique: true })
], DormRoomAssignment);
//# sourceMappingURL=dorm-room-assignment.entity.js.map