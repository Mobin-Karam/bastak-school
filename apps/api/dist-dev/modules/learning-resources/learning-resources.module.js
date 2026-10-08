"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningResourcesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const learning_resource_entity_1 = require("../../database/entities/learning-resource.entity");
const learning_resource_assignment_entity_1 = require("../../database/entities/learning-resource-assignment.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const authorization_module_1 = require("../authorization/authorization.module");
const realtime_module_1 = require("../realtime/realtime.module");
const learning_resources_controller_1 = require("./learning-resources.controller");
const learning_resources_service_1 = require("./learning-resources.service");
let LearningResourcesModule = class LearningResourcesModule {
};
exports.LearningResourcesModule = LearningResourcesModule;
exports.LearningResourcesModule = LearningResourcesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                learning_resource_entity_1.LearningResource,
                learning_resource_assignment_entity_1.LearningResourceAssignment,
                student_entity_1.Student,
            ]),
            authorization_module_1.AuthorizationModule,
            realtime_module_1.RealtimeModule,
        ],
        controllers: [learning_resources_controller_1.LearningResourcesController],
        providers: [learning_resources_service_1.LearningResourcesService],
    })
], LearningResourcesModule);
//# sourceMappingURL=learning-resources.module.js.map