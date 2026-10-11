import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Organization } from "../../database/entities/organization.entity";
import { RegistrationProgress, RegistrationSectionStatus } from "../../database/entities/registration-progress.entity";
import { REGISTRATION_SECTIONS, RegistrationRequirement, RegistrationSectionCode } from "../../database/entities/registration-requirement.entity";
import { StudentContact, StudentContactType } from "../../database/entities/student-contact.entity";
import { StudentProfile } from "../../database/entities/student-profile.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { isValidIranianNationalCode } from "../onboarding";
import { SchoolAccessService } from "../school-access";
import { RegistrationRequirementDto, ReviewRegistrationSectionDto, StudentContactDto, UpdateRegistrationProfileDto } from "./registration.dto";

const DEFAULT_REQUIREMENTS: Array<{ sectionCode: RegistrationSectionCode; enabled: boolean; required: boolean; sortOrder: number }> = [
  { sectionCode: "BASIC_INFORMATION", enabled: true, required: true, sortOrder: 10 },
  { sectionCode: "IDENTITY_INFORMATION", enabled: false, required: false, sortOrder: 20 },
  { sectionCode: "ADDRESS_CONTACT", enabled: false, required: false, sortOrder: 30 },
  { sectionCode: "PARENTS", enabled: false, required: false, sortOrder: 40 },
  { sectionCode: "PREVIOUS_EDUCATION", enabled: false, required: false, sortOrder: 50 },
  { sectionCode: "DOCUMENTS", enabled: false, required: false, sortOrder: 60 },
  { sectionCode: "HEALTH", enabled: false, required: false, sortOrder: 70 },
  { sectionCode: "VACCINATION", enabled: false, required: false, sortOrder: 80 },
  { sectionCode: "INSURANCE", enabled: false, required: false, sortOrder: 90 },
  { sectionCode: "CONSENTS", enabled: false, required: false, sortOrder: 100 },
  { sectionCode: "TRANSPORT", enabled: false, required: false, sortOrder: 110 },
  { sectionCode: "TUITION", enabled: false, required: false, sortOrder: 120 },
  { sectionCode: "LEGAL_GUARDIAN", enabled: false, required: false, sortOrder: 130 },
  { sectionCode: "EMERGENCY_CONTACT", enabled: false, required: false, sortOrder: 140 },
  { sectionCode: "PHOTOGRAPHS", enabled: false, required: false, sortOrder: 150 },
];

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Student) private readonly studentsRepo: Repository<Student>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    @InjectRepository(StudentContact) private readonly contacts: Repository<StudentContact>,
    @InjectRepository(RegistrationRequirement) private readonly requirementsRepo: Repository<RegistrationRequirement>,
    @InjectRepository(RegistrationProgress) private readonly progressRepo: Repository<RegistrationProgress>,
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    private readonly access: SchoolAccessService,
  ) {}

  async self(user: AuthenticatedUser) {
    const student = await this.selfStudent(user);
    const organization = await this.studentOrganization(student, user);
    const [profile, contacts, requirements, progress] = await Promise.all([
      this.profiles.findOne({ where: { student: { id: student.id } } }),
      this.contacts.find({ where: { student: { id: student.id } }, order: { type: "ASC" } }),
      this.ensureRequirements(organization),
      this.progressRepo.find({ where: { student: { id: student.id }, organization: { id: organization.id } } }),
    ]);
    const progressBySection = new Map(progress.map((item) => [item.sectionCode, item]));
    return {
      student: { id: student.id, name: student.name, nationalCode: student.nationalCode, registrationStatus: student.registrationStatus, organization: { id: organization.id, name: organization.name } },
      profile: profile ?? null,
      contacts,
      sections: requirements.filter((item) => item.enabled).sort((a,b) => a.sortOrder-b.sortOrder).map((item) => ({
        sectionCode: item.sectionCode, required: item.required, sortOrder: item.sortOrder, announcement: item.announcement, opensAt: item.opensAt, closesAt: item.closesAt, status: progressBySection.get(item.sectionCode)?.status ?? "NOT_STARTED", reviewNote: progressBySection.get(item.sectionCode)?.reviewNote ?? "",
      })),
    };
  }

  async updateProfile(user: AuthenticatedUser, dto: UpdateRegistrationProfileDto) {
    const student = await this.selfStudent(user);
    if (dto.nationalCode) {
      if (!isValidIranianNationalCode(dto.nationalCode)) throw new ApiException(422, "INVALID_NATIONAL_CODE", "کد ملی معتبر نیست.");
      const existing = await this.studentsRepo.findOne({ where: { nationalCode: dto.nationalCode } });
      if (existing && existing.id !== student.id) throw new ApiException(409, "NATIONAL_CODE_EXISTS", "این کد ملی قبلاً ثبت شده است.");
      student.nationalCode = dto.nationalCode;
    }
    if (dto.gradeId !== undefined) student.gradeId = dto.gradeId;
    if (dto.educationTypeId !== undefined) student.educationTypeId = dto.educationTypeId.trim();
    if (dto.trackId !== undefined) student.trackId = dto.trackId.trim();
    student.registrationStatus = student.registrationStatus === "ACCOUNT_CREATED" ? "IN_PROGRESS" : student.registrationStatus;
    await this.studentsRepo.save(student);

    let profile = await this.profiles.findOne({ where: { student: { id: student.id } } });
    if (!profile) profile = this.profiles.create({ student });
    if (dto.birthCertificateNumber !== undefined) profile.birthCertificateNumber = dto.birthCertificateNumber || null;
    if (dto.birthDate !== undefined) profile.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.birthPlace !== undefined) profile.birthPlace = dto.birthPlace || null;
    if (dto.certificateIssuePlace !== undefined) profile.certificateIssuePlace = dto.certificateIssuePlace || null;
    if (dto.gender !== undefined) profile.gender = dto.gender || null;
    if (dto.previousSchool !== undefined) profile.previousSchool = dto.previousSchool || null;
    if (dto.address !== undefined) profile.address = dto.address || null;
    if (dto.postalCode !== undefined) profile.postalCode = dto.postalCode || null;
    if (dto.homePhone !== undefined) profile.homePhone = dto.homePhone || null;
    if (dto.emergencyPhone !== undefined) profile.emergencyPhone = dto.emergencyPhone || null;
    if (dto.healthNotes !== undefined) profile.healthNotes = dto.healthNotes || null;
    if (dto.insuranceProvider !== undefined) profile.insuranceProvider = dto.insuranceProvider || null;
    if (dto.insuranceNumber !== undefined) profile.insuranceNumber = dto.insuranceNumber || null;
    if (dto.transportNotes !== undefined) profile.transportNotes = dto.transportNotes || null;
    await this.profiles.save(profile);
    return this.self(user);
  }

  async setContacts(user: AuthenticatedUser, input: StudentContactDto[]) {
    const student = await this.selfStudent(user);
    const unique = new Map(input.map((item) => [item.type, item]));
    await this.contacts.delete({ student: { id: student.id } });
    if (unique.size) await this.contacts.save([...unique.values()].map((item) => this.contacts.create({ student, type: item.type as StudentContactType, fullName: item.fullName.trim(), nationalCode: item.nationalCode || null, phoneNumber: item.phoneNumber?.trim() || null, occupation: item.occupation?.trim() || null })));
    student.registrationStatus = student.registrationStatus === "ACCOUNT_CREATED" ? "IN_PROGRESS" : student.registrationStatus;
    await this.studentsRepo.save(student);
    return this.self(user);
  }

  async submitSection(user: AuthenticatedUser, sectionCode: string, status: "IN_PROGRESS" | "SUBMITTED") {
    const student = await this.selfStudent(user);
    const organization = await this.studentOrganization(student, user);
    const section = this.section(sectionCode);
    const requirement = (await this.ensureRequirements(organization)).find((item) => item.sectionCode === section);
    if (!requirement?.enabled) throw new ApiException(409, "REGISTRATION_SECTION_DISABLED", "این مرحله هنوز توسط مدیریت مدرسه فعال نشده است.");
    const now = Date.now();
    if (requirement.opensAt && requirement.opensAt.getTime() > now) throw new ApiException(409, "REGISTRATION_SECTION_NOT_OPEN", "زمان تکمیل این مرحله هنوز شروع نشده است.");
    if (requirement.closesAt && requirement.closesAt.getTime() < now) throw new ApiException(409, "REGISTRATION_SECTION_CLOSED", "زمان تکمیل این مرحله پایان یافته است.");
    let progress = await this.progressRepo.findOne({ where: { student: { id: student.id }, organization: { id: organization.id }, sectionCode: section } });
    if (!progress) progress = this.progressRepo.create({ student, organization, sectionCode: section, status });
    progress.status = status; progress.reviewNote = "";
    await this.progressRepo.save(progress);
    await this.refreshStudentStatus(student, organization);
    return this.self(user);
  }

  async requirements(user: AuthenticatedUser, organizationId: string) {
    const organization = await this.access.organizationForUser(user, organizationId);
    return this.ensureRequirements(organization);
  }

  async setRequirements(user: AuthenticatedUser, organizationId: string, input: RegistrationRequirementDto[]) {
    const organization = await this.access.organizationForUser(user, organizationId);
    const incoming = new Map(input.map((item) => [this.section(item.sectionCode), item]));
    for (const section of REGISTRATION_SECTIONS) {
      const item = incoming.get(section);
      if (!item) continue;
      let row = await this.requirementsRepo.findOne({ where: { organization: { id: organization.id }, sectionCode: section } });
      if (!row) row = this.requirementsRepo.create({ organization, sectionCode: section });
      row.enabled = item.enabled; row.required = item.required; row.sortOrder = item.sortOrder; row.announcement = item.announcement?.trim() || ""; row.opensAt = item.opensAt ? new Date(item.opensAt) : null; row.closesAt = item.closesAt ? new Date(item.closesAt) : null;
      await this.requirementsRepo.save(row);
    }
    return this.ensureRequirements(organization);
  }

  async students(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
    if (!ids.length) return [];
    const rows = await this.studentsRepo.find({ where: { organization: { id: In(ids) } }, relations: { organization: true, user: true }, order: { createdAt: "DESC" } });
    return rows.map((student) => ({ id: student.id, name: student.name, nationalCode: student.nationalCode, phoneNumber: student.user?.phoneNumber ?? null, organizationId: student.organization?.id ?? null, registrationStatus: student.registrationStatus, createdAt: student.createdAt }));
  }

  async reviewSection(user: AuthenticatedUser, studentId: string, sectionCode: string, dto: ReviewRegistrationSectionDto) {
    const student = await this.studentsRepo.findOne({ where: { id: studentId }, relations: { organization: true } });
    if (!student) throw new ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
    const organization = await this.studentOrganization(student, user);
    await this.access.organizationForUser(user, organization.id);
    const section = this.section(sectionCode);
    let progress = await this.progressRepo.findOne({ where: { student: { id: student.id }, organization: { id: organization.id }, sectionCode: section } });
    if (!progress) progress = this.progressRepo.create({ student, organization, sectionCode: section, status: "NOT_STARTED" });
    progress.status = dto.status as RegistrationSectionStatus; progress.reviewNote = dto.reviewNote?.trim() || "";
    await this.progressRepo.save(progress);
    await this.refreshStudentStatus(student, organization);
    return { studentId: student.id, sectionCode: section, status: progress.status, reviewNote: progress.reviewNote, registrationStatus: student.registrationStatus };
  }

  private async ensureRequirements(organization: Organization) {
    let rows = await this.requirementsRepo.find({ where: { organization: { id: organization.id } }, order: { sortOrder: "ASC" } });
    if (!rows.length) {
      rows = await this.requirementsRepo.save(DEFAULT_REQUIREMENTS.map((item) => this.requirementsRepo.create({ organization, ...item, announcement: "" })));
    }
    return rows;
  }

  private async refreshStudentStatus(student: Student, organization: Organization) {
    const requirements = (await this.ensureRequirements(organization)).filter((item) => item.enabled && item.required);
    const progress = await this.progressRepo.find({ where: { student: { id: student.id }, organization: { id: organization.id } } });
    const map = new Map(progress.map((item) => [item.sectionCode, item.status]));
    if (progress.some((item) => item.status === "NEEDS_CORRECTION")) student.registrationStatus = "NEEDS_CORRECTION";
    else if (requirements.length && requirements.every((item) => map.get(item.sectionCode) === "APPROVED")) student.registrationStatus = "APPROVED";
    else if (requirements.length && requirements.every((item) => ["SUBMITTED", "APPROVED"].includes(map.get(item.sectionCode) ?? ""))) student.registrationStatus = "WAITING_REVIEW";
    else student.registrationStatus = "IN_PROGRESS";
    await this.studentsRepo.save(student);
  }

  private async selfStudent(user: AuthenticatedUser) {
    const student = await this.studentsRepo.findOne({ where: { user: { id: user.id } }, relations: { user: true, organization: true } });
    if (!student) throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
    return student;
  }
  private async studentOrganization(student: Student, user: AuthenticatedUser) {
    if (student.organization) return student.organization;
    const ids = await this.access.organizationIds(user);
    if (!ids.length) throw new ApiException(409, "STUDENT_ORGANIZATION_REQUIRED", "مدرسه طلبه مشخص نشده است.");
    const organization = await this.organizations.findOneBy({ id: ids[0] });
    if (!organization) throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    student.organization = organization; await this.studentsRepo.save(student);
    return organization;
  }
  private section(value: string): RegistrationSectionCode {
    if ((REGISTRATION_SECTIONS as readonly string[]).includes(value)) return value as RegistrationSectionCode;
    throw new ApiException(422, "REGISTRATION_SECTION_INVALID", "مرحله ثبت‌نام معتبر نیست.");
  }
}
