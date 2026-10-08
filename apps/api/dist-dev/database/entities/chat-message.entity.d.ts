import { User } from "./user.entity";
import { Conversation } from "./conversation.entity";
import { Task } from "./task.entity";
export declare enum ChatMessageType {
    TEXT = "TEXT",
    PLAN = "PLAN",
    EXAM = "EXAM",
    TASK = "TASK",
    MOTIVATION = "MOTIVATION",
    WARNING = "WARNING"
}
export declare class ChatMessage {
    id: string;
    sender: User;
    receiverId: string;
    conversation?: Conversation | null;
    type: ChatMessageType;
    content: string;
    mentions: string[];
    replyTo?: ChatMessage | null;
    linkedTask?: Task | null;
    editedAt?: Date | null;
    deletedAt?: Date | null;
    readAt?: Date | null;
    createdAt: Date;
}
