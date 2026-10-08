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
exports.StudentTransferService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const import_history_entity_1 = require("../../database/entities/import-history.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const school_access_service_1 = require("../school-access/school-access.service");
let StudentTransferService = class StudentTransferService {
    students;
    dataSource;
    access;
    constructor(students, dataSource, access) {
        this.students = students;
        this.dataSource = dataSource;
        this.access = access;
    }
    async preview(user, dto) {
        const organization = await this.access.organizationForUser(user, dto.organizationId);
        const nationalCodes = dto.rows
            .map((row) => row.nationalCode)
            .filter((value) => Boolean(value));
        const existing = nationalCodes.length
            ? await this.students.find({
                where: { nationalCode: (0, typeorm_2.In)(nationalCodes) },
                relations: { organization: true },
            })
            : [];
        const existingCodes = new Set(existing.map((row) => row.nationalCode));
        const seen = new Set();
        const rows = dto.rows.map((row, index) => {
            const errors = [];
            const firstName = row.firstName.trim();
            const lastName = row.lastName.trim();
            if (!firstName || !lastName)
                errors.push("نام و نام خانوادگی الزامی است.");
            if (row.nationalCode) {
                if (seen.has(row.nationalCode))
                    errors.push("کد ملی در همین فایل تکراری است.");
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
    async commit(user, dto) {
        const organization = await this.access.organizationForUser(user, dto.organizationId);
        const preview = await this.preview(user, dto);
        if (preview.invalid)
            return { committed: false, ...preview };
        const created = await this.dataSource.transaction(async (manager) => {
            const actor = await manager.findOneByOrFail(user_entity_1.User, { id: user.id });
            const out = [];
            for (const row of dto.rows) {
                const student = manager.create(student_entity_1.Student, {
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
                out.push(await manager.save(student_entity_1.Student, student));
            }
            await manager.save(import_history_entity_1.ImportHistory, manager.create(import_history_entity_1.ImportHistory, {
                actor,
                organization,
                schemaVersion: "school-students/1.0",
                counts: { students: out.length },
                result: "SUCCESS",
                errors: null,
            }));
            return out;
        });
        return {
            committed: true,
            organization: { id: organization.id, name: organization.name },
            count: created.length,
            studentIds: created.map((row) => row.id),
        };
    }
    async exportRows(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(user, organizationId);
        if (!ids.length)
            return [];
        const rows = await this.students.find({
            where: { organization: { id: (0, typeorm_2.In)(ids) } },
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
};
exports.StudentTransferService = StudentTransferService;
exports.StudentTransferService = StudentTransferService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        school_access_service_1.SchoolAccessService])
], StudentTransferService);
//# sourceMappingURL=student-transfer.service.js.map