import { Copy, Pencil, Reply, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function MessageContextMenu({
  onReply,
  onCopy,
  onEdit,
  onDelete,
}: {
  onReply: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <div className="flex items-center gap-0.5">
      <Action label={copy.reply} onClick={onReply}>
        <Reply size={13} />
      </Action>
      <Action label={copy.copyMessage} onClick={onCopy}>
        <Copy size={13} />
      </Action>
      {onEdit ? (
        <Action label={copy.edit} onClick={onEdit}>
          <Pencil size={13} />
        </Action>
      ) : null}
      {onDelete ? (
        <Action label={copy.delete} className="text-rose-700" onClick={onDelete}>
          <Trash2 size={13} />
        </Action>
      ) : null}
    </div>
  );
}

function Action({
  label,
  className = "",
  onClick,
  children,
}: {
  label: string;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid min-h-7 min-w-7 place-items-center rounded-md px-1 transition hover:bg-black/5 focus-visible:bg-black/5 dark:hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}
