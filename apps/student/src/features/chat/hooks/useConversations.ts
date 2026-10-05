// src/pages/student/chat/hooks/useConversations.ts
import { useCallback, useMemo, useState } from "react";
import type { Conversation, InboxStatus } from "../model/types";
import { apiClient } from "../../../services/api-client";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inboxStatus, setInboxStatus] = useState<InboxStatus>("loading");
  const [inboxSearch, setInboxSearch] = useState("");

  const loadConversations = useCallback(async (background = false) => {
    try {
      const next = await apiClient.request<Conversation[]>(
        "GET",
        "/chat/conversations",
      );
      setConversations(next);
      setInboxStatus("ready");
    } catch {
      if (!background) setInboxStatus("error");
    }
  }, []);

  const visibleConversations = useMemo(() => {
    const query = inboxSearch.trim().toLocaleLowerCase("fa");
    return conversations.filter(
      (item) =>
        !query ||
        `${item.title || ""} ${item.description || ""} ${item.peer?.username || ""}`
          .toLocaleLowerCase("fa")
          .includes(query),
    );
  }, [conversations, inboxSearch]);

  return {
    conversations,
    inboxStatus,
    inboxSearch,
    setInboxSearch,
    visibleConversations,
    loadConversations,
  };
}
