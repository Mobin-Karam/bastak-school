"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const organization_entity_1 = require("../../database/entities/organization.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const plan_template_entity_1 = require("../../database/entities/plan-template.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const authorization_module_1 = require("../authorization/authorization.module");
const plans_module_1 = require("../plans/plans.module");
const plan_templates_controller_1 = require("./plan-templates.controller");
const plan_templates_service_1 = require("./plan-templates.service");
let PlanTemplatesModule = class PlanTemplatesModule {
};
exports.PlanTemplatesModule = PlanTemplatesModule;
exports.PlanTemplatesModule = PlanTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([plan_template_entity_1.PlanTemplate, organization_entity_1.Organization, plan_entity_1.Plan, student_entity_1.Student]),
            authorization_module_1.AuthorizationModule,
            plans_module_1.PlansModule,
        ],
        controllers: [plan_templates_controller_1.PlanTemplatesController],
        providers: [plan_templates_service_1.PlanTemplatesService],
    })
], PlanTemplatesModule);
//# sourceMappingURL=plan-templates.module.js.map