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
exports.ClassesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const classes_dto_1 = require("./classes.dto");
const classes_service_1 = require("./classes.service");
let ClassesController = class ClassesController {
    classes;
    constructor(classes) {
        this.classes = classes;
    }
    list(actor, organizationId) {
        return this.classes.list(actor, organizationId).then(envelope_1.ok);
    }
    assigned(actor, studentId) {
        return this.classes.assigned(actor, studentId).then(envelope_1.ok);
    }
    create(actor, dto) {
        return this.classes.create(actor, dto).then(envelope_1.ok);
    }
    previewTransfer(actor, dto) {
        return this.classes.previewTransfer(actor, dto).then(envelope_1.ok);
    }
    commitTransfer(actor, dto) {
        return this.classes.commitTransfer(actor, dto).then(envelope_1.ok);
    }
    exportTransfer(actor, organizationId) {
        return this.classes.exportTransfer(actor, organizationId).then(envelope_1.ok);
    }
    options(actor, id) {
        return this.classes.options(actor, id).then(envelope_1.ok);
    }
    update(actor, id, dto) {
        return this.classes.update(actor, id, dto).then(envelope_1.ok);
    }
    books(actor, id, dto) {
        return this.classes.setBooks(actor, id, dto).then(envelope_1.ok);
    }
    enrollments(actor, id, dto) {
        return this.classes.setEnrollments(actor, id, dto).then(envelope_1.ok);
    }
    remove(actor, id) {
        return this.classes.remove(actor, id).then(envelope_1.ok);
    }
};
exports.ClassesController = ClassesController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("classes"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "list", null);
__decorate([
    openapi.ApiQuery({ name: "studentId", required: false }),
    (0, common_1.Get)("classes/assigned"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "assigned", null);
__decorate([
    (0, common_1.Post)("classes"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, classes_dto_1.SaveEducationClassDto]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("classes/transfer/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, classes_dto_1.ClassTransferDto]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "previewTransfer", null);
__decorate([
    (0, common_1.Post)("classes/transfer/commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, classes_dto_1.ClassTransferDto]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "commitTransfer", null);
__decorate([
    (0, common_1.Get)("classes/transfer/export"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "exportTransfer", null);
__decorate([
    (0, common_1.Get)("classes/:id/options"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "options", null);
__decorate([
    (0, common_1.Patch)("classes/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, classes_dto_1.UpdateEducationClassDto]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)("classes/:id/books"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, classes_dto_1.SetClassBooksDto]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "books", null);
__decorate([
    (0, common_1.Put)("classes/:id/enrollments"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.roster.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, classes_dto_1.SetClassEnrollmentsDto]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "enrollments", null);
__decorate([
    (0, common_1.Delete)("classes/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassesController.prototype, "remove", null);
exports.ClassesController = ClassesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [classes_service_1.ClassesService])
], ClassesController);
//# sourceMappingURL=classes.controller.js.map