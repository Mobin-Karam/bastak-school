"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const app_config_1 = __importDefault(require("./config/app.config"));
const auth_config_1 = __importDefault(require("./config/auth.config"));
const database_config_1 = __importDefault(require("./config/database.config"));
const data_source_1 = require("./database/data-source");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const roles_guard_1 = require("./common/guards/roles.guard");
const csrf_guard_1 = require("./common/guards/csrf.guard");
const auth_session_guard_1 = require("./common/guards/auth-session.guard");
const capabilities_guard_1 = require("./common/guards/capabilities.guard");
const cmb_platform_module_1 = require("./platform/cmb-platform.module");
const students_module_1 = require("./modules/students/students.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const registration_module_1 = require("./modules/registration/registration.module");
const school_education_module_1 = require("./modules/school-education/school-education.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const workflows_module_1 = require("./modules/workflows/workflows.module");
const dormitory_module_1 = require("./modules/dormitory/dormitory.module");
const relationships_module_1 = require("./modules/relationships/relationships.module");
const student_transfer_module_1 = require("./modules/student-transfer/student-transfer.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const import_export_module_1 = require("./modules/import-export/import-export.module");
const schedule_module_1 = require("./modules/schedule/schedule.module");
const guardian_module_1 = require("./modules/guardian/guardian.module");
const school_home_module_1 = require("./modules/school-home/school-home.module");
const chat_module_1 = require("./modules/chat/chat.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, auth_config_1.default, database_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRoot(data_source_1.dataSourceOptions),
            cmb_platform_module_1.CmbPlatformModule,
            onboarding_module_1.OnboardingModule,
            students_module_1.StudentsModule,
            registration_module_1.RegistrationModule,
            import_export_module_1.ImportExportModule,
            school_education_module_1.SchoolEducationModule,
            attendance_module_1.AttendanceModule,
            workflows_module_1.WorkflowsModule,
            dormitory_module_1.DormitoryModule,
            relationships_module_1.RelationshipsModule,
            student_transfer_module_1.StudentTransferModule,
            dashboard_module_1.DashboardModule,
            schedule_module_1.ScheduleModule,
            guardian_module_1.GuardianModule,
            school_home_module_1.SchoolHomeModule,
            chat_module_1.ChatModule,
        ],
        providers: [
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
            { provide: core_1.APP_GUARD, useClass: auth_session_guard_1.AuthSessionGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_GUARD, useClass: capabilities_guard_1.CapabilitiesGuard },
            { provide: core_1.APP_GUARD, useClass: csrf_guard_1.CsrfGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map