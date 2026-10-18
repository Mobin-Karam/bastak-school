import type { Conversation } from "../../../shared/types/domain";
import type { ConversationFilter, ConversationSort } from "./chat.types";

const conversationFilters: ConversationFilter[] = [
  "all",
  "unread",
  "direct",
  "group",
  "favorites",
  "drafts",
  "online",
];
const conversationSorts: ConversationSort[] = ["recent", "unread", "online", "name"];

export function parseConversationFilter(value: string | null): ConversationFilter {
  return conversationFilters.includes(value as ConversationFilter)
    ? (value as ConversationFilter)
    : "all";
}

export function parseConversationSort(value: string | null): ConversationSort {
  return conversationSorts.includes(value as ConversationSort)
    ? (value as ConversationSort)
    : "recent";
}

export function filterAndSortConversations({
  items,
  filter,
  sort,
  favorites,
  drafts,
}: {
  items: Conversation[];
  filter: ConversationFilter;
  sort: ConversationSort;
  favorites: Set<string>;
  drafts: Record<string, string>;
}) {
  return items
    .filter((item) => {
      if (filter === "all") return true;
      if (filter === "unread") return !!item.unread;
      if (filter === "favorites") return favorites.has(item.id);
      if (filter === "drafts") return !!drafts[item.id]?.trim();
      if (filter === "online") return !!item.presence?.online;
      return item.type === filter;
    })
    .sort((a, b) => {
      if (sort === "unread")
        return Number(!!b.unread) - Number(!!a.unread) || activity(b) - activity(a);
      if (sort === "online")
        return (
          Number(!!b.presence?.online) - Number(!!a.presence?.online) || activity(b) - activity(a)
        );
      if (sort === "name") return conversationName(a).localeCompare(conversationName(b), "fa");
      return activity(b) - activity(a);
    });
}

export function resolveActiveConversation({
  items,
  conversationId,
  requestedConversationId,
  requestedStudentId,
  selectedConversation,
}: {
  items: Conversation[];
  conversationId?: string;
  requestedConversationId?: string;
  requestedStudentId?: string;
  selectedConversation: Conversation | null;
}) {
  return (
    items.find((item) => item.id === conversationId) ??
    items.find((item) => item.id === requestedConversationId) ??
    items.find((item) => String(item.student?.id || "") === requestedStudentId) ??
    (selectedConversation?.id === conversationId ? selectedConversation : undefined) ??
    items[0]
  );
}

function activity(item: Conversation) {
  return item.lastMessage?.createdAt ? new Date(item.lastMessage.createdAt).getTime() : 0;
}

function conversationName(item: Conversation) {
  return item.type === "group" ? item.title || "" : item.student?.name || "";
}
