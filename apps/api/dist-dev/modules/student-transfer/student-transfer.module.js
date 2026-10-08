"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentTransferModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_entity_1 = require("../../database/entities/student.entity");
const import_history_entity_1 = require("../../database/entities/import-history.entity");
const school_access_module_1 = require("../school-access/school-access.module");
const student_transfer_controller_1 = require("./student-transfer.controller");
const student_transfer_service_1 = require("./student-transfer.service");
let StudentTransferModule = class StudentTransferModule {
};
exports.StudentTransferModule = StudentTransferModule;
exports.StudentTransferModule = StudentTransferModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([student_entity_1.Student, import_history_entity_1.ImportHistory]),
            school_access_module_1.SchoolAccessModule,
        ],
        controllers: [student_transfer_controller_1.StudentTransferController],
        providers: [student_transfer_service_1.StudentTransferService],
    })
], StudentTransferModule);
//# sourceMappingURL=student-transfer.module.js.map