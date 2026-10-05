import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "../../database/entities/notification.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { NotificationPreference } from "../../database/entities/notification-preference.entity";
import { PushSubscription } from "../../database/entities/push-subscription.entity";
import { PushService } from "./push.service";
import { PushController } from "./push.controller";
import { RealtimeModule } from "../realtime/realtime.module";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Student,
      User,
      PushSubscription,
      NotificationPreference,
    ]),
    RealtimeModule,
  ],
  controllers: [NotificationsController, PushController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
