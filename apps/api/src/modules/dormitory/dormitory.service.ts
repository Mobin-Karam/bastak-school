import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access/school-access.service";
import { CreateDormRoomDto } from "./dormitory.dto";

@Injectable()
export class DormitoryService {
  constructor(
    @InjectRepository(DormRoom) private readonly rooms: Repository<DormRoom>,
    @InjectRepository(DormRoomAssignment) private readonly assignments: Repository<DormRoomAssignment>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly access: SchoolAccessService,
  ) {}

  async listRooms(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
    if (!ids.length) return [];
    const rows = await this.rooms.find({
      where: { organization: { id: In(ids) } },
      relations: { organization: true, assignments: { student: true } },
      order: { name: "ASC" },
    });
    return rows.map((room) => ({
      id: room.id, organizationId: room.organization.id, organizationName: room.organization.name, code: room.code, name: room.name, capacity: room.capacity, status: room.status, studentCount: room.assignments?.length ?? 0,
    }));
  }

  async createRoom(user: AuthenticatedUser, dto: CreateDormRoomDto) {
    const organization = await this.access.organizationForUser(user, dto.organizationId);
    const code = dto.code.trim().toLowerCase();
    if (await this.rooms.findOne({ where: { organization: { id: organization.id }, code } }))
      throw new ApiException(409, "DORM_ROOM_EXISTS", "این کد اتاق در مدرسه تکراری است.");
    const room = await this.rooms.save(this.rooms.create({
      organization, code, name: dto.name.trim(), capacity: dto.capacity ?? 1, status: "ACTIVE",
    }));
    return { id: room.id, organizationId: organization.id, code: room.code, name: room.name, capacity: room.capacity, status: room.status, studentCount: 0 };
  }

  async listAssignments(user: AuthenticatedUser, roomId: string) {
    const room = await this.requireRoom(user, roomId);
    const rows = await this.assignments.find({
      where: { room: { id: room.id } },
      relations: { student: { user: true } },
      order: { createdAt: "ASC" },
    });
    return rows.map((row) => ({ id: row.id, studentId: row.student.id, name: row.student.name, nationalCode: row.student.nationalCode, userId: row.student.user?.id ?? null }));
  }

  async setAssignments(user: AuthenticatedUser, roomId: string, studentIds: string[]) {
    const room = await this.requireRoom(user, roomId);
    const ids = [...new Set(studentIds || [])];
    if (ids.length > room.capacity) throw new ApiException(422, "DORM_ROOM_CAPACITY", "تعداد طلبه‌ها بیشتر از ظرفیت اتاق است.");
    const students = ids.length ? await this.students.find({ where: { id: In(ids), organization: { id: room.organization.id } }, relations: { organization: true } }) : [];
    if (students.length !== ids.length) throw new ApiException(422, "DORM_STUDENT_ORGANIZATION_MISMATCH", "همه طلبه‌ها باید متعلق به همین مدرسه باشند.");

    // Each student can belong to only one current room. Existing assignment in another room is moved.
    if (ids.length) {
      const previous = await this.assignments.find({ where: { student: { id: In(ids) } }, relations: { room: { organization: true }, student: true } });
      const movable = previous.filter((item) => item.room.organization.id === room.organization.id && item.room.id !== room.id);
      if (movable.length) await this.assignments.remove(movable);
    }
    await this.assignments.delete({ room: { id: room.id } });
    if (students.length) await this.assignments.save(students.map((student) => this.assignments.create({ room, student })));
    return { roomId: room.id, count: students.length };
  }

  private async requireRoom(user: AuthenticatedUser, id: string) {
    const room = await this.rooms.findOne({ where: { id }, relations: { organization: true } });
    if (!room) throw new ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
    await this.access.organizationForUser(user, room.organization.id);
    return room;
  }
}
