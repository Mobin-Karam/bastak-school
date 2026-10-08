"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chat_message_entity_1 = require("../../database/entities/chat-message.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const realtime_module_1 = require("../realtime/realtime.module");
const chat_configuration_entity_1 = require("../../database/entities/chat-configuration.entity");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const conversation_member_entity_1 = require("../../database/entities/conversation-member.entity");
const message_reaction_entity_1 = require("../../database/entities/message-reaction.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const notifications_module_1 = require("../notifications/notifications.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                chat_message_entity_1.ChatMessage,
                student_entity_1.Student,
                user_entity_1.User,
                conversation_entity_1.Conversation,
                conversation_member_entity_1.ConversationMember,
                message_reaction_entity_1.MessageReaction,
                chat_configuration_entity_1.ChatConfiguration,
                user_relationship_entity_1.UserRelationship,
                organization_membership_entity_1.OrganizationMembership,
                user_role_assignment_entity_1.UserRoleAssignment,
            ]),
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map