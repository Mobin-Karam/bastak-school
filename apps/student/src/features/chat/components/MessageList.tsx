// src/pages/student/chat/components/MessageList.tsx
import { ArrowDown, LoaderCircle } from "lucide-react";
import type { RefObject, UIEvent } from "react";
import { formatDate } from "../lib/chat-format";
import { dayKey, isMine, minutesBetween } from "../lib/chat-messages";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage, ChatStatus } from "../model/types";

interface MessageListProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  byId: Map<string, ChatMessage>;
  status: ChatStatus;
  search: string;
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder(): void;
  activeMessageId: string | null;
  onToggleActions(id: string | null): void;
  onReply(message: ChatMessage): void;
  onJumpToMessage(id: string): void;
  onDelete(message: ChatMessage): void;
  onReact(message: ChatMessage, emoji: string): void;
  onScroll(event: UIEvent<HTMLDivElement>): void;
  allowedEmojis: string[];
  nearBottom: boolean;
  pendingBelow: number;
  onJumpToBottom(): void;
}

export function MessageList({
  scrollRef,
  messages,
  byId,
  status,
  search,
  hasOlder,
  loadingOlder,
  onLoadOlder,
  activeMessageId,
  onToggleActions,
  onReply,
  onJumpToMessage,
  onDelete,
  onReact,
  onScroll,
  allowedEmojis,
  nearBottom,
  pendingBelow,
  onJumpToBottom,
}: MessageListProps) {
  return (
    <>
      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className="student-chat__messages"
        onScroll={onScroll}
      >
        {hasOlder ? (
          <button
            type="button"
            className="student-chat__older"
            onClick={onLoadOlder}
            disabled={loadingOlder}
          >
            {loadingOlder ? <LoaderCircle /> : null}
            {loadingOlder ? "در حال دریافت" : "پیام‌های قدیمی‌تر"}
          </button>
        ) : null}

        {status === "loading" ? (
          <div className="student-chat__state">
            <LoaderCircle />
            در حال دریافت پیام‌ها
          </div>
        ) : null}

        {status !== "loading" && !messages.length ? (
          <div className="student-chat__state">
            {search ? "نتیجه‌ای پیدا نشد." : "هنوز گفت‌وگویی وجود ندارد."}
          </div>
        ) : null}

        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showDate =
            !previous ||
            dayKey(previous.createdAt) !== dayKey(message.createdAt);
          const grouped = Boolean(
            previous &&
            isMine(previous) === isMine(message) &&
            minutesBetween(previous.createdAt, message.createdAt) < 5 &&
            !message.replyToId &&
            !showDate,
          );

          return (
            <div key={message.id}>
              {showDate ? (
                <div className="student-chat__date">
                  {formatDate(message.createdAt)}
                </div>
              ) : null}
              <MessageBubble
                message={message}
                grouped={grouped}
                referenced={
                  message.replyToId ? byId.get(message.replyToId) : undefined
                }
                active={activeMessageId === message.id}
                actionsOpen={activeMessageId === message.id}
                allowedEmojis={allowedEmojis}
                onToggleActions={() =>
                  onToggleActions(
                    activeMessageId === message.id ? null : message.id,
                  )
                }
                onReply={() => {
                  onReply(message);
                  onToggleActions(null);
                }}
                onJump={() =>
                  message.replyToId && onJumpToMessage(message.replyToId)
                }
                onDelete={() => onDelete(message)}
                onReact={(emoji) => onReact(message, emoji)}
              />
            </div>
          );
        })}
      </div>

      {!nearBottom ? (
        <button
          type="button"
          className="student-chat__jump"
          onClick={onJumpToBottom}
          aria-label={`رفتن به آخر گفتگو${pendingBelow ? `، ${pendingBelow.toLocaleString("fa-IR")} پیام جدید` : ""}`}
        >
          <ArrowDown />
          {pendingBelow ? <i>{pendingBelow.toLocaleString("fa-IR")}</i> : null}
        </button>
      ) : null}
    </>
  );
}
