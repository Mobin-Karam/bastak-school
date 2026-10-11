import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { ImportHistory } from "../../database/entities/import-history.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import {
  PreviewStudentImportDto,
  StudentImportRowDto,
} from "./student-transfer.dto";

@Injectable()
export class StudentTransferService {
  constructor(
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly dataSource: DataSource,
    private readonly access: SchoolAccessService,
  ) {}

  async preview(user: AuthenticatedUser, dto: PreviewStudentImportDto) {
    const organization = await this.access.organizationForUser(
      user,
      dto.organizationId,
    );
    const nationalCodes = dto.rows
      .map((row) => row.nationalCode)
      .filter((value): value is string => Boolean(value));
    const existing = nationalCodes.length
      ? await this.students.find({
          where: { nationalCode: In(nationalCodes) },
          relations: { organization: true },
        })
      : [];
    const existingCodes = new Set(existing.map((row) => row.nationalCode));
    const seen = new Set<string>();
    const rows = dto.rows.map((row, index) => {
      const errors: string[] = [];
      const firstName = row.firstName.trim();
      const lastName = row.lastName.trim();
      if (!firstName) errors.push("ستون «نام» الزامی است.");
      if (!lastName) errors.push("ستون «نام خانوادگی» الزامی است.");
      if (row.nationalCode) {
        if (seen.has(row.nationalCode))
          errors.push("ستون «کد ملی» در همین فایل تکراری است.");
        if (existingCodes.has(row.nationalCode))
          errors.push("کد ملی قبلاً در سامانه ثبت شده است.");
        seen.add(row.nationalCode);
      }
      return {
        row: index + 2,
        firstName,
        lastName,
        nationalCode: row.nationalCode ?? null,
        gradeId: row.gradeId ?? null,
        educationTypeId: row.educationTypeId?.trim() || "general",
        trackId: row.trackId?.trim() || "general",
        errors,
      };
    });
    return {
      organization: { id: organization.id, name: organization.name },
      total: rows.length,
      valid: rows.filter((row) => !row.errors.length).length,
      invalid: rows.filter((row) => row.errors.length).length,
      rows,
    };
  }

  async commit(user: AuthenticatedUser, dto: PreviewStudentImportDto) {
    const organization = await this.access.organizationForUser(
      user,
      dto.organizationId,
    );
    const preview = await this.preview(user, dto);
    if (preview.invalid) return { committed: false, ...preview };
    const created = await this.dataSource.transaction(async (manager) => {
      const actor = await manager.findOneByOrFail(User, { id: user.id });
      const out: Student[] = [];
      for (const row of dto.rows) {
        const student = manager.create(Student, {
          organization,
          user: null,
          name: `${row.firstName.trim()} ${row.lastName.trim()}`.trim(),
          nationalCode: row.nationalCode || null,
          gradeId: row.gradeId ?? null,
          educationTypeId: row.educationTypeId?.trim() || "general",
          trackId: row.trackId?.trim() || "general",
          grade: row.gradeId ? String(row.gradeId) : "",
          major: "",
          targetUniversity: "",
          targetField: "",
          targetRank: "",
          dailyCapacity: "",
          accountStatus: "active",
          onboardingStatus: "PENDING_ASSIGNMENT",
          registrationStatus: "ACCOUNT_CREATED",
        });
        out.push(await manager.save(Student, student));
      }
      await manager.save(
        ImportHistory,
        manager.create(ImportHistory, {
          actor,
          organization,
          schemaVersion: "school-students/1.0",
          counts: { students: out.length },
          result: "SUCCESS",
          errors: null,
        }),
      );
      return out;
    });
    return {
      committed: true,
      organization: { id: organization.id, name: organization.name },
      count: created.length,
      studentIds: created.map((row) => row.id),
    };
  }

  async exportRows(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
    if (!ids.length) return [];
    const rows = await this.students.find({
      where: { organization: { id: In(ids) } },
      relations: { organization: true, user: true },
      order: { name: "ASC" },
    });
    return rows.map((row) => ({
      organizationId: row.organization?.id ?? null,
      organizationName: row.organization?.name ?? "",
      studentId: row.id,
      firstName: row.user?.firstName ?? row.name.split(" ")[0] ?? "",
      lastName: row.user?.lastName ?? row.name.split(" ").slice(1).join(" "),
      fullName: row.name,
      nationalCode: row.nationalCode ?? "",
      phoneNumber: row.user?.phoneNumber ?? "",
      gradeId: row.gradeId ?? "",
      educationTypeId: row.educationTypeId,
      trackId: row.trackId,
      registrationStatus: row.registrationStatus,
      accountStatus: row.accountStatus,
    }));
  }
}
