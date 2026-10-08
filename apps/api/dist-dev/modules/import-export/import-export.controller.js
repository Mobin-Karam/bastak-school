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
exports.ImportExportController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const import_export_service_1 = require("./import-export.service");
let ImportExportController = class ImportExportController {
    transfer;
    constructor(transfer) {
        this.transfer = transfer;
    }
    context(user) {
        return {
            ...user,
            roles: user.roles || [user.role],
            capabilities: user.capabilities || [],
            membershipIds: user.membershipIds || [],
            organizationIds: user.organizationIds || [],
        };
    }
    payload(body) {
        const data = body.data && typeof body.data === "object" && !Array.isArray(body.data)
            ? body.data
            : body;
        return {
            ...data,
            schemaVersion: String(data.schemaVersion || "2.0"),
            studentId: body.studentId
                ? String(body.studentId)
                : data.studentId
                    ? String(data.studentId)
                    : undefined,
            organizationId: body.organizationId
                ? String(body.organizationId)
                : data.organizationId
                    ? String(data.organizationId)
                    : undefined,
            scope: body.scope
                ? String(body.scope)
                : data.scope
                    ? String(data.scope)
                    : undefined,
            publishImported: body.publishImported,
            replaceExistingPlans: body.replaceExistingPlans,
            replaceExistingExams: body.replaceExistingExams,
            skipExistingPlans: body.skipExistingPlans,
            skipExistingExams: body.skipExistingExams,
            sourceName: body.sourceName ? String(body.sourceName) : undefined,
        };
    }
    exportData(user, studentId, organizationId, scope, from, to) {
        return this.transfer
            .export(this.context(user), studentId, organizationId, scope, from, to)
            .then(envelope_1.ok);
    }
    template() {
        return (0, envelope_1.ok)(this.transfer.template());
    }
    preview(user, body) {
        return this.transfer
            .preview(this.context(user), this.payload(body))
            .then(envelope_1.ok);
    }
    commit(user, body) {
        return this.transfer
            .commit(this.context(user), user.id, this.payload(body))
            .then(envelope_1.ok);
    }
    history(user) {
        return this.transfer.history(this.context(user)).then(envelope_1.ok);
    }
};
exports.ImportExportController = ImportExportController;
__decorate([
    openapi.ApiQuery({ name: "studentId", required: false }),
    openapi.ApiQuery({ name: "organizationId", required: false }),
    openapi.ApiQuery({ name: "scope", required: false }),
    openapi.ApiQuery({ name: "from", required: false }),
    openapi.ApiQuery({ name: "to", required: false }),
    (0, common_1.Get)("export/json"),
    (0, capabilities_decorator_1.RequireCapabilities)("export.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("studentId")),
    __param(2, (0, common_1.Query)("organizationId")),
    __param(3, (0, common_1.Query)("scope")),
    __param(4, (0, common_1.Query)("from")),
    __param(5, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ImportExportController.prototype, "exportData", null);
__decorate([
    (0, common_1.Get)("import/template"),
    (0, capabilities_decorator_1.RequireCapabilities)("import.preview"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImportExportController.prototype, "template", null);
__decorate([
    (0, common_1.Post)("import/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("import.preview"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ImportExportController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)("import/commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("import.commit"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ImportExportController.prototype, "commit", null);
__decorate([
    (0, common_1.Get)("import/history"),
    (0, capabilities_decorator_1.RequireCapabilities)("import.preview"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportExportController.prototype, "history", null);
exports.ImportExportController = ImportExportController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [import_export_service_1.ImportExportService])
], ImportExportController);
//# sourceMappingURL=import-export.controller.js.map