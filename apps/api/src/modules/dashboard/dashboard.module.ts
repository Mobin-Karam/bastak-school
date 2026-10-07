import { Module } from "@nestjs/common";
import { LegacyDashboardController } from "./dashboard.controller";
import { DashboardHomeController } from "./dashboard-home.controller";
import { DashboardHomeService } from "./dashboard-home.service";
import { LegacyDashboardService } from "./dashboard.service";
import { ScheduleModule } from "../schedule/schedule.module";
import { SchoolHomeModule } from "../school-home/school-home.module";

@Module({
  imports: [ScheduleModule, SchoolHomeModule],
  controllers: [DashboardHomeController, LegacyDashboardController],
  providers: [DashboardHomeService, LegacyDashboardService],
})
export class DashboardModule {}
