"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelaxationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const relaxation_track_entity_1 = require("../../database/entities/relaxation-track.entity");
const student_daily_relaxation_entity_1 = require("../../database/entities/student-daily-relaxation.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const relaxation_controller_1 = require("./relaxation.controller");
const relaxation_service_1 = require("./relaxation.service");
let RelaxationModule = class RelaxationModule {
};
exports.RelaxationModule = RelaxationModule;
exports.RelaxationModule = RelaxationModule = __decorate([
    (0, common_1.Module)({ imports: [typeorm_1.TypeOrmModule.forFeature([relaxation_track_entity_1.RelaxationTrack, student_daily_relaxation_entity_1.StudentDailyRelaxation, student_entity_1.Student, organization_membership_entity_1.OrganizationMembership, audit_log_entity_1.AuditLog])], controllers: [relaxation_controller_1.RelaxationAdminController, relaxation_controller_1.RelaxationStudentController], providers: [relaxation_service_1.RelaxationService] })
], RelaxationModule);
//# sourceMappingURL=relaxation.module.js.map