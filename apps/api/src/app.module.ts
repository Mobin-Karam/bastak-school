import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import appConfig from "./config/app.config";
import authConfig from "./config/auth.config";
import databaseConfig from "./config/database.config";
import { dataSourceOptions } from "./database/data-source";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
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
import { DormitoryModule } from "./modules/dormitory/dormitory.module";
import { RelationshipsModule } from "./modules/relationships/relationships.module";
import { StudentTransferModule } from "./modules/student-transfer/student-transfer.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { StudentDocumentsModule } from "./modules/student-documents/student-documents.module";

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
    CmbPlatformModule,
    // OnboardingModule,
    StudentsModule,
    // RegistrationModule,
    SchoolEducationModule,
    AttendanceModule,
    // DormitoryModule,
    // RelationshipsModule,
    // StudentTransferModule,
    // DashboardModule,
    // StudentDocumentsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthSessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CapabilitiesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
