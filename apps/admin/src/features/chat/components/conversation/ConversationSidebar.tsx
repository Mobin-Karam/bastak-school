import { RefreshCw } from "lucide-react";
import type { Conversation } from "../../../../shared/types/domain";
import { AdminList } from "../../../../shared/ui/admin-list";
import { Badge, Button } from "../../../../shared/ui/ui";
import { CreateGroupButton } from "../group/GroupChatControls";
import type { ConversationFilter, ConversationSort } from "../../model/chat.types";
import { toFa } from "../../lib/chat-formatters";
import { ConversationList } from "./ConversationList";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationToolbar } from "./ConversationToolbar";
import { CreateDirectButton } from "./CreateDirectButton";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function ConversationSidebar({
  visible,
  items,
  activeId,
  search,
  filter,
  sort,
  favoriteIds,
  drafts,
  total,
  unread,
  loading,
  error,
  fetching,
  hasMore,
  fetchingMore,
  onSearch,
  onFilter,
  onSort,
  onSelect,
  onToggleFavorite,
  onRetry,
  onMore,
  onGroupCreated,
}: {
  visible: boolean;
  items: Conversation[];
  activeId?: string;
  search: string;
  filter: ConversationFilter;
  sort: ConversationSort;
  favoriteIds: Set<string>;
  drafts: Record<string, string>;
  total: number;
  unread: number;
  loading: boolean;
  error: boolean;
  fetching: boolean;
  hasMore: boolean;
  fetchingMore: boolean;
  onSearch: (value: string) => void;
  onFilter: (value: ConversationFilter) => void;
  onSort: (value: ConversationSort) => void;
  onSelect: (item: Conversation) => void;
  onToggleFavorite: (id: string) => void;
  onRetry: () => void;
  onMore: () => void;
  onGroupCreated: (id: string) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <AdminList
      label={copy.conversations}
      description={copy.description}
      items={items}
      loading={loading}
      error={error}
      errorTitle={copy.loadFailed}
      onRetry={onRetry}
      className={`${visible ? "flex" : "hidden lg:flex"} min-h-0 flex-col overflow-hidden border-slate-200/90 p-0 shadow-[0_12px_35px_rgba(31,49,46,0.06)]`}
      contentClassName="min-h-0 flex-1 overflow-auto p-0"
      emptyTitle={search || filter !== "all" ? copy.noMatch : copy.none}
      actions={
        <>
          <Badge>{toFa(total)}</Badge>
          {unread ? (
            <Badge tone="red">
              {language === "fa" ? toFa(unread) : unread.toLocaleString("en-US")} {copy.unread}
            </Badge>
          ) : null}
          <CreateDirectButton onCreated={onGroupCreated} />
          <CreateGroupButton onCreated={onGroupCreated} />
          {fetching && !fetchingMore ? (
            <RefreshCw
              className="animate-spin text-slate-400"
              size={15}
              aria-label={copy.loading}
            />
          ) : null}
        </>
      }
      toolbar={
        <div className="grid gap-2">
          <ConversationSearch
            search={search}
            filter={filter}
            onSearch={onSearch}
            onFilter={onFilter}
          />
          <ConversationToolbar sort={sort} onSort={onSort} />
        </div>
      }
      footer={
        hasMore ? (
          <Button className="w-full" variant="soft" loading={fetchingMore} onClick={onMore}>
            {copy.more}
          </Button>
        ) : undefined
      }
    >
      <ConversationList
        items={items}
        activeId={activeId}
        favoriteIds={favoriteIds}
        drafts={drafts}
        emptyTitle=""
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    </AdminList>
  );
}
