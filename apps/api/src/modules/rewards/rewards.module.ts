import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { StudentRewardLedger } from "../../database/entities/student-reward-ledger.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { SchoolAccessModule } from "../school-access";
import { RewardsController } from "./rewards.controller";
import { RewardsService } from "./rewards.service";

@Module({
  imports: [TypeOrmModule.forFeature([StudentRewardLedger, Student, AuditLog]), SchoolAccessModule, AuthorizationModule],
  controllers: [RewardsController], providers: [RewardsService], exports: [RewardsService],
})
export class RewardsModule {}
