import { ArrowDownAZ, Clock3, Star, Wifi } from "lucide-react";
import type { ConversationSort } from "../../model/chat.types";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function ConversationToolbar({
  sort,
  onSort,
}: {
  sort: ConversationSort;
  onSort: (value: ConversationSort) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const sorts: Array<[ConversationSort, string]> = [
    ["recent", copy.recent],
    ["unread", copy.unreadFirst],
    ["online", copy.onlineFirst],
    ["name", copy.name],
  ];
  return (
    <label className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-500">
      {sort === "recent" ? (
        <Clock3 size={13} />
      ) : sort === "online" ? (
        <Wifi size={13} />
      ) : sort === "name" ? (
        <ArrowDownAZ size={13} />
      ) : (
        <Star size={13} />
      )}
      <span>{copy.sort}</span>
      <select
        value={sort}
        onChange={(event) => onSort(event.target.value as ConversationSort)}
        className="ms-auto max-w-[150px] bg-transparent font-medium text-slate-700 outline-none dark:text-slate-200"
      >
        {sorts.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
