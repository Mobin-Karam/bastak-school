import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import appConfig from "./config/app.config";
import authConfig from "./config/auth.config";
import databaseConfig from "./config/database.config";
import { dataSourceOptions } from "./database/data-source";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RolesGuard } from "./common/guards/roles.guard";
import { CsrfGuard } from "./common/guards/csrf.guard";
import { AuthSessionGuard } from "./common/guards/auth-session.guard";
import { CapabilitiesGuard } from "./common/guards/capabilities.guard";
import { CmbPlatformModule } from "./platform/cmb-platform.module";
import { StudentsModule } from "./modules/students/students.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { RegistrationModule } from "./modules/registration/registration.module";
import { SchoolEducationModule } from "./modules/school-education/school-education.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { DormitoryModule } from "./modules/dormitory/dormitory.module";
import { RelationshipsModule } from "./modules/relationships/relationships.module";
import { StudentTransferModule } from "./modules/student-transfer/student-transfer.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ImportExportModule } from "./modules/import-export/import-export.module";
import { ScheduleModule } from "./modules/schedule/schedule.module";
import { GuardianModule } from "./modules/guardian/guardian.module";
import { SchoolHomeModule } from "./modules/school-home/school-home.module";
import { ChatModule } from "./modules/chat/chat.module";
import { SmsModule } from "./modules/sms/sms.module";
import { RewardsModule } from "./modules/rewards/rewards.module";
import { ReportsModule } from "./modules/reports/reports.module";

/**
 * School application composition root. CMB provides reusable platform
 * capabilities; modules below it are school-specific product features.
 * Legacy Moshaver modules remain in source control but are intentionally not
 * mounted here until the school MVP needs them.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    // Account foundation: platform identity/session endpoints, account bootstrap
    // and signup, then school registration completion.
    CmbPlatformModule,
    OnboardingModule,
    StudentsModule,
    RegistrationModule,
    // Existing plans/exams data-transfer endpoints; the Admin Excel adapter
    // converts workbooks to their validated API payloads.
    ImportExportModule,
    // The education bundle is the single composition point for the catalogue,
    // classes and class groups.  Do not mount ClassesModule separately here:
    // SchoolEducationModule already owns that dependency chain.
    SchoolEducationModule,
    RewardsModule,
    AttendanceModule, // حضور و غیاب
    ReportsModule, // گزارش‌های استاد دربارهٔ دانش‌آموز
    WorkflowsModule,
    DormitoryModule, // خوابگاه و ساخت و تقسیم دانش آموزان در بین آنها
    // Guardian/student links are the authority behind guardian-scoped home,
    // schedule and attendance reads.
    RelationshipsModule,
    // First school data-transfer adapter; future feature adapters follow the
    // same preview → validated transactional commit → scoped export pattern.
    StudentTransferModule,
    DashboardModule,
    ScheduleModule,
    GuardianModule,
    SchoolHomeModule,
    // Conversation/profile endpoints consumed by the Admin workspace.
    ChatModule,
    SmsModule,
    // StudentDocumentsModule deliberately stays dormant until it has a
    // Fastify-compatible upload storage adapter.  Its current Express/Multer
    // controller must not be mounted in this Fastify application.
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: AuthSessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CapabilitiesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
