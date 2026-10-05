// src/pages/student/chat/hooks/useChatThread.ts
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type UIEvent,
} from "react";
import { CHAT_LAST_READ_KEY, PAGE_SIZE } from "../lib/constants";
import { isMine, mergeMessages } from "../lib/chat-messages";
import type { ChatMessage, ChatStatus, Conversation } from "../model/types";
import { apiClient } from "../../../services/api-client";

interface ThreadOptions {
  onDraftClear(): void;
  onDraftRestore(value: string): void;
}

export interface SendMessageInput {
  text: string;
  replyTo?: ChatMessage | null;
  linkedTask?: { id: string; title: string } | null;
}

export interface ChatThread {
  messages: ChatMessage[];
  status: ChatStatus;
  hasOlder: boolean;
  loadingOlder: boolean;
  unreadCount: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  nearBottom: boolean;
  pendingBelow: number;
  open(conversation: Conversation, background?: boolean): Promise<void>;
  reset(): void;
  loadOlder(): Promise<void>;
  sendMessage(input: SendMessageInput): Promise<void>;
  removeMessage(message: ChatMessage): Promise<void>;
  reactWith(message: ChatMessage, emoji: string): Promise<void>;
  markRead(): void;
  jumpToBottom(): void;
  handleScroll(event: UIEvent<HTMLDivElement>): void;
}

export function useChatThread(
  conversation: Conversation | null,
  options: ThreadOptions,
): ChatThread {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("loading");
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(() =>
    localStorage.getItem(CHAT_LAST_READ_KEY),
  );
  const [nearBottom, setNearBottom] = useState(true);
  const [pendingBelow, setPendingBelow] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldStickRef = useRef(true);
  const loadingHistoryRef = useRef(false);
  const previousCountRef = useRef(0);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const conversationId = conversation?.id ?? null;
  const readOnly = Boolean(conversation?.readOnly);

  /* ------------------------------------------------------------ loading */

  const open = useCallback(
    async (nextConversation: Conversation, background = false) => {
      if (!background) {
        setMessages([]);
        setStatus("loading");
      }
      try {
        const next = await apiClient.request<ChatMessage[]>(
          "GET",
          `/chat/conversations/${encodeURIComponent(nextConversation.id)}/messages?limit=${PAGE_SIZE}`,
        );
        setMessages((current) =>
          background ? mergeMessages(current, next) : next,
        );
        setHasOlder(next.length === PAGE_SIZE);
        setStatus("ready");
      } catch {
        if (!background) setStatus("error");
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("loading");
    setHasOlder(false);
    setLoadingOlder(false);
    setPendingBelow(0);
    setNearBottom(true);
    shouldStickRef.current = true;
    previousCountRef.current = 0;
  }, []);

  const loadOlder = useCallback(async () => {
    const first = messages[0];
    if (!conversationId || !first?.createdAt || loadingOlder || !hasOlder) {
      return;
    }
    const node = scrollRef.current;
    const oldHeight = node?.scrollHeight || 0;
    loadingHistoryRef.current = true;
    setLoadingOlder(true);
    try {
      const older = await apiClient.request<ChatMessage[]>(
        "GET",
        `/chat/conversations/${encodeURIComponent(conversationId)}/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(first.createdAt)}`,
      );
      setMessages((current) => mergeMessages(older, current));
      setHasOlder(older.length === PAGE_SIZE);
      requestAnimationFrame(() => {
        if (node) node.scrollTop += node.scrollHeight - oldHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasOlder, loadingOlder, messages]);

  /* ------------------------------------------------------------ writing */

  const sendMessage = useCallback(
    async ({ text, replyTo, linkedTask }: SendMessageInput) => {
      const value = text.trim();
      if (!value || !conversationId) return;

      const temporaryId = `pending-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: temporaryId,
        text: value,
        senderRole: "student",
        createdAt: new Date().toISOString(),
        replyToId: replyTo?.id,
        linkedTask: linkedTask
          ? { id: linkedTask.id, title: linkedTask.title }
          : null,
      };

      shouldStickRef.current = true;
      setMessages((current) => [...current, optimistic]);
      optionsRef.current.onDraftClear();
      setStatus("sending");

      try {
        const message = await apiClient.request<
          ChatMessage,
          { text: string; replyToId?: string; taskId?: string }
        >(
          "POST",
          `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
          {
            text: value,
            replyToId: optimistic.replyToId || undefined,
            taskId: linkedTask?.id || undefined,
          },
        );
        setMessages((current) =>
          current.map((item) => (item.id === temporaryId ? message : item)),
        );
        setStatus("ready");
      } catch {
        setMessages((current) =>
          current.filter((item) => item.id !== temporaryId),
        );
        optionsRef.current.onDraftRestore(value);
        setStatus("error");
      }
    },
    [conversationId],
  );

  const removeMessage = useCallback(
    async (message: ChatMessage) => {
      if (
        !conversationId ||
        !isMine(message) ||
        message.id.startsWith("pending-")
      ) {
        return;
      }
      await apiClient.request(
        "DELETE",
        `/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(message.id)}`,
      );
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, text: "", deletedAt: new Date().toISOString() }
            : item,
        ),
      );
    },
    [conversationId],
  );

  const reactWith = useCallback(
    async (message: ChatMessage, emoji: string) => {
      if (!conversationId) return;
      await apiClient.request(
        "POST",
        `/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(message.id)}/reactions`,
        { emoji },
      );
    },
    [conversationId],
  );

  /* --------------------------------------------------------------- read */

  const markRead = useCallback(() => {
    const latest =
      messagesRef.current[messagesRef.current.length - 1]?.createdAt;
    if (!latest) return;
    localStorage.setItem(CHAT_LAST_READ_KEY, latest);
    setLastReadAt(latest);
    setPendingBelow(0);
    if (conversationId && !readOnly) {
      void apiClient
        .request(
          "POST",
          `/chat/conversations/${encodeURIComponent(conversationId)}/read`,
        )
        .catch(() => undefined);
    }
  }, [conversationId, readOnly]);

  /* ------------------------------------------------------------- scroll */

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const node = event.currentTarget;
      const close = node.scrollHeight - node.scrollTop - node.clientHeight < 96;
      setNearBottom(close);
      if (close) markRead();
    },
    [markRead],
  );

  const jumpToBottom = useCallback(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    setNearBottom(true);
    markRead();
  }, [markRead]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const added = Math.max(0, messages.length - previousCountRef.current);
    if (loadingHistoryRef.current) {
      loadingHistoryRef.current = false;
    } else if (shouldStickRef.current || nearBottom) {
      node.scrollTop = node.scrollHeight;
      setPendingBelow(0);
    } else if (added) {
      setPendingBelow((count) => count + added);
    }
    previousCountRef.current = messages.length;
    shouldStickRef.current = false;
  }, [messages.length, nearBottom]);

  /* ------------------------------------------------------------ derived */

  const unreadCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          !isMine(message) &&
          (!lastReadAt ||
            new Date(message.createdAt || 0) > new Date(lastReadAt)),
      ).length,
    [messages, lastReadAt],
  );

  return {
    messages,
    status,
    hasOlder,
    loadingOlder,
    unreadCount,
    scrollRef,
    nearBottom,
    pendingBelow,
    open,
    reset,
    loadOlder,
    sendMessage,
    removeMessage,
    reactWith,
    markRead,
    jumpToBottom,
    handleScroll,
  };
}
