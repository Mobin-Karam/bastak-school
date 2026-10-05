import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatMessage } from "../../database/entities/chat-message.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { RealtimeModule } from "../realtime/realtime.module";
import { ChatConfiguration } from "../../database/entities/chat-configuration.entity";
import { Conversation } from "../../database/entities/conversation.entity";
import { ConversationMember } from "../../database/entities/conversation-member.entity";
import { MessageReaction } from "../../database/entities/message-reaction.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatMessage,
      Student,
      User,
      Conversation,
      ConversationMember,
      MessageReaction,
      ChatConfiguration,
      UserRelationship,
      OrganizationMembership,
      UserRoleAssignment,
    ]),
    RealtimeModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
