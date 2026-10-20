import { describe, expect, it } from "vitest";
import { parseConversationFilter, parseConversationSort } from "../model/chat-view-state";

describe("ChatPage URL view state", () => {
  it("accepts only supported conversation filters and sorting", () => {
    expect(parseConversationFilter("favorites")).toBe("favorites");
    expect(parseConversationFilter("unknown")).toBe("all");
    expect(parseConversationSort("name")).toBe("name");
    expect(parseConversationSort("unknown")).toBe("recent");
  });
});
