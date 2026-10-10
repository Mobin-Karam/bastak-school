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
exports.EducationCatalogController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const education_catalog_service_1 = require("./education-catalog.service");
const education_catalog_dto_1 = require("./education-catalog.dto");
let EducationCatalogController = class EducationCatalogController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    signupOptions() {
        return (0, envelope_1.ok)(this.catalog.signupOptions());
    }
    books(grade, educationTypeId, trackId) {
        return this.catalog
            .listBooks(grade ? Number(grade) : undefined, educationTypeId, trackId)
            .then(envelope_1.ok);
    }
    myBooks(user) {
        return this.catalog.booksForStudentUser(user.id).then(envelope_1.ok);
    }
    datasets() {
        return (0, envelope_1.ok)(this.catalog.datasets());
    }
    overview(user, from, to, grade) {
        return this.catalog
            .operationsOverview(user, from, to, grade ? Number(grade) : undefined)
            .then(envelope_1.ok);
    }
    managedBooks(user, schoolYear, state) {
        return this.catalog.listManaged(user, schoolYear, state).then(envelope_1.ok);
    }
    exportBooks(user) {
        return this.catalog.exportBooks(user).then(envelope_1.ok);
    }
    impact(user, id) {
        return this.catalog.bookImpact(user, id).then(envelope_1.ok);
    }
    createBook(user, dto) {
        return this.catalog.createBook(user, dto).then(envelope_1.ok);
    }
    importPreview(user, dto) {
        return this.catalog.previewImport(user, dto.books).then(envelope_1.ok);
    }
    importCommit(user, dto) {
        return this.catalog.commitImport(user, dto.books).then(envelope_1.ok);
    }
    updateBook(user, id, dto) {
        return this.catalog.updateBook(user, id, dto).then(envelope_1.ok);
    }
    publishBook(user, id) {
        return this.catalog.publishBook(user, id).then(envelope_1.ok);
    }
};
exports.EducationCatalogController = EducationCatalogController;
__decorate([
    (0, common_1.Get)("signup-options"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "signupOptions", null);
__decorate([
    openapi.ApiQuery({ name: "grade", required: false }),
    openapi.ApiQuery({ name: "educationTypeId", required: false }),
    openapi.ApiQuery({ name: "trackId", required: false }),
    (0, common_1.Get)("books"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("grade")),
    __param(1, (0, common_1.Query)("educationTypeId")),
    __param(2, (0, common_1.Query)("trackId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "books", null);
__decorate([
    (0, common_1.Get)("my-books"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.profile.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "myBooks", null);
__decorate([
    (0, common_1.Get)("datasets"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.read"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "datasets", null);
__decorate([
    openapi.ApiQuery({ name: "from", required: false }),
    openapi.ApiQuery({ name: "to", required: false }),
    openapi.ApiQuery({ name: "grade", required: false }),
    (0, common_1.Get)("admin/overview"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.operations.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __param(3, (0, common_1.Query)("grade")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "overview", null);
__decorate([
    openapi.ApiQuery({ name: "schoolYear", required: false }),
    openapi.ApiQuery({ name: "state", required: false }),
    (0, common_1.Get)("admin/books"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("schoolYear")),
    __param(2, (0, common_1.Query)("state")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "managedBooks", null);
__decorate([
    (0, common_1.Get)("admin/books/export"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "exportBooks", null);
__decorate([
    (0, common_1.Get)("admin/books/:id/impact"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "impact", null);
__decorate([
    (0, common_1.Post)("admin/books"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, education_catalog_dto_1.SaveEducationBookDto]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "createBook", null);
__decorate([
    (0, common_1.Post)("admin/books/import-preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, education_catalog_dto_1.ImportEducationBooksDto]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "importPreview", null);
__decorate([
    (0, common_1.Post)("admin/books/import-commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, education_catalog_dto_1.ImportEducationBooksDto]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "importCommit", null);
__decorate([
    (0, common_1.Patch)("admin/books/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, education_catalog_dto_1.UpdateEducationBookDto]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "updateBook", null);
__decorate([
    (0, common_1.Post)("admin/books/:id/publish"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.publish"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EducationCatalogController.prototype, "publishBook", null);
exports.EducationCatalogController = EducationCatalogController = __decorate([
    (0, common_1.Controller)("education-catalog"),
    __metadata("design:paramtypes", [education_catalog_service_1.EducationCatalogService])
], EducationCatalogController);
//# sourceMappingURL=education-catalog.controller.js.map