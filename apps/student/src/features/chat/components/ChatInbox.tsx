// src/pages/student/chat/components/ChatInbox.tsx
import {
  ChevronLeft,
  LoaderCircle,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import { formatInboxTime, initials } from "../lib/chat-format";
import type { Conversation, InboxStatus } from "../model/types";

interface ChatInboxProps {
  conversations: Conversation[];
  visibleConversations: Conversation[];
  status: InboxStatus;
  search: string;
  onSearchChange(value: string): void;
  onOpen(conversation: Conversation): void;
  onReload(): void;
  linkedTaskId: string | null;
  linkedTaskTitle: string;
}

export function ChatInbox({
  conversations,
  visibleConversations,
  status,
  search,
  onSearchChange,
  onOpen,
  onReload,
  linkedTaskId,
  linkedTaskTitle,
}: ChatInboxProps) {
  return (
    <section className="student-chat-inbox" aria-label="گفت‌وگوها">
      <header className="student-chat-inbox__header">
        <span>
          <strong>گفت‌وگوها</strong>
          <small>
            {conversations.length
              ? `${conversations.length.toLocaleString("fa-IR")} گفت‌وگوی فعال`
              : "ارتباط امن با مشاور و گروه‌ها"}
          </small>
        </span>
      </header>

      {linkedTaskId ? (
        <div className="student-chat__task-context">
          <MessageCircle />
          <span>
            <strong>انتخاب گفتگو برای این فعالیت</strong>
            <small>{linkedTaskTitle}</small>
          </span>
        </div>
      ) : null}

      <label className="student-chat-inbox__search">
        <Search />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="جست‌وجوی گفتگو یا نام کاربری"
        />
      </label>

      <div className="student-chat-inbox__list">
        {status === "loading" ? (
          <div className="student-chat__state">
            <LoaderCircle />
            در حال دریافت گفتگوها
          </div>
        ) : null}

        {status === "error" ? (
          <div className="student-chat__state">
            <button type="button" onClick={onReload}>
              دریافت گفتگوها ناموفق بود؛ تلاش دوباره
            </button>
          </div>
        ) : null}

        {status === "ready" && !visibleConversations.length ? (
          <div className="student-chat-inbox__empty">
            <MessageCircle />
            <strong>
              {search ? "گفتگویی پیدا نشد" : "هنوز گفتگویی ندارید"}
            </strong>
            <small>
              {search
                ? "عبارت دیگری را جست‌وجو کنید."
                : "پس از ایجاد ارتباط، گفتگوها و گروه‌ها اینجا نمایش داده می‌شوند."}
            </small>
          </div>
        ) : null}

        {visibleConversations.map((item) => (
          <button
            type="button"
            className="student-conversation-row"
            key={item.id}
            onClick={() => onOpen(item)}
          >
            <span
              className={`student-conversation-row__avatar ${item.type === "group" ? "is-group" : ""}`}
            >
              {item.type === "group" ? <Users /> : initials(item.title)}
            </span>
            <span className="student-conversation-row__body">
              <span>
                <strong>
                  {item.title || "گفتگو"}
                  {item.autoManaged ? <em>رسمی</em> : null}
                </strong>
                <time>
                  {item.readOnly
                    ? `فقط‌خواندنی · ${item.observedStudent?.name || "فرزند"}`
                    : formatInboxTime(item.lastMessage?.createdAt)}
                </time>
              </span>
              <span>
                <small>
                  {item.lastMessage?.deletedAt
                    ? "پیام حذف شده"
                    : item.lastMessage?.text ||
                      item.description ||
                      (item.type === "group"
                        ? `${item.memberCount || item.participants?.length || 0} عضو`
                        : `@${item.peer?.username || "کاربر"}`)}
                </small>
                {item.unread ? (
                  <i>{item.unread.toLocaleString("fa-IR")}</i>
                ) : null}
              </span>
            </span>
            <ChevronLeft />
          </button>
        ))}
      </div>
    </section>
  );
}
