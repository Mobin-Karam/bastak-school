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
exports.StudentDocumentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const student_documents_service_1 = require("./student-documents.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
let StudentDocumentsController = class StudentDocumentsController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    async list(user, studentId) {
        return this.documents.list(user, studentId).then(envelope_1.ok);
    }
    async upload(user, studentId, type) {
        return this.documents.upload(user, studentId, type, {
            fieldname: "file",
            originalname: "document.pdf",
            encoding: "7bit",
            mimetype: "application/pdf",
            size: 1024,
            destination: "./uploads",
            filename: "document.pdf",
            path: "./uploads/document.pdf",
            buffer: Buffer.from([]),
        }).then(envelope_1.ok);
    }
    async verify(user, id, status, note) {
        return this.documents.verify(user, id, status, note).then(envelope_1.ok);
    }
};
exports.StudentDocumentsController = StudentDocumentsController;
__decorate([
    openapi.ApiQuery({ name: "studentId", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("documents.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentDocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(":studentId/upload"),
    (0, capabilities_decorator_1.RequireCapabilities)("documents.manage"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads",
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                callback(null, `${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Body)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], StudentDocumentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Patch)(":id/verify"),
    (0, capabilities_decorator_1.RequireCapabilities)("documents.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("status")),
    __param(3, (0, common_1.Body)("note")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], StudentDocumentsController.prototype, "verify", null);
exports.StudentDocumentsController = StudentDocumentsController = __decorate([
    (0, common_1.Controller)("student-documents"),
    __metadata("design:paramtypes", [student_documents_service_1.StudentDocumentsService])
], StudentDocumentsController);
//# sourceMappingURL=student-documents.controller.js.map