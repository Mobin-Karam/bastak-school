// src/pages/student/chat/types.ts
export interface ChatMessage {
  id: string;
  text: string;
  senderRole: "admin" | "student" | "ADMIN" | "STUDENT";
  senderName?: string;
  createdAt?: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyToId?: string | null;
  isRead?: boolean;
  linkedTask?: {
    id: string;
    title: string;
    subject?: string;
    startTime?: string;
    endTime?: string;
  } | null;
}

export interface ConversationParticipant {
  id: string;
  username?: string;
  name?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isSelf?: boolean;
  accountRole?: string;
}

export interface Conversation {
  id: string;
  type?: "direct" | "group";
  title?: string;
  description?: string;
  unread?: number;
  muted?: boolean;
  memberCount?: number;
  participants?: ConversationParticipant[];
  peer?: ConversationParticipant;
  readOnly?: boolean;
  observedStudent?: { id: string; name: string } | null;
  autoManaged?: boolean;
  organization?: { id: string; name: string } | null;
  lastMessage?: ChatMessage | null;
}

export type ChatStatus = "loading" | "ready" | "sending" | "error";
export type InboxStatus = "loading" | "ready" | "error";