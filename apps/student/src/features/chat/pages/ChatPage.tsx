// src/pages/student/ChatPage.tsx
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { CHAT_DRAFT_KEY, DEFAULT_EMOJIS } from "../lib/constants";
import { useConversations } from "../hooks/useConversations";
import { useChatThread } from "../hooks/useChatThread";
import { ChatInbox } from "../components/ChatInbox";
import { ChatHeader } from "../components/ChatHeader";
import { PeerProfileDialog } from "../components/PeerProfileDialog";
import { MessageSearchBar } from "../components/MessageSearchBar";
import { MessageList } from "../components/MessageList";
import { ChatComposer } from "../components/ChatComposer";
import type { ChatMessage, Conversation, ConversationParticipant } from "../model/types";
import { apiClient } from "../../../services/api-client";

export function ChatPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const linkedTaskId = searchParams.get("task");
  const linkedTaskTitle = searchParams.get("title") || "فعالیت برنامه";

  const [text, setText] = useState(
    () => localStorage.getItem(CHAT_DRAFT_KEY) || "",
  );
  const [online, setOnline] = useState(navigator.onLine);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allowedEmojis, setAllowedEmojis] = useState<string[]>(DEFAULT_EMOJIS);
  const [profile, setProfile] = useState<ConversationParticipant | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const conversationRef = useRef<Conversation | null>(null);
  conversationRef.current = conversation;

  const {
    conversations,
    inboxStatus,
    inboxSearch,
    setInboxSearch,
    visibleConversations,
    loadConversations,
  } = useConversations();

  const thread = useChatThread(conversation, {
    onDraftClear: () => {
      setText("");
      localStorage.removeItem(CHAT_DRAFT_KEY);
    },
    onDraftRestore: (value) => {
      setText(value);
      localStorage.setItem(CHAT_DRAFT_KEY, value);
    },
  });

  /* ---------------------------------------------------------------- data */

  useEffect(() => {
    void loadConversations();
    void apiClient
      .request<{ allowedEmojis: string[] }>("GET", "/chat/configuration")
      .then((value) => {
        if (Array.isArray(value.allowedEmojis) && value.allowedEmojis.length)
          setAllowedEmojis(value.allowedEmojis.slice(0, 10));
      })
      .catch(() => undefined);

    const refresh = () => {
      void loadConversations(true);
      const current = conversationRef.current;
      if (current) void thread.open(current, true);
    };

    const timer = window.setInterval(refresh, 15_000);
    const realtime = (event: Event) => {
      const type = (event as CustomEvent<{ type?: string }>).detail?.type;
      if (type?.startsWith("chat.")) refresh();
    };
    const setOnlineState = () => setOnline(navigator.onLine);

    window.addEventListener("moshaver:v2-event", realtime);
    window.addEventListener("online", setOnlineState);
    window.addEventListener("offline", setOnlineState);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("moshaver:v2-event", realtime);
      window.removeEventListener("online", setOnlineState);
      window.removeEventListener("offline", setOnlineState);
    };
  }, [conversation?.id, loadConversations, thread.open]);

  useEffect(() => {
    localStorage.setItem(CHAT_DRAFT_KEY, text);
  }, [text]);

  /* ------------------------------------------------------------- actions */

  async function openConversation(
    nextConversation: Conversation,
    background = false,
  ) {
    if (!background) setConversation(nextConversation);
    await thread.open(nextConversation, background);
  }

  function closeConversation() {
    setConversation(null);
    thread.reset();
    setReplyTo(null);
    setActiveMessageId(null);
    setSearchOpen(false);
    setSearch("");
    void loadConversations(true);
  }

  async function openPeerProfile() {
    const peer = conversation?.peer;
    if (!peer?.id) return;
    setProfile(peer);
    setProfileOpen(true);
    try {
      setProfile(
        await apiClient.request<ConversationParticipant>(
          "GET",
          `/chat/profiles/${encodeURIComponent(peer.id)}`,
        ),
      );
    } catch {
      /* The summary from the authorized conversation remains available. */
    }
  }

  function jumpToMessage(id: string) {
    document
      .getElementById(`chat-message-${id}`)
      ?.scrollIntoView({ block: "center" });
    setActiveMessageId(id);
    window.setTimeout(() => setActiveMessageId(null), 1400);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
    if (event.key === "Escape") setReplyTo(null);
  }

  async function submitMessage() {
    const reply = replyTo;
    setReplyTo(null);
    await thread.sendMessage({
      text,
      replyTo: reply,
      linkedTask: linkedTaskId
        ? { id: linkedTaskId, title: linkedTaskTitle }
        : null,
    });
  }

  /* -------------------------------------------------------------- derived */

  const visibleMessages = useMemo(
    () =>
      search.trim()
        ? thread.messages.filter((message) =>
            message.text.toLowerCase().includes(search.trim().toLowerCase()),
          )
        : thread.messages,
    [thread.messages, search],
  );

  const byId = useMemo(
    () => new Map(thread.messages.map((message) => [message.id, message])),
    [thread.messages],
  );

  /* --------------------------------------------------------------- render */

  if (!conversation) {
    return (
      <ChatInbox
        conversations={conversations}
        visibleConversations={visibleConversations}
        status={inboxStatus}
        search={inboxSearch}
        onSearchChange={setInboxSearch}
        onOpen={(item) => void openConversation(item)}
        onReload={() => void loadConversations()}
        linkedTaskId={linkedTaskId}
        linkedTaskTitle={linkedTaskTitle}
      />
    );
  }

  return (
    <section
      className="student-chat"
      aria-label={`گفت‌وگو با ${conversation.title || "کاربر"}`}
    >
      <ChatHeader
        conversation={conversation}
        status={thread.status}
        online={online}
        unreadCount={thread.unreadCount}
        searchOpen={searchOpen}
        onBack={closeConversation}
        onOpenProfile={() => void openPeerProfile()}
        onToggleSearch={() => setSearchOpen((value) => !value)}
      />

      {profileOpen && profile ? (
        <PeerProfileDialog
          profile={profile}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}

      {conversation.readOnly ? (
        <div className="student-chat__readonly">
          <ShieldCheck />
          گفتگوی {conversation.observedStudent?.name || "دانش‌آموز"} را فقط
          مشاهده می‌کنید.
        </div>
      ) : null}

      {searchOpen ? (
        <MessageSearchBar
          value={search}
          onChange={setSearch}
          onClose={() => {
            setSearch("");
            setSearchOpen(false);
          }}
        />
      ) : null}

      <MessageList
        scrollRef={thread.scrollRef}
        messages={visibleMessages}
        byId={byId}
        status={thread.status}
        search={search}
        hasOlder={thread.hasOlder}
        loadingOlder={thread.loadingOlder}
        onLoadOlder={() => void thread.loadOlder()}
        activeMessageId={activeMessageId}
        onToggleActions={setActiveMessageId}
        onReply={setReplyTo}
        onJumpToMessage={jumpToMessage}
        onDelete={(message) => void thread.removeMessage(message)}
        onReact={(message, emoji) => void thread.reactWith(message, emoji)}
        onScroll={thread.handleScroll}
        allowedEmojis={allowedEmojis}
        nearBottom={thread.nearBottom}
        pendingBelow={thread.pendingBelow}
        onJumpToBottom={thread.jumpToBottom}
      />

      {!conversation.readOnly ? (
        <ChatComposer
          text={text}
          onTextChange={setText}
          onKeyDown={handleComposerKeyDown}
          onSubmit={() => void submitMessage()}
          sending={thread.status === "sending"}
          failed={thread.status === "error"}
          onRetry={() => void openConversation(conversation)}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          linkedTaskId={linkedTaskId}
          linkedTaskTitle={linkedTaskTitle}
        />
      ) : null}
    </section>
  );
}