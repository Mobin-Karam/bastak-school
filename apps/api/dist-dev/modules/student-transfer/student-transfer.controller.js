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
exports.StudentTransferController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const student_transfer_dto_1 = require("./student-transfer.dto");
const student_transfer_service_1 = require("./student-transfer.service");
let StudentTransferController = class StudentTransferController {
    transfer;
    constructor(transfer) {
        this.transfer = transfer;
    }
    preview(user, dto) { return this.transfer.preview(user, dto).then(envelope_1.ok); }
    commit(user, dto) { return this.transfer.commit(user, dto).then(envelope_1.ok); }
    export(user, organizationId) { return this.transfer.exportRows(user, organizationId).then(envelope_1.ok); }
};
exports.StudentTransferController = StudentTransferController;
__decorate([
    (0, common_1.Post)("preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.import"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, student_transfer_dto_1.PreviewStudentImportDto]),
    __metadata("design:returntype", void 0)
], StudentTransferController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)("commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.import"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, student_transfer_dto_1.CommitStudentImportDto]),
    __metadata("design:returntype", void 0)
], StudentTransferController.prototype, "commit", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("export"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.export"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentTransferController.prototype, "export", null);
exports.StudentTransferController = StudentTransferController = __decorate([
    (0, common_1.Controller)("students/transfer"),
    __metadata("design:paramtypes", [student_transfer_service_1.StudentTransferService])
], StudentTransferController);
//# sourceMappingURL=student-transfer.controller.js.map