import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Recommendation } from "../../database/entities/recommendation.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { AnalyticsController } from "./analytics.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Student, Recommendation, User]), AuthorizationModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
