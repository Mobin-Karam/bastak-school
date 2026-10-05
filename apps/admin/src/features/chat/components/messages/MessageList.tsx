import { Check, CheckCheck } from "lucide-react";
import { useMemo } from "react";
import type { ChatMessage } from "../../../../shared/types/domain";
import { formatTime, toFa } from "../../lib/chat-formatters";
import { showDateSeparator } from "../../lib/chat-helpers";
import { canUseMessageAction } from "../../model/permissions";
import type { GroupDetail } from "../../model/group.types";
import { DateSeparator } from "./DateSeparator";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { MessageContextMenu } from "./MessageContextMenu";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

type MessageAction = (method: "post" | "delete", path: string, body?: unknown) => void;

export function MessageList({
  conversationId,
  items,
  authUserId,
  isGroup,
  group,
  activeSearchId,
  highlightedId,
  setReplyTo,
  setEditing,
  onJumpToMessage,
  act,
}: {
  conversationId: string;
  items: ChatMessage[];
  authUserId?: string;
  isGroup: boolean;
  group?: GroupDetail;
  activeSearchId?: string;
  highlightedId?: string;
  setReplyTo: (message: ChatMessage) => void;
  setEditing: (message: ChatMessage) => void;
  onJumpToMessage: (id: string) => void;
  act: MessageAction;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  return items.map((message, index) => {
    const mine = message.senderUserId
      ? message.senderUserId === authUserId
      : !isGroup && String(message.senderRole).toLowerCase() === "admin";
    const ready = !isGroup || !!group;
    const canEdit = !message.deletedAt && ready && canUseMessageAction("edit", mine, group);
    const canDelete = !message.deletedAt && ready && canUseMessageAction("delete", mine, group);
    const canReact = !message.deletedAt && ready && canUseMessageAction("react", mine, group);
    const previous = items[index - 1];
    const next = items[index + 1];
    const sameSender = (candidate?: ChatMessage) =>
      !!candidate &&
      candidate.senderUserId === message.senderUserId &&
      candidate.senderRole === message.senderRole &&
      candidate.type !== "system";
    const startsGroup = !sameSender(previous) || showDateSeparator(previous, message);
    const endsGroup = !sameSender(next) || (!!next && showDateSeparator(message, next));
    return (
      <div
        key={message.id}
        id={`message-${message.id}`}
        data-message-id={message.id}
        className={`${startsGroup ? "mt-3" : "mt-1"} scroll-mt-20 rounded-2xl transition ${activeSearchId === message.id ? "ring-2 ring-amber-400/70 ring-offset-2 dark:ring-offset-slate-950" : ""} ${highlightedId === message.id ? "animate-pulse ring-2 ring-brand/50 ring-offset-2 dark:ring-offset-slate-950" : ""}`}
        style={{ contentVisibility: "auto", containIntrinsicSize: "64px" }}
      >
        {showDateSeparator(items[index - 1], message) ? (
          <DateSeparator value={message.createdAt} />
        ) : null}
        <MessageBubble
          message={message}
          mine={mine}
          group={isGroup}
          startsGroup={startsGroup}
          endsGroup={endsGroup}
          referenced={message.replyToId ? byId.get(message.replyToId) : undefined}
          onJumpToReply={message.replyToId ? () => onJumpToMessage(message.replyToId!) : undefined}
          onReply={() => setReplyTo(message)}
          onEdit={canEdit ? () => setEditing(message) : undefined}
          onDelete={
            canDelete
              ? () => act("delete", `/chat/conversations/${conversationId}/messages/${message.id}`)
              : undefined
          }
          onReact={
            canReact
              ? (emoji) =>
                  act(
                    "post",
                    `/chat/conversations/${conversationId}/messages/${message.id}/reactions`,
                    { emoji },
                  )
              : undefined
          }
        />
      </div>
    );
  });
}

export function MessageBubble({
  message,
  mine,
  group,
  startsGroup = true,
  endsGroup = true,
  referenced,
  onJumpToReply,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  message: ChatMessage;
  mine: boolean;
  group: boolean;
  startsGroup?: boolean;
  endsGroup?: boolean;
  referenced?: ChatMessage;
  onJumpToReply?: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string, remove: boolean) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  if (message.type === "system")
    return (
      <div className="my-2 text-center">
        <span className="rounded-full bg-slate-700/75 px-3 py-1 text-xs text-white">
          {message.text}
        </span>
      </div>
    );
  const reacted = (emoji: string) =>
    !!message.reactions?.find((item) => item.emoji === emoji)?.reacted;

  async function copyMessage() {
    const text = message.text || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  return (
    <div className={`group/message flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[92%] border px-3 py-2 text-sm shadow-[0_1px_2px_rgba(24,45,39,0.08)] sm:max-w-[72%] lg:max-w-[68%] ${mine ? "chat-bubble-outgoing border-teal-200/70 rounded-2xl rounded-ee-md dark:border-teal-800" : "chat-bubble-incoming border-slate-200/80 rounded-2xl rounded-es-md"} ${!startsGroup ? (mine ? "rounded-ee-2xl" : "rounded-es-2xl") : ""} ${!endsGroup ? (mine ? "rounded-se-md" : "rounded-ss-md") : ""} ${message.pending ? "opacity-70" : ""}`}
      >
        {group && !mine && startsGroup ? (
          <strong className="mb-1 block text-xs text-violet-700 dark:text-violet-300">
            {message.senderName || copy.groupMember}
          </strong>
        ) : null}
        {message.replyToId ? (
          <button
            type="button"
            disabled={!onJumpToReply}
            onClick={onJumpToReply}
            className="mb-2 block w-full rounded-lg border-s-2 border-brand bg-black/[0.035] px-2.5 py-1.5 text-start text-xs text-slate-600 transition hover:bg-black/[0.06] disabled:cursor-default dark:bg-white/[0.045] dark:hover:bg-white/[0.08]"
          >
            ↩{" "}
            {referenced
              ? `${referenced.senderName || copy.member}: ${referenced.text || copy.structuredMessage}`
              : copy.previousMessage}
          </button>
        ) : null}
        <MessageBody message={message} language={language} />
        {message.reactions?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                type="button"
                key={reaction.emoji}
                aria-label={`${reaction.emoji} ${language === "fa" ? toFa(reaction.count) : reaction.count} ${copy.reaction.replace("{emoji}", "")}`}
                disabled={!onReact}
                className={`rounded-full border px-2 py-0.5 text-xs shadow-sm disabled:cursor-default ${reaction.reacted ? "border-brand bg-teal-50 dark:bg-teal-950" : "bg-white dark:bg-slate-900"}`}
                onClick={() => onReact?.(reaction.emoji, !!reaction.reacted)}
              >
                {reaction.emoji} {language === "fa" ? toFa(reaction.count) : reaction.count}
              </button>
            ))}
          </div>
        ) : null}
        <span
          className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400"
          dir="ltr"
        >
          {message.pending ? copy.sending : formatTime(message.createdAt)}
          {message.editedAt ? ` • ${copy.edited}` : ""}
          {mine && !message.pending ? (
            message.seen ? (
              <CheckCheck size={13} className="text-sky-600" />
            ) : (
              <Check size={13} />
            )
          ) : null}
        </span>
        {!message.pending ? (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-1 border-t border-black/5 pt-1 text-[11px] text-slate-500 opacity-100 sm:opacity-0 sm:transition sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100">
            <MessageContextMenu
              onReply={onReply}
              onCopy={() => void copyMessage()}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {onReact ? <EmojiReactionPicker reacted={reacted} onReact={onReact} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MessageBody({
  message,
  language = "fa",
}: {
  message: ChatMessage;
  language?: "fa" | "en";
}) {
  const copy = chatCopy[language];
  if (message.deletedAt) return <p className="italic text-slate-400">{copy.deletedMessage}</p>;
  const payload = message.payload || {};
  const type = String(message.type || "text").toLowerCase();
  if (!["text", "system"].includes(type)) {
    const labels: Record<string, string> = {
      study_state: language === "fa" ? "📚 وضعیت مطالعه" : "📚 Study status",
      exam_result: language === "fa" ? "📊 نتیجه آزمون" : "📊 Exam result",
      study_time: language === "fa" ? "⏱ زمان مطالعه" : "⏱ Study time",
      current_activity: language === "fa" ? "📖 فعالیت فعلی" : "📖 Current activity",
      learning_item: language === "fa" ? "🔁 مورد یادگیری" : "🔁 Learning item",
    };
    return (
      <div className="grid gap-2">
        <StructuredMessage
          type={type}
          payload={payload}
          label={labels[type] || (language === "fa" ? "اشتراک دانش‌آموز" : "Student update")}
          language={language}
        />
        {message.text ? (
          <p className="whitespace-pre-wrap break-words leading-7">{message.text}</p>
        ) : null}
      </div>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words leading-7">
      {message.text || copy.noTextMessage}
    </p>
  );
}

export function StructuredMessage({
  type,
  payload,
  label,
  language = "fa",
}: {
  type: string;
  payload: Record<string, unknown>;
  label: string;
  language?: "fa" | "en";
}) {
  const labels =
    language === "fa"
      ? {
          subject: "درس",
          result: "نتیجه",
          today: "مطالعه امروز",
          total: "مجموع مطالعه",
          tests: "تعداد تست",
          reviews: "مرورهای سررسید",
          duration: "مدت",
          minutes: "دقیقه",
        }
      : {
          subject: "Subject",
          result: "Result",
          today: "Today’s study",
          total: "Total study",
          tests: "Test count",
          reviews: "Due reviews",
          duration: "Duration",
          minutes: "minutes",
        };
  return (
    <div
      data-message-type={type}
      className="grid gap-1 rounded-lg border border-violet-200 bg-violet-50/80 p-3 text-xs text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100"
    >
      <strong>{label}</strong>
      {payload.title ? <b>{String(payload.title)}</b> : null}
      {payload.subject ? (
        <span>
          {labels.subject}: {String(payload.subject)}
        </span>
      ) : null}
      {payload.percent != null ? (
        <span>
          {labels.result}: {String(payload.percent)}%
        </span>
      ) : null}
      {payload.studyMinutes != null ? (
        <span>
          {labels.today}: {String(payload.studyMinutes)} {labels.minutes}
        </span>
      ) : null}
      {payload.totalMinutes != null ? (
        <span>
          {labels.total}: {String(payload.totalMinutes)} {labels.minutes}
        </span>
      ) : null}
      {payload.testCount != null ? (
        <span>
          {labels.tests}: {String(payload.testCount)}
        </span>
      ) : null}
      {payload.reviews != null ? (
        <span>
          {labels.reviews}: {String(payload.reviews)}
        </span>
      ) : null}
      {payload.minutes != null ? (
        <span>
          {labels.duration}: {String(payload.minutes)} {labels.minutes}
        </span>
      ) : null}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="grid gap-3">
      {["w-2/5", "me-auto w-3/5", "w-1/2", "me-auto w-2/5"].map((width, index) => (
        <div
          key={index}
          className={`chat-surface h-14 animate-pulse rounded-2xl opacity-70 ${width}`}
        />
      ))}
    </div>
  );
}
