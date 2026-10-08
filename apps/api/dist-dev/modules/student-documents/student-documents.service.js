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
exports.StudentDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_document_entity_1 = require("../../database/entities/student-document.entity");
const document_type_entity_1 = require("../../database/entities/document-type.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const api_exception_1 = require("../../common/exceptions/api.exception");
const school_access_service_1 = require("../school-access/school-access.service");
let StudentDocumentsService = class StudentDocumentsService {
    documents;
    documentTypes;
    students;
    users;
    access;
    constructor(documents, documentTypes, students, users, access) {
        this.documents = documents;
        this.documentTypes = documentTypes;
        this.students = students;
        this.users = users;
        this.access = access;
    }
    async list(user, studentId) {
        const student = await this.getStudent(user, studentId);
        const documents = await this.documents.find({
            where: { student: { id: student.id } },
            relations: { type: true },
            order: { createdAt: "DESC" },
        });
        return documents.map(doc => ({
            id: doc.id,
            type: doc.type,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            originalFileName: doc.originalFileName,
            status: doc.status,
            verificationNote: doc.verificationNote,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        }));
    }
    async upload(user, studentId, type, file) {
        const student = await this.getStudent(user, studentId);
        const documentType = await this.documentTypes.findOne({ where: { code: type } });
        if (!documentType) {
            throw new api_exception_1.ApiException(404, "DOCUMENT_TYPE_NOT_FOUND", "نوع مدرک مورد نظر یافت نشد.");
        }
        const existing = await this.documents.findOne({
            where: { student: { id: student.id }, type: { code: type } }
        });
        const fileUrl = `/api/documents/${studentId}/${type}/${Date.now()}`;
        const document = this.documents.create();
        document.student = student;
        document.type = documentType.code;
        document.fileName = fileUrl;
        document.fileUrl = fileUrl;
        document.originalFileName = file.originalname;
        document.status = student_document_entity_1.DocumentStatus.PENDING;
        await this.documents.save(document);
        return {
            id: document.id,
            type: documentType,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            originalFileName: document.originalFileName,
            status: document.status,
            createdAt: document.createdAt,
        };
    }
    async verify(user, documentId, status, note) {
        const document = await this.documents.findOne({
            where: { id: documentId },
            relations: { student: { organization: true } }
        });
        if (!document) {
            throw new api_exception_1.ApiException(404, "DOCUMENT_NOT_FOUND", "مدرک یافت نشد.");
        }
        if (document.student.organization && document.student.organization.id) {
            await this.access.organizationForUser(user, document.student.organization.id);
        }
        if (status === "REJECTED" || status === "VERIFIED") {
            document.status = status;
        }
        document.verificationNote = note || "";
        document.verifiedBy = { id: user.id, username: user.username };
        document.updatedAt = new Date();
        await this.documents.save(document);
        return {
            id: document.id,
            status: document.status,
            verificationNote: document.verificationNote,
            verifiedBy: user,
            updatedAt: document.updatedAt,
        };
    }
    async getStudent(user, studentId) {
        if (studentId) {
            const student = await this.students.findOne({
                where: { id: studentId },
                relations: { organization: true, user: true }
            });
            if (!student) {
                throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
            }
            if (student.organization && student.organization.id) {
                await this.access.organizationForUser(user, student.organization.id);
            }
            return student;
        }
        const student = await this.students.findOne({
            where: { user: { id: user.id } },
            relations: { organization: true, user: true }
        });
        if (!student) {
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
        }
        return student;
    }
};
exports.StudentDocumentsService = StudentDocumentsService;
exports.StudentDocumentsService = StudentDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_document_entity_1.StudentDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(document_type_entity_1.DocumentType)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        school_access_service_1.SchoolAccessService])
], StudentDocumentsService);
//# sourceMappingURL=student-documents.service.js.map