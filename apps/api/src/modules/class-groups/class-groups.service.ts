import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access/school-access.service";
import { CreateClassGroupDto } from "./class-groups.dto";

@Injectable()
export class ClassGroupsService {
  constructor(
    @InjectRepository(EducationClass) private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassEnrollment) private readonly enrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(StudyGroup) private readonly groups: Repository<StudyGroup>,
    @InjectRepository(StudyGroupMembership) private readonly memberships: Repository<StudyGroupMembership>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly access: SchoolAccessService,
  ) {}

  async list(user: AuthenticatedUser, classId?: string, organizationId?: string) {
    const organizationIds = await this.access.scopedOrganizationIds(user, organizationId);
    if (!organizationIds.length) return [];
    const rows = await this.groups.find({
      where: classId
        ? { classroom: { id: classId }, organization: { id: In(organizationIds) } }
        : { organization: { id: In(organizationIds) } },
      relations: { organization: true, classroom: true, memberships: true },
      order: { name: "ASC" },
    });
    return rows.map((group) => this.view(group));
  }

  async create(user: AuthenticatedUser, dto: CreateClassGroupDto) {
    const classroom = await this.classes.findOne({ where: { id: dto.classId }, relations: { organization: true } });
    if (!classroom) throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
    await this.access.organizationForUser(user, classroom.organization.id);
    const code = dto.code.trim().toLowerCase();
    if (await this.groups.findOne({ where: { organization: { id: classroom.organization.id }, code } }))
      throw new ApiException(409, "CLASS_GROUP_CODE_EXISTS", "این کد گروه در مدرسه تکراری است.");
    const group = await this.groups.save(this.groups.create({
      organization: classroom.organization, classroom, code, name: dto.name.trim(), description: dto.description?.trim() || "", status: "ACTIVE",
    }));
    return this.view(await this.requireGroup(user, group.id));
  }

  async members(user: AuthenticatedUser, id: string) {
    const group = await this.requireGroup(user, id);
    const rows = await this.memberships.find({
      where: { group: { id: group.id } },
      relations: { student: { user: true } },
      order: { createdAt: "ASC" },
    });
    return rows.map((row) => ({ id: row.student.id, name: row.student.name, nationalCode: row.student.nationalCode, userId: row.student.user?.id ?? null }));
  }

  async setMembers(user: AuthenticatedUser, id: string, studentIds: string[]) {
    const group = await this.requireGroup(user, id);
    if (!group.classroom) throw new ApiException(409, "CLASS_GROUP_CLASS_REQUIRED", "این گروه هنوز به کلاس متصل نشده است.");
    const uniqueIds = [...new Set(studentIds || [])];
    const enrolled = await this.enrollments.find({
      where: { classroom: { id: group.classroom.id } },
      relations: { student: true },
    });
    const allowed = new Set(enrolled.map((row) => row.student.id));
    if (uniqueIds.some((id) => !allowed.has(id)))
      throw new ApiException(422, "CLASS_GROUP_MEMBER_NOT_ENROLLED", "همه اعضای گروه باید ابتدا عضو کلاس باشند.");
    const students = uniqueIds.length ? await this.students.find({ where: { id: In(uniqueIds) } }) : [];
    await this.memberships.delete({ group: { id: group.id } });
    if (students.length) await this.memberships.save(students.map((student) => this.memberships.create({ group, student })));
    return { groupId: group.id, count: students.length };
  }

  async remove(user: AuthenticatedUser, id: string) {
    const group = await this.requireGroup(user, id);
    await this.groups.remove(group);
    return { deleted: true };
  }

  private async requireGroup(user: AuthenticatedUser, id: string) {
    const group = await this.groups.findOne({
      where: { id },
      relations: { organization: true, classroom: true, memberships: true },
    });
    if (!group) throw new ApiException(404, "CLASS_GROUP_NOT_FOUND", "گروه کلاس پیدا نشد.");
    await this.access.organizationForUser(user, group.organization.id);
    return group;
  }

  private view(group: StudyGroup) {
    return {
      id: group.id, code: group.code, name: group.name, description: group.description, status: group.status,
      organizationId: group.organization.id, classId: group.classroom?.id ?? null, className: group.classroom?.name ?? null, memberCount: group.memberships?.length ?? 0,
    };
  }
}
