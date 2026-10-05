// src/pages/student/chat/components/MessageBubble.tsx
import { CheckCheck, Copy, CornerUpLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatTime } from "../lib/chat-format";
import { isMine } from "../lib/chat-messages";
import type { ChatMessage } from "../model/types";

interface MessageBubbleProps {
  message: ChatMessage;
  grouped: boolean;
  referenced?: ChatMessage;
  active: boolean;
  actionsOpen: boolean;
  allowedEmojis: string[];
  onToggleActions(): void;
  onReply(): void;
  onJump(): void;
  onDelete(): void;
  onReact(emoji: string): void;
}

export function MessageBubble({
  message,
  grouped,
  referenced,
  active,
  actionsOpen,
  allowedEmojis,
  onToggleActions,
  onReply,
  onJump,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const mine = isMine(message);

  return (
    <article
      id={`chat-message-${message.id}`}
      className={`student-message ${mine ? "is-mine" : "is-theirs"} ${grouped ? "is-grouped" : ""} ${active ? "is-active" : ""}`}
      onContextMenu={(event) => {
        event.preventDefault();
        onToggleActions();
      }}
    >
      {message.linkedTask ? (
        <Link
          className="student-message__task"
          to={`/plan?task=${encodeURIComponent(message.linkedTask.id)}`}
        >
          <small>فعالیت برنامه</small>
          <strong>
            {[message.linkedTask.subject, message.linkedTask.title]
              .filter(Boolean)
              .join(" · ")}
          </strong>
          {message.linkedTask.startTime ? (
            <span dir="ltr">
              {message.linkedTask.startTime} — {message.linkedTask.endTime}
            </span>
          ) : null}
        </Link>
      ) : null}

      <button
        type="button"
        className="student-message__bubble"
        onClick={onToggleActions}
        aria-label={`${mine ? "پیام شما" : `پیام ${message.senderName || "مشاور"}`}: ${message.deletedAt ? "حذف شده" : message.text}`}
      >
        {!grouped && !mine ? (
          <strong className="student-message__sender">
            {message.senderName || "مشاور"}
          </strong>
        ) : null}

        {referenced ? (
          <span
            className="student-message__reply"
            onClick={(event) => {
              event.stopPropagation();
              onJump();
            }}
          >
            <small>
              {referenced.senderName || (isMine(referenced) ? "شما" : "مشاور")}
            </small>
            <b>{referenced.text || "پیام حذف شده"}</b>
          </span>
        ) : null}

        <span className="student-message__text">
          {message.deletedAt ? "این پیام حذف شده است." : message.text}
        </span>

        <small className="student-message__meta" dir="ltr">
          {message.editedAt ? "ویرایش · " : ""}
          {formatTime(message.createdAt)}
          {mine ? <CheckCheck /> : null}
        </small>
      </button>

      {actionsOpen && !message.deletedAt ? (
        <div className="student-message__actions">
          <div
            className="student-message__emoji-picker"
            aria-label="انتخاب واکنش"
          >
            {allowedEmojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => onReact(emoji)}
                aria-label={`واکنش ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button type="button" onClick={onReply}>
            <CornerUpLeft />
            پاسخ
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(message.text)}
          >
            <Copy />
            کپی
          </button>
          {mine ? (
            <button type="button" className="is-danger" onClick={onDelete}>
              <Trash2 />
              حذف
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}