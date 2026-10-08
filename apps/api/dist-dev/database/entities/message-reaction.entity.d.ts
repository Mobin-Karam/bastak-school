import { ChatMessage } from "./chat-message.entity";
import { User } from "./user.entity";
export declare class MessageReaction {
    id: string;
    message: ChatMessage;
    user: User;
    emoji: string;
    createdAt: Date;
}
