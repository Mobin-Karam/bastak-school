import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bell,
  BellOff,
  Crown,
  LogOut,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useModal } from "../../../../shared/ui/modal";
import { notifications } from "../../../../shared/ui/notifications";
import { useLocale } from "../../../../shared/ui/locale";
import { Badge, Button, Field, Input, Textarea } from "../../../../shared/ui/ui";
import { api } from "../../../../shared/api/api";
import { permissionLabels } from "../../model/permissions";
import { chatCopy } from "../../model/chat-copy";
import type {
  ChatUser,
  GroupDetail,
  GroupMember,
  GroupPermissions,
  GroupRole,
} from "../../model/group.types";

function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

function localizedGroupRole(copy: Record<string, string>, role: GroupRole) {
  return role === "owner" ? copy.owner : role === "admin" ? copy.admin : copy.member;
}

function localizedPermission(copy: Record<string, string>, key: keyof GroupPermissions) {
  const keys: Record<keyof GroupPermissions, string> = {
    members_can_send_messages: "permissionSend",
    members_can_add_members: "permissionAddMembers",
    members_can_invite: "permissionInvite",
    members_can_react: "permissionReact",
    members_can_use_mentions: "permissionMentions",
    members_can_share_study_state: "permissionStudyState",
    members_can_share_exam_results: "permissionExamResults",
    members_can_share_learning_progress: "permissionLearningProgress",
    members_can_edit_own_messages: "permissionEditOwn",
    members_can_delete_own_messages: "permissionDeleteOwn",
    admins_can_delete_messages: "permissionAdminsDelete",
  };
  return copy[keys[key]];
}

export function CreateGroupButton({ onCreated }: { onCreated: (id: string) => void }) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <Button
      className="h-8 px-2 text-xs"
      variant="soft"
      onClick={() =>
        modal.open({
          title: copy.createGroup,
          description: copy.createGroupDescription,

          size: "lg",

          content: (
            <CreateGroupForm
              onCancel={modal.close}
              onCreated={(id) => {
                modal.close();

                notifications.success(copy.groupCreated, {
                  description: copy.groupReady,
                });

                onCreated(id);
              }}
              onError={(error) => {
                notifications.error(copy.createGroupFailed, {
                  description: error instanceof Error ? error.message : copy.unknownError,
                });
              }}
            />
          ),
        })
      }
    >
      <Plus size={15} /> {copy.createGroup}
    </Button>
  );
}

export function CreateGroupForm({
  onCancel,

  onCreated,

  onError,
}: {
  onCancel: () => void;

  onCreated: (id: string) => void;

  onError?: (error: unknown) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<ChatUser[]>([]);

  const deferredSearch = useDebouncedValue(search.trim(), 250);

  const users = useQuery({
    queryKey: ["chat-users", deferredSearch],

    enabled: deferredSearch.length > 1,

    queryFn: () =>
      api.get<ChatUser[]>(`/chat/users?limit=15&search=${encodeURIComponent(deferredSearch)}`),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<GroupDetail>("/chat/groups", {
        title: title.trim(),

        description: description.trim(),

        memberIds: selected.map((item) => item.id),
      }),

    onSuccess: (group) => {
      onCreated(group.id);
    },

    onError: (error) => {
      onError?.(error);
    },
  });

  return (
    <form
      className="
      grid
      gap-4
      "
      onSubmit={(event) => {
        event.preventDefault();

        if (create.isPending) return;

        create.mutate();
      }}
    >
      <Field label={copy.groupName}>
        <Input
          required
          minLength={2}
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>

      <Field label={copy.groupDescription}>
        <Textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      <Field label={copy.addInitialMembers}>
        <Input
          value={search}
          placeholder={copy.userNameOrUsername}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>

      {selected.length > 0 && (
        <div
          className="
        flex
        flex-wrap
        gap-2
        "
        >
          {selected.map((user) => (
            <button
              type="button"
              key={user.id}
              className="
              rounded-full
              bg-brand-soft
              px-3
              py-1
              text-xs
              text-brand
              "
              onClick={() => {
                setSelected((items) => items.filter((item) => item.id !== user.id));
              }}
            >
              {user.name} ×
            </button>
          ))}
        </div>
      )}

      {users.data?.length ? (
        <div
          className="
          max-h-40
          overflow-auto
          rounded-lg
          border
          "
        >
          {users.data

            .filter((user) => !selected.some((item) => item.id === user.id))

            .map((user) => (
              <button
                key={user.id}
                type="button"
                className="
                flex
                w-full
                items-center
                justify-between
                border-b
                p-3
                text-start
                text-sm
                hover:bg-slate-50
                "
                onClick={() => {
                  setSelected((items) => [...items, user]);
                }}
              >
                <span>{user.name}</span>

                <small dir="ltr">@{user.username}</small>
              </button>
            ))}
        </div>
      ) : null}

      <div
        className="
        flex
        justify-end
        gap-2
        "
      >
        <Button type="button" variant="ghost" disabled={create.isPending} onClick={onCancel}>
          {copy.cancel}
        </Button>

        <Button
          type="submit"
          loading={create.isPending}
          disabled={title.trim().length < 2 || create.isPending}
        >
          {create.isPending ? copy.sending : copy.createGroup}
        </Button>
      </div>
    </form>
  );
}

export function GroupInfoButton({
  conversationId,
  onChanged,
}: {
  conversationId: string;
  onChanged: () => void;
}) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = chatCopy[language];
  return (
    <Button
      className="h-9 px-2 text-xs"
      variant="soft"
      onClick={() =>
        modal.open({
          title: copy.groupInfo,
          size: "xl",
          content: (
            <GroupManager
              conversationId={conversationId}
              close={modal.close}
              onChanged={onChanged}
            />
          ),
        })
      }
    >
      <Users size={16} />
      <span className="hidden sm:inline">{copy.group}</span>
    </Button>
  );
}

export function GroupManager({
  conversationId,
  close,
  onChanged,
}: {
  conversationId: string;
  close: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const modal = useModal();
  const { language } = useLocale();
  const copy = chatCopy[language];
  const [candidateSearch, setCandidateSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const deferredCandidateSearch = useDebouncedValue(candidateSearch.trim(), 250);
  const deferredMemberSearch = useDebouncedValue(memberSearch.trim(), 250);
  const detail = useQuery({
    queryKey: ["chat-group", conversationId],
    queryFn: () => api.get<GroupDetail>(`/chat/conversations/${conversationId}`),
  });
  const members = useQuery({
    queryKey: ["chat-group-members", conversationId, deferredMemberSearch],
    queryFn: () =>
      api.get<GroupMember[]>(
        `/chat/groups/${conversationId}/members?limit=50${deferredMemberSearch ? `&search=${encodeURIComponent(deferredMemberSearch)}` : ""}`,
      ),
  });
  const candidates = useQuery({
    queryKey: ["chat-group-candidates", conversationId, deferredCandidateSearch],
    enabled:
      deferredCandidateSearch.length > 1 &&
      !!detail.data &&
      (detail.data.myRole !== "member" || !!detail.data.permissions.members_can_add_members),
    queryFn: () =>
      api.get<ChatUser[]>(
        `/chat/groups/${conversationId}/candidates?limit=15&search=${encodeURIComponent(deferredCandidateSearch)}`,
      ),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["chat-group", conversationId] });
    void qc.invalidateQueries({
      queryKey: ["chat-group-members", conversationId],
    });
    void qc.invalidateQueries({
      queryKey: ["chat-group-candidates", conversationId],
    });
    onChanged();
  };
  const action = useMutation({
    mutationFn: ({
      method,
      path,
      body,
    }: {
      method: "post" | "patch" | "delete";
      path: string;
      body?: unknown;
    }) => api[method](path, body),
    onSuccess: () => {
      notifications.success(copy.groupChangesSaved);
      refresh();
    },
    onError: (error) =>
      notifications.error(error instanceof Error ? error.message : copy.groupActionFailed),
  });
  if (detail.isLoading || members.isLoading)
    return <div className="h-72 animate-pulse rounded-lg bg-slate-100" />;
  if (!detail.data || detail.isError || members.isError)
    return (
      <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{copy.groupInfoFailed}</p>
    );
  const group = detail.data,
    canManage = group.myRole === "owner" || group.myRole === "admin";
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-4">
        <GroupMeta
          group={group}
          busy={action.isPending}
          save={(body) =>
            action.mutate({
              method: "patch",
              path: `/chat/groups/${conversationId}`,
              body,
            })
          }
        />
        <section>
          <div className="mb-2 flex items-center justify-between">
            <strong>{copy.members}</strong>
            <Badge tone="blue">{group.memberCount}</Badge>
          </div>
          {group.memberCount > 12 ? (
            <Input
              className="mb-2"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={copy.searchMembers}
              aria-label={copy.searchGroupMembers}
            />
          ) : null}
          <div className="max-h-72 overflow-auto rounded-md border">
            {members.data?.length ? (
              members.data.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  myRole={group.myRole}
                  busy={action.isPending}
                  changeRole={(role) =>
                    action.mutate({
                      method: "patch",
                      path: `/chat/groups/${conversationId}/members/${member.id}`,
                      body: { role },
                    })
                  }
                  remove={() =>
                    action.mutate({
                      method: "delete",
                      path: `/chat/groups/${conversationId}/members/${member.id}`,
                    })
                  }
                  transfer={() =>
                    action.mutate({
                      method: "post",
                      path: `/chat/groups/${conversationId}/transfer-owner`,
                      body: { userId: member.id },
                    })
                  }
                  confirm={modal.confirm}
                />
              ))
            ) : (
              <p className="p-3 text-center text-sm text-slate-500">{copy.noMatchingMembers}</p>
            )}
          </div>
          {group.memberCount > 50 && !memberSearch ? (
            <p className="mt-1 text-xs text-amber-700">{copy.searchForMoreMembers}</p>
          ) : null}
        </section>
        {canManage || group.permissions.members_can_add_members ? (
          <section>
            <Field label={copy.addMember}>
              <Input
                value={candidateSearch}
                onChange={(event) => setCandidateSearch(event.target.value)}
                placeholder={copy.userNameOrUsername}
              />
            </Field>
            {candidates.data?.length ? (
              <div className="mt-2 max-h-36 overflow-auto rounded-md border">
                {candidates.data.map((user) => (
                  <button
                    key={user.id}
                    className="flex w-full items-center justify-between border-b p-2 text-sm hover:bg-slate-50"
                    onClick={() =>
                      action.mutate({
                        method: "post",
                        path: `/chat/groups/${conversationId}/members`,
                        body: { userId: user.id },
                      })
                    }
                  >
                    <span>{user.name}</span>
                    <UserPlus size={15} />
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
      <aside className="grid content-start gap-3">
        {group.myRole === "owner" ? (
          <PermissionEditor
            value={group.permissions}
            busy={action.isPending}
            save={(body) =>
              action.mutate({
                method: "patch",
                path: `/chat/groups/${conversationId}/permissions`,
                body,
              })
            }
          />
        ) : null}
        <Button
          variant="soft"
          onClick={() =>
            action.mutate({
              method: "patch",
              path: `/chat/conversations/${conversationId}/mute`,
              body: { muted: !group.muted },
            })
          }
        >
          {group.muted ? <Bell size={16} /> : <BellOff size={16} />}
          {group.muted ? copy.enableNotifications : copy.muteGroup}
        </Button>
        {group.myRole === "owner" ? (
          <Button
            variant="danger"
            onClick={() =>
              void modal
                .confirm({
                  title: copy.archiveGroupConfirm,
                  description: copy.archiveGroupDescription,
                  tone: "danger",
                  confirmLabel: copy.archive,
                })
                .then((ok) => {
                  if (ok)
                    return action
                      .mutateAsync({
                        method: "patch",
                        path: `/chat/groups/${conversationId}`,
                        body: { archived: true },
                      })
                      .then(close);
                })
            }
          >
            <Archive size={16} /> {copy.archiveGroup}
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={() =>
              void modal
                .confirm({
                  title: copy.leaveGroupConfirm,
                  description: copy.leaveGroupDescription,
                  tone: "danger",
                  confirmLabel: copy.leaveGroup,
                })
                .then((ok) => {
                  if (ok)
                    return action
                      .mutateAsync({
                        method: "post",
                        path: `/chat/groups/${conversationId}/leave`,
                        body: {},
                      })
                      .then(close);
                })
            }
          >
            <LogOut size={16} /> {copy.leaveGroup}
          </Button>
        )}
      </aside>
    </div>
  );
}

export function GroupMeta({
  group,
  busy,
  save,
}: {
  group: GroupDetail;
  busy: boolean;
  save: (body: object) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const [title, setTitle] = useState(group.title),
    [description, setDescription] = useState(group.description);
  const canManage = group.myRole === "owner" || group.myRole === "admin";
  return (
    <section className="rounded-lg bg-slate-50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Shield size={18} />
        <strong>{copy.groupDetails}</strong>
        <Badge tone={group.myRole === "owner" ? "amber" : "blue"}>
          {localizedGroupRole(copy, group.myRole)}
        </Badge>
      </div>
      {canManage ? (
        <div className="grid gap-2">
          <Input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
          <Textarea
            rows={2}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button
            className="justify-self-end"
            loading={busy}
            disabled={busy || title.trim().length < 2}
            onClick={() => save({ title: title.trim(), description: description.trim() })}
          >
            <Settings size={15} /> {copy.saveDetails}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{group.description || copy.noDescription}</p>
      )}
    </section>
  );
}

export function MemberRow({
  member,
  myRole,
  busy,
  changeRole,
  remove,
  transfer,
  confirm,
}: {
  member: GroupMember;
  myRole: GroupRole;
  busy: boolean;
  changeRole: (role: GroupRole) => void;
  remove: () => void;
  transfer: () => void;
  confirm: ReturnType<typeof useModal>["confirm"];
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const manageable = myRole === "owner" || (myRole === "admin" && member.role === "member");
  return (
    <div className="flex flex-wrap items-center gap-2 border-b p-2 text-sm">
      <span className="min-w-0 flex-1">
        <strong className="block truncate">{member.name}</strong>
        <small className="text-slate-500" dir="ltr">
          @{member.username}
        </small>
      </span>
      <Badge
        tone={member.role === "owner" ? "amber" : member.role === "admin" ? "blue" : "neutral"}
      >
        {localizedGroupRole(copy, member.role)}
      </Badge>
      {myRole === "owner" && member.role !== "owner" ? (
        <>
          <button
            type="button"
            disabled={busy}
            className="text-xs text-brand"
            onClick={() => changeRole(member.role === "admin" ? "member" : "admin")}
          >
            {member.role === "admin" ? copy.becomeMember : copy.becomeAdmin}
          </button>
          <button
            type="button"
            disabled={busy}
            aria-label={interpolate(copy.transferOwnership, { name: member.name })}
            onClick={() =>
              void confirm({
                title: copy.transferOwnershipConfirm,
                description: interpolate(copy.transferOwnershipDescription, { name: member.name }),
                tone: "danger",
                confirmLabel: copy.transferOwnershipAction,
              }).then((ok) => ok && transfer())
            }
          >
            <Crown size={15} />
          </button>
        </>
      ) : null}
      {manageable && member.role !== "owner" ? (
        <button
          type="button"
          disabled={busy}
          aria-label={interpolate(copy.removeMemberFromGroup, { name: member.name })}
          className="text-rose-700"
          onClick={() =>
            void confirm({
              title: copy.removeMemberConfirm,
              description: interpolate(copy.removeMemberDescription, { name: member.name }),
              tone: "danger",
              confirmLabel: copy.delete,
            }).then((ok) => ok && remove())
          }
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  );
}

export function PermissionEditor({
  value,
  busy,
  save,
}: {
  value: GroupPermissions;
  busy: boolean;
  save: (body: GroupPermissions) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const [permissions, setPermissions] = useState(value);
  useEffect(() => setPermissions(value), [value]);
  return (
    <section className="rounded-lg border p-3">
      <strong className="mb-2 block">{copy.permissions}</strong>
      <div className="grid gap-2">
        {permissionLabels.map(([key]) => (
          <label key={key} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!!permissions[key]}
              onChange={(event) => setPermissions({ ...permissions, [key]: event.target.checked })}
            />
            {localizedPermission(copy, key)}
          </label>
        ))}
      </div>
      <Button
        className="mt-3 w-full"
        loading={busy}
        disabled={busy}
        onClick={() => save(permissions)}
      >
        {copy.savePermissions}
      </Button>
    </section>
  );
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
