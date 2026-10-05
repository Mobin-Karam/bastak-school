import { describe, expect, it } from "vitest";
import {
  filterAndSortConversations,
  parseConversationFilter,
  parseConversationSort,
  resolveActiveConversation,
} from "./chat-view-state";

describe("chat inbox view state", () => {
  it("accepts only supported URL filter and sort values", () => {
    expect(parseConversationFilter("favorites")).toBe("favorites");
    expect(parseConversationFilter("unknown")).toBe("all");
    expect(parseConversationSort("name")).toBe("name");
    expect(parseConversationSort("unknown")).toBe("recent");
  });

  it("filters drafts and puts unread conversations first", () => {
    const items = [
      { id: "read", unread: 0, lastMessage: { createdAt: "2026-01-03T10:00:00Z" } },
      { id: "unread", unread: 2, lastMessage: { createdAt: "2026-01-01T10:00:00Z" } },
      { id: "draft", unread: 0 },
    ];
    expect(
      filterAndSortConversations({
        items,
        filter: "drafts",
        sort: "recent",
        favorites: new Set(),
        drafts: { draft: "پیام ناتمام" },
      }).map((item) => item.id),
    ).toEqual(["draft"]);
    expect(
      filterAndSortConversations({
        items,
        filter: "all",
        sort: "unread",
        favorites: new Set(),
        drafts: {},
      }).map((item) => item.id),
    ).toEqual(["unread", "read", "draft"]);
  });

  it("prefers a selected conversation before the inbox fallback", () => {
    const items = [
      { id: "first" },
      { id: "requested", student: { id: "student-1", name: "دانش‌آموز" } },
    ];
    expect(
      resolveActiveConversation({
        items,
        conversationId: "requested",
        requestedConversationId: undefined,
        requestedStudentId: undefined,
        selectedConversation: null,
      })?.id,
    ).toBe("requested");
    expect(
      resolveActiveConversation({
        items,
        conversationId: undefined,
        requestedConversationId: undefined,
        requestedStudentId: undefined,
        selectedConversation: null,
      })?.id,
    ).toBe("first");
  });
});
