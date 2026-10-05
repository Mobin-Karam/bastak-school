import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircleHeart, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { chatApi } from "../../chat/api/chat.api";
import { notify } from "../../../shared/ui/notifications";
import { Button, Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { systemCopy } from "../system-locale";

const catalog = [
  "❤️",
  "👍",
  "😂",
  "👏",
  "😮",
  "😢",
  "🔥",
  "🎉",
  "🙏",
  "✅",
  "💯",
  "🤝",
  "⭐",
  "💪",
  "🤔",
  "👎",
  "😍",
  "🥳",
  "😎",
  "📚",
];

export function ChatEmojiManager() {
  const { language } = useLocale();
  const copy = systemCopy(language);
  const qc = useQueryClient();
  const configuration = useQuery({
    queryKey: ["chat-configuration"],
    queryFn: chatApi.configuration,
  });
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (configuration.data) setSelected(configuration.data.allowedEmojis);
  }, [configuration.data]);
  const save = useMutation({
    mutationFn: () => chatApi.updateConfiguration(selected),
    onSuccess: (data) => {
      qc.setQueryData(["chat-configuration"], data);
      notify(copy.emojiSaved, "success");
    },
    onError: () => notify(copy.emojiSaveFailed, "error"),
  });
  if (configuration.isError)
    return (
      <EmptyState
        title={copy.emojiConfigFailed}
        action={<Button onClick={() => void configuration.refetch()}>{copy.retry}</Button>}
      />
    );
  return (
    <Card className="grid gap-4 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <MessageCircleHeart size={20} />
        </span>
        <span>
          <strong className="block text-sm">{copy.chatEmojiTitle}</strong>
          <small className="mt-1 block text-xs text-slate-500">{copy.chatEmojiDescription}</small>
        </span>
      </header>
      <div className="flex flex-wrap gap-2" role="group" aria-label={copy.chatEmojiSelection}>
        {catalog.map((emoji) => {
          const active = selected.includes(emoji);
          return (
            <button
              type="button"
              key={emoji}
              aria-pressed={active}
              className={`grid h-11 w-11 place-items-center rounded-xl border text-xl ${active ? "border-brand bg-brand/10 ring-1 ring-brand/20" : "border-slate-200 dark:border-slate-700"}`}
              onClick={() =>
                setSelected((items) =>
                  active
                    ? items.filter((item) => item !== emoji)
                    : items.length < 10
                      ? [...items, emoji]
                      : items,
                )
              }
            >
              {emoji}
            </button>
          );
        })}
      </div>
      <footer className="flex items-center justify-between gap-3">
        <small className="text-xs text-slate-500">{copy.emojisSelected(selected.length)}</small>
        <Button disabled={!selected.length || save.isPending} onClick={() => save.mutate()}>
          <Save size={15} />
          {save.isPending ? copy.saving : copy.saveEmojis}
        </Button>
      </footer>
    </Card>
  );
}
