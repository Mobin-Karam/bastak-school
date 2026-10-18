import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { toFa } from "../../lib/chat-formatters";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function MessageSearchBar({
  value,
  count,
  index,
  onChange,
  onNext,
  onPrevious,
  onClose,
}: {
  value: string;
  count: number;
  index: number;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <div className="chat-surface flex shrink-0 items-center gap-2 border-b border-slate-200/80 px-3 py-2">
      <Search size={16} className="shrink-0 text-slate-400" />
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.searchLoadedMessages}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        aria-label={copy.searchMessages}
      />
      <span className="shrink-0 text-[11px] text-slate-400" dir="ltr">
        {count
          ? language === "fa"
            ? `${toFa(index + 1)} / ${toFa(count)}`
            : `${index + 1} / ${count}`
          : "0 / 0"}
      </span>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30"
        onClick={onPrevious}
        disabled={!count}
        aria-label={copy.previousResult}
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30"
        onClick={onNext}
        disabled={!count}
        aria-label={copy.nextResult}
      >
        <ChevronDown size={16} />
      </button>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-lg hover:bg-slate-100"
        onClick={onClose}
        aria-label={copy.closeSearch}
      >
        <X size={16} />
      </button>
    </div>
  );
}
