import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { Plan } from "../../database/entities/plan.entity";
import { PlanTemplate } from "../../database/entities/plan-template.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { PlansModule } from "../plans/plans.module";
import { PlanTemplatesController } from "./plan-templates.controller";
import { PlanTemplatesService } from "./plan-templates.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanTemplate, Organization, Plan, Student]),
    AuthorizationModule,
    PlansModule,
  ],
  controllers: [PlanTemplatesController],
  providers: [PlanTemplatesService],
})
export class PlanTemplatesModule {}
