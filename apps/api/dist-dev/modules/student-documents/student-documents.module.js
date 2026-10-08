"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentDocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_documents_service_1 = require("./student-documents.service");
const student_document_entity_1 = require("../../database/entities/student-document.entity");
const document_type_entity_1 = require("../../database/entities/document-type.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const school_access_module_1 = require("../school-access/school-access.module");
let StudentDocumentsModule = class StudentDocumentsModule {
};
exports.StudentDocumentsModule = StudentDocumentsModule;
exports.StudentDocumentsModule = StudentDocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_document_entity_1.StudentDocument,
                document_type_entity_1.DocumentType,
                student_entity_1.Student,
                user_entity_1.User,
            ]),
            school_access_module_1.SchoolAccessModule,
        ],
        providers: [student_documents_service_1.StudentDocumentsService],
        exports: [student_documents_service_1.StudentDocumentsService],
    })
], StudentDocumentsModule);
//# sourceMappingURL=student-documents.module.js.map