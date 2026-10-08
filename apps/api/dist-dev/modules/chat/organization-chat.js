"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOrganizationChat = ensureOrganizationChat;
exports.leaveOrganizationChat = leaveOrganizationChat;
const typeorm_1 = require("typeorm");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const conversation_member_entity_1 = require("../../database/entities/conversation-member.entity");
const conversation_member_entity_2 = require("../../database/entities/conversation-member.entity");
const conversation_entity_2 = require("../../database/entities/conversation.entity");
async function ensureOrganizationChat(manager, organization, member) {
    let conversation = await manager.findOne(conversation_entity_1.Conversation, { where: { organization: { id: organization.id }, autoManaged: true }, relations: { members: { user: true } } });
    if (!conversation)
        conversation = await manager.save(conversation_entity_1.Conversation, manager.create(conversation_entity_1.Conversation, {
            type: conversation_entity_2.ConversationType.GROUP,
            title: `${organization.name} · گروه سازمان`,
            description: "گروه رسمی اعضای سازمان",
            permissions: { members_can_send_messages: true, members_can_react: true, members_can_use_mentions: true },
            organization,
            autoManaged: true,
        }));
    if (member) {
        let membership = await manager.findOne(conversation_member_entity_1.ConversationMember, { where: { conversation: { id: conversation.id }, user: { id: member.id } } });
        if (membership) {
            membership.leftAt = null;
        }
        else
            membership = manager.create(conversation_member_entity_1.ConversationMember, { conversation, user: member, role: conversation_member_entity_2.ConversationMemberRole.MEMBER });
        await manager.save(conversation_member_entity_1.ConversationMember, membership);
    }
    return conversation;
}
async function leaveOrganizationChat(manager, organizationId, userId) {
    const membership = await manager.findOne(conversation_member_entity_1.ConversationMember, { where: { conversation: { organization: { id: organizationId }, autoManaged: true }, user: { id: userId }, leftAt: (0, typeorm_1.IsNull)() } });
    if (membership) {
        membership.leftAt = new Date();
        await manager.save(conversation_member_entity_1.ConversationMember, membership);
    }
}
//# sourceMappingURL=organization-chat.js.map