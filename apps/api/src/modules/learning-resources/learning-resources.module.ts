import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LearningResource } from "../../database/entities/learning-resource.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { LearningResourcesController } from "./learning-resources.controller";
import { LearningResourcesService } from "./learning-resources.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningResource,
      LearningResourceAssignment,
      Student,
    ]),
    AuthorizationModule,
    RealtimeModule,
  ],
  controllers: [LearningResourcesController],
  providers: [LearningResourcesService],
})
export class LearningResourcesModule {}
