import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { Student } from "../../database/entities/student.entity";
import { SchoolAccessModule } from "../school-access/school-access.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DormitoryController } from "./dormitory.controller";
import { DormitoryService } from "./dormitory.service";

@Module({
  imports: [TypeOrmModule.forFeature([DormRoom, DormRoomAssignment, Student]), SchoolAccessModule, NotificationsModule],
  controllers: [DormitoryController],
  providers: [DormitoryService],
  exports: [DormitoryService],
})
export class DormitoryModule {}
