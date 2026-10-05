// src/pages/student/chat/lib/chat-messages.ts
import type { ChatMessage } from "../model/types";

export function mergeMessages(first: ChatMessage[], second: ChatMessage[]) {
  return [
    ...new Map(
      [...first, ...second].map((message) => [message.id, message]),
    ).values(),
  ].sort(
    (a, b) =>
      new Date(a.createdAt || 0).getTime() -
      new Date(b.createdAt || 0).getTime(),
  );
}

export function isMine(message: ChatMessage) {
  return String(message.senderRole).toLowerCase() === "student";
}

export function dayKey(value?: string) {
  return value ? new Date(value).toDateString() : "";
}

export function minutesBetween(first?: string, second?: string) {
  return (
    Math.abs(new Date(second || 0).getTime() - new Date(first || 0).getTime()) /
    60_000
  );
}
