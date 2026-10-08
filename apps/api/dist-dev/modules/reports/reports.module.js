"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const daily_report_entity_1 = require("../../database/entities/daily-report.entity");
const recovery_request_entity_1 = require("../../database/entities/recovery-request.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const reports_controller_1 = require("./reports.controller");
const reports_service_1 = require("./reports.service");
const authorization_module_1 = require("../authorization/authorization.module");
const user_entity_1 = require("../../database/entities/user.entity");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([daily_report_entity_1.DailyReport, recovery_request_entity_1.RecoveryRequest, student_entity_1.Student, user_entity_1.User]), authorization_module_1.AuthorizationModule],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map