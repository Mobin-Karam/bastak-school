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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DormitoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const dorm_room_assignment_entity_1 = require("../../database/entities/dorm-room-assignment.entity");
const dorm_room_entity_1 = require("../../database/entities/dorm-room.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const school_access_service_1 = require("../school-access/school-access.service");
let DormitoryService = class DormitoryService {
    rooms;
    assignments;
    students;
    access;
    constructor(rooms, assignments, students, access) {
        this.rooms = rooms;
        this.assignments = assignments;
        this.students = students;
        this.access = access;
    }
    async listRooms(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(user, organizationId);
        if (!ids.length)
            return [];
        const rows = await this.rooms.find({
            where: { organization: { id: (0, typeorm_2.In)(ids) } },
            relations: { organization: true, assignments: { student: true } },
            order: { name: "ASC" },
        });
        return rows.map((room) => ({
            id: room.id, organizationId: room.organization.id, organizationName: room.organization.name, code: room.code, name: room.name, capacity: room.capacity, status: room.status, studentCount: room.assignments?.length ?? 0,
        }));
    }
    async createRoom(user, dto) {
        const organization = await this.access.organizationForUser(user, dto.organizationId);
        const code = dto.code.trim().toLowerCase();
        if (await this.rooms.findOne({ where: { organization: { id: organization.id }, code } }))
            throw new api_exception_1.ApiException(409, "DORM_ROOM_EXISTS", "این کد اتاق در مدرسه تکراری است.");
        const room = await this.rooms.save(this.rooms.create({
            organization, code, name: dto.name.trim(), capacity: dto.capacity ?? 1, status: "ACTIVE",
        }));
        return { id: room.id, organizationId: organization.id, code: room.code, name: room.name, capacity: room.capacity, status: room.status, studentCount: 0 };
    }
    async listAssignments(user, roomId) {
        const room = await this.requireRoom(user, roomId);
        const rows = await this.assignments.find({
            where: { room: { id: room.id } },
            relations: { student: { user: true } },
            order: { createdAt: "ASC" },
        });
        return rows.map((row) => ({ id: row.id, studentId: row.student.id, name: row.student.name, nationalCode: row.student.nationalCode, userId: row.student.user?.id ?? null }));
    }
    async setAssignments(user, roomId, studentIds) {
        const room = await this.requireRoom(user, roomId);
        const ids = [...new Set(studentIds || [])];
        if (ids.length > room.capacity)
            throw new api_exception_1.ApiException(422, "DORM_ROOM_CAPACITY", "تعداد طلبه‌ها بیشتر از ظرفیت اتاق است.");
        const students = ids.length ? await this.students.find({ where: { id: (0, typeorm_2.In)(ids), organization: { id: room.organization.id } }, relations: { organization: true } }) : [];
        if (students.length !== ids.length)
            throw new api_exception_1.ApiException(422, "DORM_STUDENT_ORGANIZATION_MISMATCH", "همه طلبه‌ها باید متعلق به همین مدرسه باشند.");
        if (ids.length) {
            const previous = await this.assignments.find({ where: { student: { id: (0, typeorm_2.In)(ids) } }, relations: { room: { organization: true }, student: true } });
            const movable = previous.filter((item) => item.room.organization.id === room.organization.id && item.room.id !== room.id);
            if (movable.length)
                await this.assignments.remove(movable);
        }
        await this.assignments.delete({ room: { id: room.id } });
        if (students.length)
            await this.assignments.save(students.map((student) => this.assignments.create({ room, student })));
        return { roomId: room.id, count: students.length };
    }
    async requireRoom(user, id) {
        const room = await this.rooms.findOne({ where: { id }, relations: { organization: true } });
        if (!room)
            throw new api_exception_1.ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
        await this.access.organizationForUser(user, room.organization.id);
        return room;
    }
};
exports.DormitoryService = DormitoryService;
exports.DormitoryService = DormitoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dorm_room_entity_1.DormRoom)),
    __param(1, (0, typeorm_1.InjectRepository)(dorm_room_assignment_entity_1.DormRoomAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        school_access_service_1.SchoolAccessService])
], DormitoryService);
//# sourceMappingURL=dormitory.service.js.map