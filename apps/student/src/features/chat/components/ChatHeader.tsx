// src/pages/student/chat/components/ChatHeader.tsx
import { ChevronRight, Search, Users, Wifi, WifiOff } from "lucide-react";
import { initials, statusLabel } from "../lib/chat-format";
import type { ChatStatus, Conversation } from "../model/types";

interface ChatHeaderProps {
  conversation: Conversation;
  status: ChatStatus;
  online: boolean;
  unreadCount: number;
  searchOpen: boolean;
  onBack(): void;
  onOpenProfile(): void;
  onToggleSearch(): void;
}

export function ChatHeader({
  conversation,
  status,
  online,
  unreadCount,
  searchOpen,
  onBack,
  onOpenProfile,
  onToggleSearch,
}: ChatHeaderProps) {
  const isGroup = conversation.type === "group";

  return (
    <header className="student-chat__header">
      <button type="button" onClick={onBack} aria-label="بازگشت به گفتگوها">
        <ChevronRight />
      </button>

      <button
        type="button"
        className="student-chat__avatar"
        onClick={onOpenProfile}
        disabled={isGroup}
        aria-label={
          isGroup
            ? "تصویر گروه"
            : `مشاهده پروفایل ${conversation.title || "کاربر"}`
        }
      >
        {conversation.peer?.avatarUrl ? (
          <img src={conversation.peer.avatarUrl} alt="" />
        ) : isGroup ? (
          <Users />
        ) : (
          initials(conversation.title)
        )}
      </button>

      <button
        type="button"
        className="student-chat__identity"
        onClick={onOpenProfile}
        disabled={isGroup}
      >
        <strong>{conversation.title || "مشاور"}</strong>
        <small>{statusLabel(status, online)}</small>
      </button>

      {unreadCount ? <i>{unreadCount.toLocaleString("fa-IR")}</i> : null}

      <button
        type="button"
        onClick={onToggleSearch}
        aria-label="جست‌وجوی پیام"
        aria-pressed={searchOpen}
      >
        <Search />
      </button>

      <span
        className={`student-chat__connection ${online ? "is-online" : ""}`}
        title={online ? "آنلاین" : "آفلاین"}
      >
        {online ? <Wifi /> : <WifiOff />}
      </span>
    </header>
  );
}
