import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Like, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { NotificationsService } from "../notifications";
import { NotificationType } from "../../database/entities/notification.entity";
import { CreateDormRoomDto, SendDormAnnouncementDto, UpdateDormRoomDto } from "./dormitory.dto";
import { attendanceTransaction } from "../attendance";

@Injectable()
export class DormitoryService {
  constructor(
    @InjectRepository(DormRoom) private readonly rooms: Repository<DormRoom>,
    @InjectRepository(DormRoomAssignment) private readonly assignments: Repository<DormRoomAssignment>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly access: SchoolAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async listRooms(user: AuthenticatedUser, organizationId?: string, includeArchived = false) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
    if (!ids.length) return [];
    const query = this.rooms.createQueryBuilder("room")
      .innerJoin("room.organization", "organization")
      .select("room.id", "id")
      .addSelect("organization.id", "organizationId")
      .addSelect("organization.name", "organizationName")
      .addSelect("room.code", "code").addSelect("room.name", "name")
      .addSelect("room.building", "building").addSelect("room.floor", "floor")
      .addSelect("room.capacity", "capacity").addSelect("room.status", "status")
      .addSelect((query) => query.select("COUNT(*)").from(DormRoomAssignment, "assignment")
        .where("assignment.roomId = room.id"), "studentCount")
      .where("room.organizationId IN (:...ids)", { ids });
    if (!includeArchived) query.andWhere("room.status = :status", { status: "ACTIVE" });
    const rows = await query
      .orderBy("room.name", "ASC").addOrderBy("room.id", "ASC")
      .getRawMany<{ id: string; organizationId: string; organizationName: string; code: string; name: string; building: string; floor: number; capacity: number; status: string; studentCount: number | string }>();
    return rows.map((room) => ({ ...room, studentCount: Number(room.studentCount) }));
  }

  async createRoom(user: AuthenticatedUser, dto: CreateDormRoomDto) {
    const organization = await this.access.organizationForUser(user, dto.organizationId);
    const code = dto.code.trim().toLowerCase();
    if (await this.rooms.findOne({ where: { organization: { id: organization.id }, code } }))
      throw new ApiException(409, "DORM_ROOM_EXISTS", "این کد اتاق در مدرسه تکراری است.");
    const room = await this.rooms.save(this.rooms.create({
      organization, code, name: dto.name.trim(), building: dto.building?.trim() || "ساختمان اصلی", floor: dto.floor ?? 1, capacity: Math.min(14, dto.capacity ?? 14), status: "ACTIVE",
    }));
    return { id: room.id, organizationId: organization.id, code: room.code, name: room.name, building: room.building, floor: room.floor, capacity: room.capacity, status: room.status, studentCount: 0 };
  }

  async updateRoom(user: AuthenticatedUser, id: string, dto: UpdateDormRoomDto) {
    const room = await this.requireRoom(user, id);
    const code = dto.code?.trim().toLowerCase();
    if (code && code !== room.code) {
      const duplicate = await this.rooms.findOne({ where: { organization: { id: room.organization.id }, code } });
      if (duplicate) throw new ApiException(409, "DORM_ROOM_EXISTS", "این کد اتاق در مدرسه تکراری است.");
    }
    if (dto.capacity !== undefined) {
      const residentCount = await this.assignments.count({ where: { room: { id: room.id } } });
      if (dto.capacity < residentCount)
        throw new ApiException(422, "DORM_ROOM_CAPACITY", "ظرفیت جدید نمی‌تواند کمتر از تعداد ساکنان باشد.");
    }
    Object.assign(room, {
      ...(code ? { code } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.building !== undefined ? { building: dto.building.trim() } : {}),
      ...(dto.floor !== undefined ? { floor: dto.floor } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
    });
    const saved = await this.rooms.save(room);
    const studentCount = await this.assignments.count({ where: { room: { id: saved.id } } });
    return { id: saved.id, organizationId: saved.organization.id, code: saved.code, name: saved.name, building: saved.building, floor: saved.floor, capacity: saved.capacity, status: saved.status, studentCount };
  }

  async archiveRoom(user: AuthenticatedUser, id: string) {
    const room = await this.requireRoom(user, id);
    const residentCount = await this.assignments.count({ where: { room: { id: room.id } } });
    if (residentCount)
      throw new ApiException(422, "DORM_ROOM_OCCUPIED", "ابتدا همه ساکنان اتاق را جابه‌جا یا حذف کنید.");
    room.status = "ARCHIVED";
    await this.rooms.save(room);
    return { roomId: room.id, status: room.status };
  }

  async restoreRoom(user: AuthenticatedUser, id: string) {
    const room = await this.requireRoom(user, id);
    room.status = "ACTIVE";
    await this.rooms.save(room);
    return { roomId: room.id, status: room.status };
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

  async listAvailableStudents(user: AuthenticatedUser, roomId: string) {
    const room = await this.requireRoom(user, roomId);
    return this.students.createQueryBuilder("student")
      .leftJoin(DormRoomAssignment, "assignment", "assignment.studentId = student.id")
      .select("student.id", "id")
      .addSelect("student.name", "name")
      .where("student.organizationId = :organizationId", { organizationId: room.organization.id })
      .andWhere("(assignment.id IS NULL OR assignment.roomId = :roomId)", { roomId: room.id })
      .orderBy("student.name", "ASC")
      .addOrderBy("student.id", "ASC")
      .getRawMany<{ id: string; name: string }>();
  }

  async setAssignments(user: AuthenticatedUser, roomId: string, studentIds: string[]) {
    const ids = [...new Set(studentIds || [])];
    return attendanceTransaction(this.assignments.manager, async (manager) => {
      // Validate after admission, so concurrent moves cannot validate against a half-written placement.
      const room = await this.requireRoom(user, roomId);
      const assignments = manager.getRepository(DormRoomAssignment);
      if (ids.length > room.capacity) throw new ApiException(422, "DORM_ROOM_CAPACITY", "تعداد طلبه‌ها بیشتر از ظرفیت اتاق است.");
      const students = ids.length ? await manager.getRepository(Student).find({ where: { id: In(ids), organization: { id: room.organization.id } }, relations: { organization: true } }) : [];
      if (students.length !== ids.length) throw new ApiException(422, "DORM_STUDENT_ORGANIZATION_MISMATCH", "همه طلبه‌ها باید متعلق به همین مدرسه باشند.");
      // Moving and replacing commit together; unique studentId also protects alternate writers.
      if (ids.length) await assignments.createQueryBuilder().delete()
        .where("studentId IN (:...ids)", { ids })
        .andWhere("roomId IN (SELECT id FROM dorm_rooms WHERE organizationId = :organizationId)", { organizationId: room.organization.id })
        .execute();
      await assignments.delete({ room: { id: room.id } });
      if (students.length) await assignments.save(students.map((student) => assignments.create({ room, student })));
      return { roomId: room.id, count: students.length };
    });
  }

  async findStudents(user: AuthenticatedUser, organizationId: string, query: string) {
    const organization = await this.access.organizationForUser(user, organizationId);
    const term = query.trim();
    if (term.length < 2) return [];
    const rows = await this.students.find({
      where: [
        { organization: { id: organization.id }, name: Like(`%${term}%`) },
        { organization: { id: organization.id }, user: { phoneNumber: Like(`%${term}%`) } },
      ],
      relations: { user: true },
      take: 20,
      order: { name: "ASC" },
    });
    return rows.map((student) => ({
      id: student.id,
      name: student.name,
      phoneNumber: student.user?.phoneNumber ?? null,
      hasAccount: Boolean(student.user?.id),
    }));
  }

  async sendAnnouncement(user: AuthenticatedUser, dto: SendDormAnnouncementDto) {
    const organization = await this.access.organizationForUser(user, dto.organizationId);
    let recipients: Student[] = [];
    let targetLabel = "";
    if (dto.target === "ROOM") {
      const room = await this.rooms.findOne({ where: { id: dto.roomId, organization: { id: organization.id } }, relations: { assignments: { student: { user: true } } } });
      if (!room) throw new ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
      recipients = room.assignments.map((item) => item.student);
      targetLabel = room.name;
    } else {
      const student = await this.students.findOne({ where: { id: dto.studentId, organization: { id: organization.id } }, relations: { user: true } });
      if (!student) throw new ApiException(404, "DORM_STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
      recipients = [student];
      targetLabel = student.name;
    }
    const userIds = recipients.flatMap((student) => student.user?.id ? [student.user.id] : []);
    await this.notifications.createForUsers(userIds, {
      type: NotificationType.MESSAGE,
      category: "announcements",
      title: dto.title.trim(),
      body: dto.body.trim(),
      data: { source: "dormitory", target: dto.target, targetLabel },
      organizationId: organization.id,
    });
    return { delivered: userIds.length, target: dto.target, targetLabel };
  }

  private async requireRoom(user: AuthenticatedUser, id: string) {
    const room = await this.rooms.findOne({ where: { id }, relations: { organization: true } });
    if (!room) throw new ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
    await this.access.organizationForUser(user, room.organization.id);
    return room;
  }
}
