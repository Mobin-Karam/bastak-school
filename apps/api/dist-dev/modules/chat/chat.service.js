"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const chat_message_entity_1 = require("../../database/entities/chat-message.entity");
const chat_configuration_entity_1 = require("../../database/entities/chat-configuration.entity");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const conversation_member_entity_1 = require("../../database/entities/conversation-member.entity");
const message_reaction_entity_1 = require("../../database/entities/message-reaction.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const conversation_member_entity_2 = require("../../database/entities/conversation-member.entity");
const conversation_entity_2 = require("../../database/entities/conversation.entity");
const organization_membership_entity_2 = require("../../database/entities/organization-membership.entity");
const user_relationship_entity_2 = require("../../database/entities/user-relationship.entity");
const realtime_1 = require("../realtime");
const notifications_1 = require("../notifications");
let ChatService = class ChatService {
    messages;
    students;
    users;
    realtime;
    conversationsRepo;
    members;
    reactions;
    configurationRepo;
    relationships;
    orgMembers;
    roleAssignments;
    db;
    notifications;
    constructor(messages, students, users, realtime, conversationsRepo, members, reactions, configurationRepo, relationships, orgMembers, roleAssignments, db, notifications) {
        this.messages = messages;
        this.students = students;
        this.users = users;
        this.realtime = realtime;
        this.conversationsRepo = conversationsRepo;
        this.members = members;
        this.reactions = reactions;
        this.configurationRepo = configurationRepo;
        this.relationships = relationships;
        this.orgMembers = orgMembers;
        this.roleAssignments = roleAssignments;
        this.db = db;
        this.notifications = notifications;
    }
    defaultEmojis = ["❤️", "👍", "😂", "👏", "😮", "😢", "🔥", "🎉", "🙏", "✅"];
    async configuration() {
        const saved = await this.configurationRepo.findOneBy({ id: "platform" });
        return { allowedEmojis: saved?.allowedEmojis?.length ? saved.allowedEmojis : this.defaultEmojis };
    }
    async updateConfiguration(user, emojis) {
        if (!(user.roles || [user.role]).includes("PLATFORM_ADMIN"))
            throw new api_exception_1.ApiException(403, "PLATFORM_ADMIN_REQUIRED", "فقط مدیر پلتفرم می‌تواند واکنش‌ها را تغییر دهد.");
        const allowedEmojis = this.normalizeEmojis(emojis);
        let configuration = await this.configurationRepo.findOneBy({ id: "platform" });
        configuration = this.configurationRepo.create({ ...configuration, id: "platform", allowedEmojis });
        await this.configurationRepo.save(configuration);
        return { allowedEmojis };
    }
    async profile(actor, userId) {
        if (actor.id !== userId && !(await this.directAllowed(actor.id, userId)) && !(await this.shareConversation(actor.id, userId)))
            throw new api_exception_1.ApiException(404, "PROFILE_NOT_FOUND", "پروفایل گفتگو پیدا نشد.");
        const user = await this.users.findOne({ where: { id: userId }, relations: { student: true } });
        if (!user)
            throw new api_exception_1.ApiException(404, "PROFILE_NOT_FOUND", "پروفایل گفتگو پیدا نشد.");
        return this.publicProfile(user, actor.id === userId);
    }
    async updateProfile(actor, input) {
        const user = await this.users.findOne({ where: { id: actor.id }, relations: { student: true } });
        if (!user)
            throw new api_exception_1.ApiException(404, "PROFILE_NOT_FOUND", "پروفایل گفتگو پیدا نشد.");
        if (input.displayName !== undefined)
            user.chatDisplayName = this.cleanText(input.displayName, 100);
        if (input.bio !== undefined)
            user.chatBio = this.cleanText(input.bio, 500);
        if (input.avatarUrl !== undefined) {
            const avatarUrl = this.cleanText(input.avatarUrl, 1200);
            if (avatarUrl && !/^https:\/\//i.test(avatarUrl))
                throw new api_exception_1.ApiException(400, "INVALID_AVATAR_URL", "نشانی تصویر باید امن و با https باشد.");
            user.chatAvatarUrl = avatarUrl;
        }
        if (input.username !== undefined)
            await this.changeUsername(user, input.username);
        await this.users.save(user);
        return this.publicProfile(user, true);
    }
    async allowUsernameChange(actor, userId) {
        if (!(actor.roles || [actor.role]).includes("PLATFORM_ADMIN"))
            throw new api_exception_1.ApiException(403, "PLATFORM_ADMIN_REQUIRED", "فقط مدیر پلتفرم می‌تواند محدودیت نام کاربری را بردارد.");
        const user = await this.users.findOneBy({ id: userId });
        if (!user)
            throw new api_exception_1.ApiException(404, "PROFILE_NOT_FOUND", "پروفایل گفتگو پیدا نشد.");
        user.usernameChangedAt = null;
        await this.users.save(user);
        return { userId, usernameChangeAllowed: true };
    }
    async conversations(user) {
        await this.ensureAccessibleStudentConversations(user);
        const ownMemberships = await this.members.find({
            where: {
                user: { id: user.id },
                leftAt: (0, typeorm_2.IsNull)(),
                conversation: { archivedAt: (0, typeorm_2.IsNull)() },
            },
            relations: {
                conversation: { members: { user: { student: true } }, owner: true, organization: true },
            },
        });
        const observedByConversation = new Map();
        const observedMemberships = await this.guardianObservedMemberships(user, observedByConversation);
        const memberships = [...new Map([...ownMemberships, ...observedMemberships].map((item) => [item.conversation.id, item])).values()];
        const studentAccounts = [
            ...new Map(memberships
                .flatMap((item) => item.conversation.members || [])
                .map((item) => item.user)
                .filter((account) => account.id !== user.id && account.student)
                .map((account) => [account.id, account])).values(),
        ];
        const studentIds = studentAccounts.map((account) => account.student.id);
        const [organizationMemberships, advisorRelationships] = await Promise.all([
            studentAccounts.length
                ? this.orgMembers.find({
                    where: {
                        user: { id: (0, typeorm_2.In)(studentAccounts.map((account) => account.id)) },
                        status: organization_membership_entity_2.MembershipStatus.ACTIVE,
                    },
                    relations: { user: true, organization: true },
                })
                : [],
            studentIds.length
                ? this.relationships.find({
                    where: {
                        toStudent: { id: (0, typeorm_2.In)(studentIds) },
                        type: user_relationship_entity_2.RelationshipType.ADVISOR_OF,
                        status: user_relationship_entity_2.RelationshipStatus.ACTIVE,
                    },
                    relations: {
                        fromUser: true,
                        toStudent: true,
                        organization: true,
                    },
                })
                : [],
        ]);
        const profiles = new Map();
        for (const membership of organizationMemberships) {
            const profile = profiles.get(membership.user.id) || emptyStudentProfile();
            profile.organizations.push({
                id: membership.organization.id,
                name: membership.organization.name,
            });
            profiles.set(membership.user.id, profile);
        }
        for (const relationship of advisorRelationships) {
            const account = studentAccounts.find((item) => item.student?.id === relationship.toStudent.id);
            if (!account)
                continue;
            const profile = profiles.get(account.id) || emptyStudentProfile();
            profile.advisors.push({
                id: relationship.fromUser.id,
                name: [relationship.fromUser.firstName, relationship.fromUser.lastName]
                    .filter(Boolean)
                    .join(" ") || relationship.fromUser.username,
                organizationId: relationship.organization?.id || null,
            });
            profiles.set(account.id, profile);
        }
        const out = [];
        for (const member of memberships) {
            const last = await this.messages.findOne({
                where: { conversation: { id: member.conversation.id } },
                relations: { sender: true },
                order: { createdAt: "DESC" },
            });
            const unread = await this.messages
                .createQueryBuilder("m")
                .where("m.conversationId=:id AND m.senderId<>:userId AND m.readAt IS NULL AND m.deletedAt IS NULL", { id: member.conversation.id, userId: user.id })
                .getCount();
            out.push({
                ...this.publicConversation(member.conversation, user.id, profiles),
                lastMessage: last ? this.publicMessage(last) : null,
                unread,
                muted: member.muted,
                role: member.role.toLowerCase(),
                readOnly: observedByConversation.has(member.conversation.id),
                observedStudent: observedByConversation.get(member.conversation.id) || null,
            });
        }
        return out;
    }
    conversationsForStudent(user) {
        return this.conversations(user);
    }
    async createDirect(user, peerUserId, scopeVerified = false) {
        if (peerUserId === user.id)
            throw new api_exception_1.ApiException(400, "INVALID_PEER", "گفتگو با خودتان ممکن نیست.");
        const peer = await this.users.findOneByOrFail({ id: peerUserId });
        if (!scopeVerified && !(await this.directAllowed(user.id, peerUserId)))
            throw new api_exception_1.ApiException(403, "CHAT_POLICY_DENIED", "این ارتباط برای گفتگوی مستقیم مجاز نیست.");
        const mine = await this.members.find({
            where: { user: { id: user.id }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { conversation: { members: { user: true } } },
        });
        const existing = mine.find((m) => m.conversation.type === conversation_entity_2.ConversationType.DIRECT &&
            m.conversation.members.some((x) => x.user.id === peerUserId));
        if (existing)
            return this.publicConversation(existing.conversation, user.id);
        return this.db.transaction(async (manager) => {
            const conversation = await manager.save(conversation_entity_1.Conversation, manager.create(conversation_entity_1.Conversation, {
                type: conversation_entity_2.ConversationType.DIRECT,
                title: "",
                owner: await manager.findOneByOrFail(user_entity_1.User, { id: user.id }),
            }));
            await manager.save(conversation_member_entity_1.ConversationMember, [
                manager.create(conversation_member_entity_1.ConversationMember, {
                    conversation,
                    user: await manager.findOneByOrFail(user_entity_1.User, { id: user.id }),
                }),
                manager.create(conversation_member_entity_1.ConversationMember, { conversation, user: peer }),
            ]);
            return this.publicConversation({
                ...conversation,
                members: await manager.find(conversation_member_entity_1.ConversationMember, {
                    where: { conversation: { id: conversation.id } },
                    relations: { user: { student: true } },
                }),
            }, user.id);
        });
    }
    async createGroup(user, title, userIds, description = "") {
        const ids = [...new Set([user.id, ...userIds])];
        if (!title.trim() || ids.length < 2)
            throw new api_exception_1.ApiException(400, "INVALID_GROUP", "عنوان و حداقل دو عضو لازم است.");
        for (const id of ids)
            if (id !== user.id && !(await this.directAllowed(user.id, id)))
                throw new api_exception_1.ApiException(403, "CHAT_POLICY_DENIED", "یکی از اعضا برای گفتگو مجاز نیست.");
        return this.db.transaction(async (manager) => {
            const owner = await manager.findOneByOrFail(user_entity_1.User, { id: user.id });
            const users = await manager.findBy(user_entity_1.User, { id: (0, typeorm_2.In)(ids) });
            if (users.length !== ids.length)
                throw new api_exception_1.ApiException(404, "USER_NOT_FOUND", "کاربر پیدا نشد.");
            const conversation = await manager.save(conversation_entity_1.Conversation, manager.create(conversation_entity_1.Conversation, {
                type: conversation_entity_2.ConversationType.GROUP,
                title: title.trim(),
                description: description.trim().slice(0, 1000),
                permissions: this.defaultPermissions(),
                owner,
            }));
            await manager.save(conversation_member_entity_1.ConversationMember, users.map((x) => manager.create(conversation_member_entity_1.ConversationMember, {
                conversation,
                user: x,
                role: x.id === user.id
                    ? conversation_member_entity_2.ConversationMemberRole.OWNER
                    : conversation_member_entity_2.ConversationMemberRole.MEMBER,
            })));
            return { id: conversation.id, type: "group", title: conversation.title };
        });
    }
    async messagesForConversation(user, id, options = {}) {
        await this.requireViewer(user, id);
        if (!options.limit && !options.before) {
            const rows = await this.messages.find({
                where: { conversation: { id } },
                relations: { sender: true, replyTo: true, linkedTask: true },
                order: { createdAt: "ASC" },
            });
            return rows.map((x) => this.publicMessage(x));
        }
        const limit = Number.isFinite(options.limit) ? Math.min(Math.max(options.limit || 40, 1), 100) : 40;
        const query = this.messages.createQueryBuilder("message")
            .leftJoinAndSelect("message.sender", "sender")
            .leftJoinAndSelect("message.replyTo", "replyTo")
            .leftJoinAndSelect("message.linkedTask", "linkedTask")
            .where("message.conversationId=:id", { id });
        if (options.before) {
            const before = new Date(options.before);
            if (Number.isNaN(before.getTime()))
                throw new api_exception_1.ApiException(400, "INVALID_CURSOR", "نشانگر پیام نامعتبر است.");
            query.andWhere("message.createdAt < :before", { before });
        }
        const rows = await query.orderBy("message.createdAt", "DESC").take(limit + 1).getMany();
        return rows.slice(0, limit).reverse().map((x) => this.publicMessage(x));
    }
    async detail(user, id) {
        const viewer = await this.requireViewer(user, id);
        const member = viewer.member;
        const conversation = member.conversation;
        const active = (conversation.members || []).filter((x) => !x.leftAt);
        return {
            ...this.publicConversation(conversation, user.id),
            description: conversation.description || "",
            memberCount: active.length,
            myRole: member.role.toLowerCase(),
            muted: member.muted,
            readOnly: viewer.readOnly,
            observedStudent: viewer.observedStudent,
            permissions: {
                ...this.defaultPermissions(),
                ...(conversation.permissions || {}),
            },
            owner: conversation.owner
                ? this.publicUser(conversation.owner)
                : undefined,
        };
    }
    async listMembers(user, id, search = "") {
        await this.requireMember(user.id, id);
        const rows = await this.members.find({
            where: { conversation: { id }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { user: true },
            order: { joinedAt: "ASC" },
        });
        const query = search.trim().toLowerCase();
        return rows
            .filter((x) => !query || this.userSearch(x.user).includes(query))
            .map((x) => ({
            ...this.publicUser(x.user),
            role: x.role.toLowerCase(),
            joinedAt: x.joinedAt,
            muted: x.muted,
        }));
    }
    async candidateUsers(user, id, search = "") {
        await this.requireMember(user.id, id);
        const existing = new Set((await this.members.find({
            where: { conversation: { id }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { user: true },
        })).map((x) => x.user.id));
        const query = search.trim().toLowerCase();
        if (query.length < 2)
            return [];
        const rows = await this.users.find({ take: 100 });
        const out = [];
        for (const candidate of rows) {
            if (existing.has(candidate.id) ||
                !this.userSearch(candidate).includes(query))
                continue;
            if (await this.directAllowed(user.id, candidate.id))
                out.push(this.publicUser(candidate));
            if (out.length >= 15)
                break;
        }
        return out;
    }
    async availableUsers(user, search = "") {
        const query = search.trim().toLowerCase();
        if (query.length < 2)
            return [];
        const rows = await this.users.find({ take: 100 });
        const out = [];
        for (const candidate of rows) {
            if (candidate.id === user.id ||
                !this.userSearch(candidate).includes(query))
                continue;
            if (await this.directAllowed(user.id, candidate.id))
                out.push(this.publicUser(candidate));
            if (out.length >= 15)
                break;
        }
        return out;
    }
    async addMember(user, id, targetUserId) {
        await this.requireManager(user.id, id);
        if (!(await this.directAllowed(user.id, targetUserId)))
            throw new api_exception_1.ApiException(403, "CHAT_POLICY_DENIED", "این کاربر قابل افزودن نیست.");
        const conversation = await this.conversationsRepo.findOneByOrFail({ id });
        const account = await this.users.findOneByOrFail({ id: targetUserId });
        let member = await this.members.findOne({
            where: { conversation: { id }, user: { id: targetUserId } },
            relations: { conversation: true, user: true },
        });
        if (member) {
            member.leftAt = null;
            member.role = conversation_member_entity_2.ConversationMemberRole.MEMBER;
        }
        else
            member = this.members.create({
                conversation,
                user: account,
                role: conversation_member_entity_2.ConversationMemberRole.MEMBER,
            });
        await this.members.save(member);
        return this.publicUser(account);
    }
    async updateGroup(user, id, body) {
        const member = await this.requireManager(user.id, id);
        if (member.conversation.type !== conversation_entity_2.ConversationType.GROUP)
            throw new api_exception_1.ApiException(409, "NOT_GROUP", "این گفتگو گروه نیست.");
        if (typeof body.title === "string") {
            const title = body.title.trim();
            if (!title)
                throw new api_exception_1.ApiException(400, "TITLE_REQUIRED", "عنوان گروه الزامی است.");
            member.conversation.title = title;
        }
        if (typeof body.description === "string")
            member.conversation.description = body.description.trim().slice(0, 1000);
        if (body.archived === true)
            member.conversation.archivedAt = new Date();
        await this.conversationsRepo.save(member.conversation);
        return this.detail(user, id);
    }
    async updatePermissions(user, id, permissions) {
        const member = await this.requireManager(user.id, id, true);
        member.conversation.permissions = {
            ...this.defaultPermissions(),
            ...Object.fromEntries(Object.entries(permissions).map(([key, value]) => [key, !!value])),
        };
        await this.conversationsRepo.save(member.conversation);
        return member.conversation.permissions;
    }
    async send(user, id, text, input = {}) {
        const membership = await this.requireMember(user.id, id);
        const content = String(text || "").trim();
        if (!content)
            throw new api_exception_1.ApiException(400, "MESSAGE_REQUIRED", "متن پیام الزامی است.");
        const conversation = membership.conversation;
        const sender = await this.users.findOneByOrFail({ id: user.id });
        const active = await this.members.find({
            where: { conversation: { id }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { user: true },
        });
        const allowedIds = new Set(active.map((x) => x.user.id));
        const mentions = [...new Set(input.mentions || [])].filter((x) => allowedIds.has(x));
        const replyTo = input.replyToId
            ? await this.messages.findOne({
                where: { id: input.replyToId, conversation: { id } },
            })
            : null;
        if (input.replyToId && !replyTo)
            throw new api_exception_1.ApiException(404, "REPLY_NOT_FOUND", "پیام مرجع پیدا نشد.");
        const linkedTask = input.taskId
            ? await this.findAccessibleLinkedTask(user.id, id, input.taskId)
            : null;
        const saved = await this.messages.save(this.messages.create({
            conversation,
            sender,
            receiverId: "",
            type: linkedTask ? chat_message_entity_1.ChatMessageType.TASK : input.type || chat_message_entity_1.ChatMessageType.TEXT,
            content,
            mentions,
            replyTo,
            linkedTask,
        }));
        const message = this.publicMessage({ ...saved, sender, replyTo });
        const recipientIds = active
            .filter((x) => x.user.id !== user.id)
            .map((x) => x.user.id);
        this.realtime.emitToUsers(active.map((x) => x.user.id), "chat.message.created", { conversationId: id, message });
        if (this.notifications)
            await this.notifications.createForUsers(recipientIds, {
                type: "chat",
                category: "messages",
                title: conversation.title || "پیام جدید",
                body: content.slice(0, 240),
                url: `/communication/chat?conversationId=${encodeURIComponent(id)}`,
                data: { conversationId: id, messageId: saved.id },
                dedupeKey: `chat:${saved.id}`,
            });
        return message;
    }
    async markRead(user, id) {
        const viewer = await this.requireViewer(user, id);
        if (viewer.readOnly)
            return { conversationId: id, updated: 0, unread: 0, readOnly: true };
        const member = viewer.member;
        const now = new Date();
        member.lastReadAt = now;
        await this.members.save(member);
        const result = await this.messages
            .createQueryBuilder()
            .update(chat_message_entity_1.ChatMessage)
            .set({ readAt: now })
            .where("conversationId=:id AND senderId<>:userId AND readAt IS NULL", {
            id,
            userId: user.id,
        })
            .execute();
        return { conversationId: id, updated: result.affected || 0, unread: 0 };
    }
    async edit(user, id, messageId, text) {
        await this.requireMember(user.id, id);
        const message = await this.messages.findOne({
            where: { id: messageId, conversation: { id }, sender: { id: user.id } },
            relations: { sender: true },
        });
        if (!message || message.deletedAt)
            throw new api_exception_1.ApiException(404, "MESSAGE_NOT_FOUND", "پیام پیدا نشد.");
        message.content = String(text || "").trim();
        if (!message.content)
            throw new api_exception_1.ApiException(400, "MESSAGE_REQUIRED", "متن پیام الزامی است.");
        message.editedAt = new Date();
        return this.messages.save(message).then((x) => this.publicMessage(x));
    }
    async removeMessage(user, id, messageId, moderate = false) {
        const member = await this.requireMember(user.id, id);
        const message = await this.messages.findOne({
            where: { id: messageId, conversation: { id } },
            relations: { sender: true },
        });
        if (!message)
            throw new api_exception_1.ApiException(404, "MESSAGE_NOT_FOUND", "پیام پیدا نشد.");
        if (message.sender.id !== user.id &&
            !(moderate &&
                [conversation_member_entity_2.ConversationMemberRole.OWNER, conversation_member_entity_2.ConversationMemberRole.ADMIN].includes(member.role)))
            throw new api_exception_1.ApiException(403, "MESSAGE_FORBIDDEN", "اجازه حذف پیام را ندارید.");
        message.deletedAt = new Date();
        message.content = "";
        await this.messages.save(message);
        return { id: messageId, deleted: true };
    }
    async react(user, id, messageId, emoji) {
        await this.requireMember(user.id, id);
        const normalizedEmoji = String(emoji || "").trim();
        const { allowedEmojis } = await this.configuration();
        if (!allowedEmojis.includes(normalizedEmoji))
            throw new api_exception_1.ApiException(400, "REACTION_NOT_ALLOWED", "این واکنش توسط مدیر پلتفرم فعال نشده است.");
        const message = await this.messages.findOne({
            where: { id: messageId, conversation: { id } },
        });
        if (!message)
            throw new api_exception_1.ApiException(404, "MESSAGE_NOT_FOUND", "پیام پیدا نشد.");
        const account = await this.users.findOneByOrFail({ id: user.id });
        const existing = await this.reactions.findOne({
            where: { message: { id: messageId }, user: { id: user.id }, emoji: normalizedEmoji },
        });
        if (existing) {
            await this.reactions.delete(existing.id);
            return { active: false };
        }
        await this.reactions.save(this.reactions.create({
            message,
            user: account,
            emoji: normalizedEmoji,
        }));
        return { active: true };
    }
    async setMute(user, id, muted) {
        const member = await this.requireMember(user.id, id);
        member.muted = muted;
        await this.members.save(member);
        return { id, muted };
    }
    async leave(user, id) {
        const member = await this.requireMember(user.id, id);
        if (member.role === conversation_member_entity_2.ConversationMemberRole.OWNER)
            throw new api_exception_1.ApiException(409, "TRANSFER_OWNER_REQUIRED", "ابتدا مالکیت گروه را منتقل کنید.");
        member.leftAt = new Date();
        await this.members.save(member);
        return { id, left: true };
    }
    async transferOwner(user, id, targetUserId) {
        const member = await this.requireManager(user.id, id, true);
        const target = await this.members.findOne({
            where: {
                conversation: { id },
                user: { id: targetUserId },
                leftAt: (0, typeorm_2.IsNull)(),
            },
            relations: { conversation: true, user: true },
        });
        if (!target)
            throw new api_exception_1.ApiException(404, "MEMBER_NOT_FOUND", "عضو پیدا نشد.");
        member.role = conversation_member_entity_2.ConversationMemberRole.ADMIN;
        target.role = conversation_member_entity_2.ConversationMemberRole.OWNER;
        member.conversation.owner = target.user;
        await this.db.transaction(async (m) => {
            await m.save(conversation_entity_1.Conversation, member.conversation);
            await m.save(conversation_member_entity_1.ConversationMember, [member, target]);
        });
        return { id, ownerId: targetUserId };
    }
    async updateMember(user, id, targetUserId, body) {
        await this.requireManager(user.id, id);
        const target = await this.members.findOne({
            where: {
                conversation: { id },
                user: { id: targetUserId },
                leftAt: (0, typeorm_2.IsNull)(),
            },
            relations: { conversation: true, user: true },
        });
        if (!target || target.role === conversation_member_entity_2.ConversationMemberRole.OWNER)
            throw new api_exception_1.ApiException(409, "MEMBER_FORBIDDEN", "عضو قابل تغییر نیست.");
        if (body.remove)
            target.leftAt = new Date();
        else if (body.role)
            target.role = body.role;
        await this.members.save(target);
        return {
            id,
            userId: targetUserId,
            role: target.role,
            removed: !!body.remove,
        };
    }
    async requireMember(userId, id) {
        const member = await this.members.findOne({
            where: { conversation: { id }, user: { id: userId }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { conversation: { members: { user: true }, organization: true }, user: true },
        });
        if (!member)
            throw new api_exception_1.ApiException(404, "CONVERSATION_NOT_FOUND", "گفتگو پیدا نشد.");
        return member;
    }
    async requireViewer(user, id) {
        const member = await this.members.findOne({
            where: { conversation: { id }, user: { id: user.id }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { conversation: { members: { user: { student: true } }, owner: true, organization: true }, user: true },
        });
        if (member)
            return { member, readOnly: false, observedStudent: null };
        if (!(user.roles || [user.role]).includes("GUARDIAN"))
            throw new api_exception_1.ApiException(404, "CONVERSATION_NOT_FOUND", "گفتگو پیدا نشد.");
        const conversation = await this.conversationsRepo.findOne({
            where: { id, archivedAt: (0, typeorm_2.IsNull)() },
            relations: { members: { user: { student: true } }, owner: true, organization: true },
        });
        if (!conversation)
            throw new api_exception_1.ApiException(404, "CONVERSATION_NOT_FOUND", "گفتگو پیدا نشد.");
        for (const participant of conversation.members.filter((item) => !item.leftAt)) {
            const student = participant.user.student;
            if (!student?.guardianChatReadOnly)
                continue;
            const allowed = await this.relationships.exist({ where: { fromUser: { id: user.id }, toStudent: { id: student.id }, type: user_relationship_entity_2.RelationshipType.GUARDIAN_OF, status: user_relationship_entity_2.RelationshipStatus.ACTIVE } });
            if (allowed)
                return { member: participant, readOnly: true, observedStudent: { id: student.id, name: student.name } };
        }
        throw new api_exception_1.ApiException(404, "CONVERSATION_NOT_FOUND", "گفتگو پیدا نشد.");
    }
    async guardianObservedMemberships(user, observed) {
        if (!(user.roles || [user.role]).includes("GUARDIAN"))
            return [];
        const relations = await this.relationships.find({
            where: { fromUser: { id: user.id }, type: user_relationship_entity_2.RelationshipType.GUARDIAN_OF, status: user_relationship_entity_2.RelationshipStatus.ACTIVE },
            relations: { toStudent: { user: true } },
        });
        const visible = relations.map((item) => item.toStudent).filter((student) => student.guardianChatReadOnly && student.user);
        if (!visible.length)
            return [];
        const rows = await this.members.find({
            where: { user: { id: (0, typeorm_2.In)(visible.map((student) => student.user.id)) }, leftAt: (0, typeorm_2.IsNull)(), conversation: { archivedAt: (0, typeorm_2.IsNull)() } },
            relations: { conversation: { members: { user: { student: true } }, owner: true, organization: true }, user: { student: true } },
        });
        for (const row of rows) {
            const student = visible.find((item) => item.user?.id === row.user.id);
            if (student)
                observed.set(row.conversation.id, { id: student.id, name: student.name });
        }
        return rows;
    }
    async requireManager(userId, id, ownerOnly = false) {
        const m = await this.requireMember(userId, id);
        if (ownerOnly
            ? m.role !== conversation_member_entity_2.ConversationMemberRole.OWNER
            : ![
                conversation_member_entity_2.ConversationMemberRole.OWNER,
                conversation_member_entity_2.ConversationMemberRole.ADMIN,
            ].includes(m.role))
            throw new api_exception_1.ApiException(403, "GROUP_FORBIDDEN", "اجازه مدیریت گروه را ندارید.");
        return m;
    }
    async ensureAccessibleStudentConversations(user) {
        const roles = user.roles || [user.role];
        let students = [];
        if (roles.includes("PLATFORM_ADMIN") || user.role === "ADMIN") {
            students = await this.students.find({
                where: { accountStatus: "active" },
                relations: { user: true },
            });
        }
        else if (roles.includes("ORGANIZATION_ADMIN") &&
            user.organizationIds?.length) {
            const memberships = await this.orgMembers.find({
                where: {
                    organization: { id: (0, typeorm_2.In)(user.organizationIds) },
                    status: organization_membership_entity_2.MembershipStatus.ACTIVE,
                },
                relations: { user: { student: true } },
            });
            students = memberships
                .map((item) => item.user.student)
                .filter((student) => !!student && student.accountStatus === "active");
        }
        else {
            const relationships = await this.relationships.find({
                where: {
                    fromUser: { id: user.id },
                    status: user_relationship_entity_2.RelationshipStatus.ACTIVE,
                },
                relations: { toStudent: { user: true } },
            });
            students = relationships
                .map((item) => item.toStudent)
                .filter((student) => student.accountStatus === "active");
        }
        const unique = [
            ...new Map(students
                .filter((student) => student.user)
                .map((student) => [student.id, student])).values(),
        ];
        for (const student of unique)
            await this.createDirect(user, student.user.id, true);
    }
    async directAllowed(a, b) {
        const [ua, ub] = await Promise.all([
            this.users.findOne({ where: { id: a }, relations: { student: true } }),
            this.users.findOne({ where: { id: b }, relations: { student: true } }),
        ]);
        if (!ua || !ub)
            return false;
        if (ua.student || ub.student) {
            const student = ua.student || ub.student;
            const staffId = ua.student ? b : a;
            if (await this.roleAssignments.exist({ where: { user: { id: staffId }, role: { code: "GUARDIAN" } } }))
                return true;
            return this.relationships.exist({
                where: {
                    fromUser: { id: staffId },
                    toStudent: { id: student.id },
                    status: user_relationship_entity_2.RelationshipStatus.ACTIVE,
                },
            });
        }
        const ma = await this.orgMembers.find({
            where: { user: { id: a }, status: organization_membership_entity_2.MembershipStatus.ACTIVE },
            relations: { organization: true },
        });
        const ids = ma.map((x) => x.organization.id);
        return ids.length
            ? this.orgMembers.exist({
                where: {
                    user: { id: b },
                    organization: { id: (0, typeorm_2.In)(ids) },
                    status: organization_membership_entity_2.MembershipStatus.ACTIVE,
                },
            })
            : false;
    }
    async shareConversation(a, b) {
        const mine = await this.members.find({
            where: { user: { id: a }, leftAt: (0, typeorm_2.IsNull)() },
            relations: { conversation: { members: { user: true } } },
        });
        return mine.some((membership) => membership.conversation.members.some((member) => !member.leftAt && member.user.id === b));
    }
    publicConversation(c, userId, profiles = new Map()) {
        const participants = (c.members || [])
            .filter((x) => !x.leftAt)
            .map((x) => ({
            ...this.publicUser(x.user),
            role: x.role.toLowerCase(),
            isSelf: x.user.id === userId,
        }));
        const peer = participants.find((x) => !x.isSelf);
        return {
            id: c.id,
            type: c.type.toLowerCase(),
            title: c.title || peer?.name || "گفتگو",
            description: c.description || "",
            memberCount: participants.length,
            participants,
            peer,
            student: peer?.studentId
                ? {
                    id: peer.studentId,
                    name: peer.studentName || peer.name,
                    username: peer.username,
                    grade: peer.studentGrade,
                    major: peer.studentMajor,
                    accountStatus: peer.studentAccountStatus,
                    organizations: profiles.get(peer.id)?.organizations || [],
                    advisors: profiles.get(peer.id)?.advisors || [],
                    organization: profiles.get(peer.id)?.organizations[0] || null,
                    advisor: profiles.get(peer.id)?.advisors[0] || null,
                }
                : undefined,
            ownerId: c.owner?.id || null,
            autoManaged: !!c.autoManaged,
            organization: c.organization ? { id: c.organization.id, name: c.organization.name } : null,
        };
    }
    publicMessage(m) {
        return {
            id: m.id,
            text: m.deletedAt ? "" : m.content,
            type: m.type.toLowerCase(),
            senderRole: m.sender.role,
            senderId: m.sender.id,
            senderUserId: m.sender.id,
            senderName: [m.sender.firstName, m.sender.lastName].filter(Boolean).join(" ") ||
                m.sender.username,
            createdAt: m.createdAt,
            isRead: !!m.readAt,
            seen: !!m.readAt,
            readAt: m.readAt || null,
            editedAt: m.editedAt || null,
            deletedAt: m.deletedAt || null,
            mentions: m.mentions || [],
            mentionUserIds: m.mentions || [],
            replyToId: m.replyTo?.id || null,
            linkedTask: m.linkedTask
                ? {
                    id: m.linkedTask.id,
                    title: m.linkedTask.title,
                    subject: m.linkedTask.subject,
                    startTime: m.linkedTask.startTime,
                    endTime: m.linkedTask.endTime,
                }
                : null,
        };
    }
    async findAccessibleLinkedTask(userId, conversationId, taskId) {
        const task = await this.db.getRepository(task_entity_1.Task).findOne({
            where: { id: taskId },
            relations: { plan: { student: { user: true } } },
        });
        if (!task)
            throw new api_exception_1.ApiException(404, "TASK_NOT_FOUND", "فعالیت پیدا نشد.");
        const student = task.plan.student;
        if (!student.user)
            throw new api_exception_1.ApiException(404, "TASK_NOT_FOUND", "فعالیت پیدا نشد.");
        const canAccess = student.user.id === userId ||
            (await this.relationships.exist({
                where: {
                    fromUser: { id: userId },
                    toStudent: { id: student.id },
                    status: user_relationship_entity_2.RelationshipStatus.ACTIVE,
                },
            }));
        const studentInConversation = await this.members.exist({
            where: {
                conversation: { id: conversationId },
                user: { id: student.user.id },
                leftAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!canAccess || !studentInConversation)
            throw new api_exception_1.ApiException(404, "TASK_NOT_FOUND", "فعالیت در این گفتگو قابل اشتراک نیست.");
        return task;
    }
    publicUser(user) {
        return {
            id: user.id,
            username: user.username,
            name: user.chatDisplayName ||
                user.student?.name ||
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                user.username,
            accountRole: user.role,
            studentId: user.student?.id,
            studentName: user.student?.name,
            studentGrade: user.student?.grade,
            studentMajor: user.student?.major,
            studentAccountStatus: user.student?.accountStatus,
            displayName: user.chatDisplayName || undefined,
            bio: user.chatBio || undefined,
            avatarUrl: user.chatAvatarUrl || undefined,
        };
    }
    publicProfile(user, self) {
        const nextAllowedAt = user.usernameChangedAt && user.usernameChangeCount > 0
            ? new Date(user.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null;
        return {
            ...this.publicUser(user),
            displayName: user.chatDisplayName || user.student?.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username,
            bio: user.chatBio || "",
            avatarUrl: user.chatAvatarUrl || "",
            ...(self ? { usernameChange: { count: user.usernameChangeCount || 0, nextAllowedAt, allowed: !nextAllowedAt || nextAllowedAt.getTime() <= Date.now() } } : {}),
        };
    }
    async changeUsername(user, value) {
        const username = String(value || "").trim().toLowerCase();
        if (!/^[a-z0-9](?:[a-z0-9._]{1,30}[a-z0-9])$/.test(username))
            throw new api_exception_1.ApiException(400, "INVALID_USERNAME", "نام کاربری باید ۳ تا ۳۲ نویسه انگلیسی، عدد، نقطه یا زیرخط باشد.");
        if (username === user.username)
            return;
        if (user.usernameChangedAt && user.usernameChangeCount > 0) {
            const next = user.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000;
            if (next > Date.now())
                throw new api_exception_1.ApiException(429, "USERNAME_CHANGE_COOLDOWN", "تغییر دوباره نام کاربری پس از ۳۰ روز ممکن است.", { nextAllowedAt: new Date(next).toISOString() });
        }
        const duplicate = await this.users.findOne({ where: { username } });
        if (duplicate && duplicate.id !== user.id)
            throw new api_exception_1.ApiException(409, "USERNAME_EXISTS", "این نام کاربری قبلاً استفاده شده است.");
        user.username = username;
        user.usernameChangeCount = (user.usernameChangeCount || 0) + 1;
        user.usernameChangedAt = new Date();
    }
    cleanText(value, max) {
        return String(value || "").replace(/<[^>]*>/g, "").trim().slice(0, max);
    }
    userSearch(user) {
        return `${user.username} ${user.firstName} ${user.lastName}`.toLowerCase();
    }
    defaultPermissions() {
        return {
            members_can_send_messages: true,
            members_can_add_members: false,
            members_can_invite: false,
            members_can_react: true,
            members_can_use_mentions: true,
            members_can_share_study_state: true,
            members_can_share_exam_results: true,
            members_can_share_learning_progress: true,
            members_can_edit_own_messages: true,
            members_can_delete_own_messages: true,
            admins_can_delete_messages: true,
        };
    }
    normalizeEmojis(value) {
        if (!Array.isArray(value))
            throw new api_exception_1.ApiException(400, "INVALID_EMOJIS", "فهرست واکنش‌ها نامعتبر است.");
        const emojis = [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
        if (emojis.length < 1 || emojis.length > 10 || emojis.some((emoji) => emoji.length > 16))
            throw new api_exception_1.ApiException(400, "INVALID_EMOJIS", "بین یک تا ده ایموجی کوتاه انتخاب کنید.");
        return emojis;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(5, (0, typeorm_1.InjectRepository)(conversation_member_entity_1.ConversationMember)),
    __param(6, (0, typeorm_1.InjectRepository)(message_reaction_entity_1.MessageReaction)),
    __param(7, (0, typeorm_1.InjectRepository)(chat_configuration_entity_1.ChatConfiguration)),
    __param(8, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __param(9, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(10, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __param(12, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        realtime_1.RealtimeService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        notifications_1.NotificationsService])
], ChatService);
function emptyStudentProfile() {
    return { organizations: [], advisors: [] };
}
//# sourceMappingURL=chat.service.js.map