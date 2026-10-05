import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquarePlus } from "lucide-react";
import { useModal } from "../../../../shared/ui/modal";
import { notifications } from "../../../../shared/ui/notifications";
import { Button, EmptyState, Field, Input } from "../../../../shared/ui/ui";
import { chatApi } from "../../api/chat.api";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function CreateDirectButton({ onCreated }: { onCreated: (id: string) => void }) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <Button
      size="sm"
      variant="soft"
      onClick={() =>
        modal.open({
          title: copy.newDirect,
          description: copy.newDirectDescription,
          content: (
            <CreateDirectForm
              onCreated={(id) => {
                modal.close();
                onCreated(id);
              }}
            />
          ),
        })
      }
    >
      <MessageSquarePlus size={15} /> {copy.newConversation}
    </Button>
  );
}

function CreateDirectForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const [search, setSearch] = useState("");
  const users = useQuery({
    queryKey: ["chat-users", "direct", search],
    queryFn: () => chatApi.users(search),
    enabled: search.trim().length >= 2,
  });
  const create = useMutation({
    mutationFn: chatApi.createDirect,
    onSuccess: (conversation) => {
      notifications.success(copy.conversationReady);
      onCreated(conversation.id);
    },
    onError: () => notifications.error(copy.createConversationFailed),
  });
  return (
    <div className="grid gap-3">
      <Field label={copy.userNameOrUsername}>
        <Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} />
      </Field>
      {users.isLoading ? (
        <p role="status" className="text-sm text-slate-500">
          {copy.searching}
        </p>
      ) : null}
      {users.data?.length ? (
        <div className="grid max-h-64 gap-2 overflow-auto">
          {users.data.map((user) => (
            <button
              type="button"
              key={user.id}
              disabled={create.isPending}
              className="rounded-xl border p-3 text-start hover:border-brand"
              onClick={() => create.mutate(user.id)}
            >
              <strong>{user.name || user.username}</strong>
              <span className="mt-1 block text-xs text-slate-500" dir="ltr">
                @{user.username}
              </span>
            </button>
          ))}
        </div>
      ) : search.trim().length >= 2 && !users.isLoading ? (
        <EmptyState title={copy.noUserFound} />
      ) : null}
    </div>
  );
}
