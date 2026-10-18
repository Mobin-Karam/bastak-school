import { X } from "lucide-react";
import type { ChatMessage } from "../../../../shared/types/domain";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function EditPreview({ message, onClose }: { message: ChatMessage; onClose: () => void }) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <div className="mt-2 flex items-center gap-2 border-y border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <span className="min-w-0 flex-1 truncate">
        {copy.editPreview.replace("{text}", message.text || copy.noTextMessage)}
      </span>
      <button
        type="button"
        className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label={copy.cancelEdit}
        onClick={onClose}
      >
        <X size={15} />
      </button>
    </div>
  );
}
