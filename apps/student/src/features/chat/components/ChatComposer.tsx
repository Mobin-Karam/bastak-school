// src/pages/student/chat/components/ChatComposer.tsx

import { LoaderCircle, Send, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { isMine } from "../lib/chat-messages";
import { ChatMessage } from "../model/types";

interface ChatComposerProps {
  text: string;
  onTextChange(value: string): void;
  onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void;
  onSubmit(): void;
  sending: boolean;
  failed: boolean;
  onRetry(): void;
  replyTo: ChatMessage | null;
  onCancelReply(): void;
  linkedTaskId: string | null;
  linkedTaskTitle: string;
}

export function ChatComposer({
  text,
  onTextChange,
  onKeyDown,
  onSubmit,
  sending,
  failed,
  onRetry,
  replyTo,
  onCancelReply,
  linkedTaskId,
  linkedTaskTitle,
}: ChatComposerProps) {
  return (
    <form
      className="student-chat__composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {linkedTaskId ? (
        <div className="student-chat__linked-task">
          <span>
            <small>پیوست فعالیت</small>
            <strong>{linkedTaskTitle}</strong>
          </span>
          <Link to={`/plan?task=${encodeURIComponent(linkedTaskId)}`}>
            مشاهده
          </Link>
        </div>
      ) : null}

      {replyTo ? (
        <div className="student-chat__replying">
          <span>
            <small>
              پاسخ به{" "}
              {replyTo.senderName || (isMine(replyTo) ? "خودتان" : "مشاور")}
            </small>
            <strong>{replyTo.text}</strong>
          </span>
          <button type="button" onClick={onCancelReply} aria-label="لغو پاسخ">
            <X />
          </button>
        </div>
      ) : null}

      {failed ? (
        <button type="button" className="student-chat__retry" onClick={onRetry}>
          اتصال ناموفق بود؛ تلاش دوباره
        </button>
      ) : null}

      <textarea
        rows={1}
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="پیام..."
        aria-label="متن پیام"
      />

      <button
        type="submit"
        disabled={!text.trim() || sending}
        aria-label="ارسال پیام"
      >
        {sending ? <LoaderCircle /> : <Send />}
      </button>
    </form>
  );
}
