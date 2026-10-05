import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Building2,
  CheckCircle2,
  Crown,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../auth";
import type { OrganizationSummary, RoleCode } from "../../shared/types/domain";
import { roleLabel, roleLabels } from "../../shared/lib/role-ui";
import { useModal } from "../../shared/ui/modal";
import { notify } from "../../shared/ui/notifications";
import { useLocale } from "../../shared/ui/locale";
import { Button, Card, EmptyState, Field, Input, Select } from "../../shared/ui/ui";
import { AdminDataTable } from "../../shared/ui/admin-data-table";
import { CollectionToolbar } from "../../shared/ui/collection-toolbar";
import {
  ManagementPageHeader,
  ManagementStat,
  ManagementSummaryBar,
} from "../../shared/ui/management-workspace";
import {
  archiveOrganization,
  archiveUser,
  createOrganization,
  createUser,
  listOrganizations,
  listUsers,
  setUserActive,
  setUserRoles,
  setOrganizationEnabled,
  organizationFeatures,
  setOrganizationFeatures,
  transferPlatformOwnership,
  updateOrganization,
  updateUser,
  type PortalOrganization,
  type PortalUser,
} from "./api/access.api";
import { OrganizationWorkspace } from "./OrganizationWorkspace";
import { AccessFlowGuidance } from "./components/AccessFlowGuidance";
import { emptyAccessResult } from "./model/access-flow";
import { accessCopy } from "./model/access-copy";

const allRoles = Object.keys(roleLabels) as RoleCode[];
const nameOf = (user: PortalUser) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
const errorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function UsersPage() {
  const auth = useAuth(),
    modal = useModal(),
    qc = useQueryClient();
  const { language, profile } = useLocale();
  const copy = accessCopy[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = auth.can("users.manage"),
    isPlatform = auth.hasRole("PLATFORM_ADMIN"),
    isPlatformOwner = auth.context?.user.isPlatformOwner === true;
  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
    enabled: isPlatform,
  });
  const [organizationId, setOrganizationId] = useState(
    () => searchParams.get("organizationId") ?? auth.context?.activeOrganization?.id ?? "",
  );
  const [search, setSearch] = useState(() => searchParams.get("q") ?? ""),
    [status, setStatus] = useState(() => searchParams.get("status") ?? "ALL"),
    [selectedUserId, setSelectedUserId] = useState(() => searchParams.get("userId") ?? ""),
    [selectedIds, setSelectedIds] = useState<string[]>([]);
  const users = useQuery({
    queryKey: ["users", organizationId || "platform"],
    queryFn: () => listUsers(organizationId || undefined),
  });
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [editDraft, setEditDraft] = useState({
    username: "",
    firstName: "",
    lastName: "",
    role: "ADVISOR" as RoleCode,
    organizationId: "",
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const create = useMutation({
    mutationFn: (body: Parameters<typeof createUser>[0]) => createUser(body),
    onSuccess: async () => {
      modal.close();
      notify(copy.userCreated);
      await refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onSuccess: async () => {
      await refresh();
      notify(copy.userStatusUpdated);
    },
  });
  const archive = useMutation({
    mutationFn: archiveUser,
    onSuccess: async () => {
      await refresh();
      notify(copy.userArchived);
    },
  });
  const transferOwnership = useMutation({
    mutationFn: transferPlatformOwnership,
    onSuccess: async () => {
      notify(copy.ownershipTransferred);
      await refresh();
    },
  });
  const bulkStatus = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      Promise.all(ids.map((id) => setUserActive(id, active))),
    onSuccess: async (_, values) => {
      setSelectedIds([]);
      await refresh();
      notify(copy.accountsUpdated(values.ids.length, profile.locale));
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await updateUser(editing.id, {
        username: editDraft.username,
        firstName: editDraft.firstName,
        lastName: editDraft.lastName,
      });
      if (!editing.isPlatformOwner && editing.id !== auth.context?.user.id) {
        await setUserRoles(editing.id, {
          roleCodes: [editDraft.role],
          ...(editDraft.role !== "PLATFORM_ADMIN"
            ? { organizationId: editDraft.organizationId || organizationId }
            : {}),
        });
      }
    },
    onSuccess: async () => {
      setEditing(null);
      notify(copy.userAccessSaved);
      await refresh();
    },
  });
  const visible = useMemo(
    () =>
      (users.data || []).filter((user) => {
        const term = search.trim().toLowerCase();
        return (
          (!term || `${nameOf(user)} ${user.username}`.toLowerCase().includes(term)) &&
          (status === "ALL" || user.status === status)
        );
      }),
    [search, status, users.data],
  );
  const selectedUser = (users.data || []).find((user) => user.id === selectedUserId) || null;

  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const setOrDelete = (key: string, value: string, defaultValue = "") => {
          if (!value || value === defaultValue) next.delete(key);
          else next.set(key, value);
        };
        setOrDelete("organizationId", organizationId);
        setOrDelete("q", search);
        setOrDelete("status", status, "ALL");
        setOrDelete("userId", selectedUserId);
        return next;
      },
      { replace: true },
    );
  }, [organizationId, search, selectedUserId, setSearchParams, status]);

  useEffect(() => {
    if (selectedUserId && !selectedUser && !users.isLoading) setSelectedUserId("");
  }, [selectedUser, selectedUserId, users.isLoading]);
  const isProtected = (user: PortalUser) =>
    user.id === auth.context?.user.id || user.isPlatformOwner === true;
  const protectedSelection = selectedIds.some((id) => {
    const user = (users.data || []).find((candidate) => candidate.id === id);
    return user ? isProtected(user) : false;
  });
  const startEdit = (user: PortalUser) => {
    const assignment =
      user.assignments.find((item) => item.organizationId === organizationId) ??
      user.assignments[0];
    setEditing(user);
    setEditDraft({
      username: user.username,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: assignment?.role ?? "ADVISOR",
      organizationId: assignment?.organizationId ?? organizationId,
    });
  };

  return (
    <div className="grid gap-5">
      <AccessFlowGuidance scope="users" canManage={canManage} />
      {isPlatformOwner ? (
        <Card className="border-brand/25 bg-brand/5 p-4">
          <div className="flex gap-3">
            <Crown className="mt-0.5 shrink-0 text-brand" size={20} />
            <div>
              <h2 className="font-black">{copy.platformOwnership}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {copy.platformOwnershipDescription}
              </p>
            </div>
          </div>
        </Card>
      ) : null}
      <section className="grid gap-3" aria-label={copy.userListTools}>
        <ManagementSummaryBar
          action={
            canManage ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  modal.open({
                    title: copy.newUser,
                    description: copy.newUserDescription,
                    size: "lg",
                    content: (
                      <UserCreateForm
                        organizations={organizations.data || []}
                        defaultOrganizationId={
                          organizationId || auth.context?.activeOrganization?.id || ""
                        }
                        isPlatform={isPlatform}
                        allowPlatform={isPlatformOwner}
                        onSubmit={(body) => create.mutateAsync(body)}
                      />
                    ),
                  });
                }}
              >
                <Plus size={16} />
                {copy.newUser}
              </Button>
            ) : null
          }
        >
          <ManagementStat label={copy.allAccounts} value={users.data?.length ?? 0} />
          <ManagementStat
            label={copy.active}
            value={users.data?.filter((x) => x.status === "ACTIVE").length ?? 0}
            tone="success"
          />
          <ManagementStat
            label={copy.roles}
            value={new Set(users.data?.flatMap((x) => x.assignments.map((a) => a.role))).size}
          />
        </ManagementSummaryBar>
        <Card className="p-3 sm:p-4">
          <CollectionToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder={copy.searchUsers}
            resultLabel={copy.userResults(visible.length, users.data?.length || 0, profile.locale)}
            onClear={
              search || status !== "ALL"
                ? () => {
                    setSearch("");
                    setStatus("ALL");
                  }
                : undefined
            }
            filters={
              <>
                {isPlatform ? (
                  <Select
                    aria-label={copy.organizationScope}
                    className="h-8 min-w-32 border-0 bg-transparent text-[11px]"
                    value={organizationId}
                    onChange={(e) => {
                      setOrganizationId(e.target.value);
                      setSelectedUserId("");
                      setSelectedIds([]);
                    }}
                  >
                    <option value="">{copy.platformScope}</option>
                    {organizations.data?.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select
                  aria-label={copy.accountStatus}
                  className="h-8 min-w-28 border-0 bg-transparent text-[11px]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ALL">{copy.allStatuses}</option>
                  <option value="ACTIVE">{copy.activeStatus}</option>
                  <option value="DISABLED">{copy.inactiveStatus}</option>
                  <option value="ARCHIVED">{copy.archivedStatus}</option>
                </Select>
              </>
            }
          />
        </Card>
      </section>
      {editing ? (
        <Card className="border-brand/30 p-5">
          <SectionTitle
            icon={<Pencil size={18} />}
            title={copy.editAccount(nameOf(editing))}
            subtitle={copy.editAccountDescription}
          />
          <form
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label={copy.username}>
              <Input
                required
                minLength={2}
                dir="ltr"
                value={editDraft.username}
                onChange={(e) => setEditDraft({ ...editDraft, username: e.target.value })}
              />
            </Field>
            <Field label={copy.firstName}>
              <Input
                value={editDraft.firstName}
                onChange={(e) => setEditDraft({ ...editDraft, firstName: e.target.value })}
              />
            </Field>
            <Field label={copy.lastName}>
              <Input
                value={editDraft.lastName}
                onChange={(e) => setEditDraft({ ...editDraft, lastName: e.target.value })}
              />
            </Field>
            {!isProtected(editing) ? (
              <RoleField
                value={editDraft.role}
                onChange={(role) => setEditDraft({ ...editDraft, role })}
                allowPlatform={isPlatformOwner}
              />
            ) : (
              <p className="self-end rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {copy.protectedAccountHint}
              </p>
            )}
            {!isProtected(editing) && editDraft.role !== "PLATFORM_ADMIN" ? (
              <OrganizationField
                organizations={organizations.data || []}
                value={editDraft.organizationId}
                onChange={(value) => setEditDraft({ ...editDraft, organizationId: value })}
              />
            ) : null}
            <div className="flex items-end gap-2">
              <Button loading={save.isPending}>{copy.saveChanges}</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                {copy.cancel}
              </Button>
            </div>
            {save.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                {errorText(save.error, copy.accountSaveFailed)}
              </p>
            ) : null}
          </form>
        </Card>
      ) : null}
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
        <Card className="overflow-hidden" aria-label={copy.userList}>
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-black">{copy.userList}</h2>
            <p className="text-xs text-slate-500">{copy.usersDescription}</p>
          </div>
          {users.isLoading ? (
            <LoadingRows />
          ) : users.isError ? (
            <Retry message={copy.usersFailed} retry={() => users.refetch()} />
          ) : !visible.length ? (
            <div className="p-6">
              <EmptyState
                title={emptyAccessResult(
                  "users",
                  Boolean(search || status !== "ALL" || organizationId),
                  language,
                )}
                action={
                  search || status !== "ALL" || organizationId ? (
                    <Button
                      variant="soft"
                      onClick={() => {
                        setSearch("");
                        setStatus("ALL");
                        setOrganizationId("");
                      }}
                    >
                      {copy.clearFilters}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <AdminDataTable
              rows={visible}
              rowId={(user) => user.id}
              label={copy.userList}
              activeId={selectedUserId}
              onRowClick={(user) => setSelectedUserId(user.id)}
              selectedIds={selectedIds}
              onSelectionChange={canManage ? setSelectedIds : undefined}
              batchActions={(selectedRows) => (
                <>
                  {
                    <Button
                      variant="soft"
                      className="h-9"
                      loading={bulkStatus.isPending}
                      disabled={protectedSelection}
                      onClick={() =>
                        void modal
                          .confirm({
                            title: copy.activateSelectedAccountsTitle,
                            description: copy.activateSelectedAccountsDescription(
                              selectedRows.length,
                              profile.locale,
                            ),
                            confirmLabel: copy.activateAccounts,
                            showCancel: true,
                          })
                          .then(
                            (confirmed) =>
                              confirmed &&
                              bulkStatus.mutate({
                                ids: selectedRows.map((user) => user.id),
                                active: true,
                              }),
                          )
                      }
                    >
                      {copy.activateAccounts}
                    </Button>
                  }
                  <Button
                    variant="soft"
                    className="h-9"
                    loading={bulkStatus.isPending}
                    disabled={protectedSelection}
                    onClick={() =>
                      void modal
                        .confirm({
                          title: copy.disableSelectedAccountsTitle,
                          description: copy.disableSelectedAccountsDescription(
                            selectedRows.length,
                            profile.locale,
                          ),
                          tone: "danger",
                          confirmLabel: copy.disableAccounts,
                        })
                        .then(
                          (confirmed) =>
                            confirmed &&
                            bulkStatus.mutate({
                              ids: selectedRows.map((user) => user.id),
                              active: false,
                            }),
                        )
                    }
                  >
                    {copy.disableAccounts}
                  </Button>
                </>
              )}
              columns={[
                {
                  id: "user",
                  header: copy.user,
                  cell: (user) => (
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{nameOf(user)}</strong>
                        {user.isPlatformOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            <Crown size={12} /> {copy.platformOwner}
                          </span>
                        ) : null}
                        <StatusPill status={user.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500" dir="ltr">
                        {user.username}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.assignments.map((item, index) => (
                          <span
                            key={`${item.role}-${item.organizationId}-${index}`}
                            className="rounded-full bg-brand/10 px-2 py-1 text-[11px] font-bold text-brand"
                          >
                            {roleLabel(item.role, language)}
                            {item.organizationId
                              ? ` · ${organizations.data?.find((org) => org.id === item.organizationId)?.name || copy.organization}`
                              : ` · ${copy.platformLevel}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "actions",
                  header: copy.actions,
                  cell: (user) =>
                    canManage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="soft" onClick={() => startEdit(user)}>
                          <Pencil size={15} />
                          {copy.edit}
                        </Button>
                        {!isProtected(user) ? (
                          <Button
                            variant="soft"
                            loading={toggle.isPending && toggle.variables?.id === user.id}
                            disabled={toggle.isPending || archive.isPending}
                            onClick={() =>
                              user.status === "ACTIVE"
                                ? void modal
                                    .confirm({
                                      title: copy.disableAccountTitle,
                                      description: copy.disableAccountDescription(nameOf(user)),
                                      tone: "danger",
                                      confirmLabel: copy.disableAccounts,
                                    })
                                    .then(
                                      (confirmed) =>
                                        confirmed && toggle.mutate({ id: user.id, active: false }),
                                    )
                                : toggle.mutate({ id: user.id, active: true })
                            }
                          >
                            {user.status === "ACTIVE" ? copy.disable : copy.activateAccounts}
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">
                            {user.isPlatformOwner
                              ? copy.transferOwnershipFirst
                              : copy.currentAccount}
                          </span>
                        )}
                        {isPlatform && user.status !== "ARCHIVED" && !isProtected(user) ? (
                          <Button
                            variant="danger"
                            loading={archive.isPending && archive.variables === user.id}
                            disabled={archive.isPending || toggle.isPending}
                            onClick={async () => {
                              if (
                                await modal.confirm({
                                  title: copy.archiveAccountTitle,
                                  description: copy.archiveAccountDescription(nameOf(user)),
                                  confirmLabel: copy.archive,
                                  confirmationText: copy.archive,
                                  tone: "danger",
                                  cancelLabel: copy.cancel,
                                  showCancel: true,
                                })
                              )
                                archive.mutate(user.id);
                            }}
                          >
                            {copy.archive}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">{copy.readOnly}</span>
                    ),
                },
              ]}
            />
          )}
        </Card>
        <div className="xl:sticky xl:top-20">
          {selectedUser ? (
            <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-slate-950 to-slate-700 p-5 text-white">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-xl font-black">
                  {nameOf(selectedUser).slice(0, 1)}
                </span>
                <h2 className="mt-3 text-lg font-black">{nameOf(selectedUser)}</h2>
                <p className="mt-1 text-xs text-white/60" dir="ltr">
                  {selectedUser.username}
                </p>
              </div>
              <div className="grid gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{copy.accountStatus}</span>
                  <StatusPill status={selectedUser.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{copy.rolesAndScopes}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.assignments.map((item, index) => (
                      <span
                        key={`${item.role}-${index}`}
                        className="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand"
                      >
                        {roleLabel(item.role, language)}
                      </span>
                    ))}
                  </div>
                </div>
                {isPlatformOwner &&
                selectedUser.id !== auth.context?.user.id &&
                !selectedUser.isPlatformOwner &&
                selectedUser.status === "ACTIVE" &&
                selectedUser.assignments.some((item) => item.role === "PLATFORM_ADMIN") ? (
                  <Button
                    variant="soft"
                    loading={transferOwnership.isPending}
                    onClick={() =>
                      void modal
                        .confirm({
                          title: copy.transferOwnershipTitle,
                          description: copy.transferOwnershipDescription(nameOf(selectedUser)),
                          confirmLabel: copy.transferOwnership,
                          confirmationText: copy.transferOwnership,
                          tone: "danger",
                          cancelLabel: copy.cancel,
                          showCancel: true,
                        })
                        .then((confirmed) => confirmed && transferOwnership.mutate(selectedUser.id))
                    }
                  >
                    <Crown size={15} /> {copy.transferOwnership}
                  </Button>
                ) : null}
                {canManage ? (
                  <Button variant="soft" onClick={() => startEdit(selectedUser)}>
                    <Pencil size={15} />
                    {copy.editAccountAccess}
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <EmptyState title={copy.selectUserForDetails} />
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function UserCreateForm({
  organizations,
  defaultOrganizationId,
  isPlatform,
  allowPlatform,
  onSubmit,
}: {
  organizations: PortalOrganization[];
  defaultOrganizationId: string;
  isPlatform: boolean;
  allowPlatform: boolean;
  onSubmit: (body: Parameters<typeof createUser>[0]) => Promise<unknown>;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  const [draft, setDraft] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "ADVISOR" as RoleCode,
    organizationId: defaultOrganizationId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requiresOrganization = draft.role !== "PLATFORM_ADMIN";

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
          await onSubmit({
            username: draft.username,
            password: draft.password,
            firstName: draft.firstName,
            lastName: draft.lastName,
            roleCodes: [draft.role],
            ...(requiresOrganization ? { organizationId: draft.organizationId } : {}),
          });
        } catch (submissionError) {
          setError(errorText(submissionError, copy.accountCreateFailed));
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Field label={copy.username}>
        <Input
          required
          minLength={2}
          dir="ltr"
          value={draft.username}
          onChange={(event) => setDraft({ ...draft, username: event.target.value })}
        />
      </Field>
      <Field label={copy.password}>
        <Input
          required
          minLength={12}
          type="password"
          dir="ltr"
          value={draft.password}
          onChange={(event) => setDraft({ ...draft, password: event.target.value })}
        />
      </Field>
      <RoleField
        value={draft.role}
        onChange={(role) => setDraft({ ...draft, role })}
        allowPlatform={allowPlatform}
      />
      <Field label={copy.firstName}>
        <Input
          value={draft.firstName}
          onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
        />
      </Field>
      <Field label={copy.lastName}>
        <Input
          value={draft.lastName}
          onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
        />
      </Field>
      {isPlatform && requiresOrganization ? (
        <OrganizationField
          organizations={organizations}
          value={draft.organizationId}
          onChange={(organizationId) => setDraft({ ...draft, organizationId })}
        />
      ) : null}
      {error ? (
        <p role="alert" className="md:col-span-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="md:col-span-2 flex justify-end">
        <Button loading={isSubmitting} disabled={requiresOrganization && !draft.organizationId}>
          {copy.createAccount}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </span>
      <div>
        <h2 className="font-black">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
function RoleField({
  value,
  onChange,
  allowPlatform,
}: {
  value: RoleCode;
  onChange: (role: RoleCode) => void;
  allowPlatform: boolean;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <Field label={copy.role}>
      <Select value={value} onChange={(e) => onChange(e.target.value as RoleCode)}>
        {allRoles
          .filter((role) => allowPlatform || role !== "PLATFORM_ADMIN")
          .map((role) => (
            <option key={role} value={role}>
              {roleLabel(role, language)}
            </option>
          ))}
      </Select>
    </Field>
  );
}
function OrganizationField({
  organizations,
  value,
  onChange,
}: {
  organizations: PortalOrganization[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <Field label={copy.organization}>
      <Select required value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{copy.selectOrganization}</option>
        {organizations
          .filter((item) => item.status === "ACTIVE")
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
      </Select>
    </Field>
  );
}
function OrganizationTypeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <Field label={copy.organizationKind}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {["SCHOOL", "ACADEMY", "COUNSELING_CENTER", "PRIVATE_PRACTICE", "OTHER"].map((type) => (
          <option key={type} value={type}>
            {copy.organizationType(type)}
          </option>
        ))}
      </Select>
    </Field>
  );
}
function StatusPill({ status }: { status: string }) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : status === "ARCHIVED" ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
    >
      {status === "ACTIVE"
        ? copy.activeStatus
        : status === "ARCHIVED"
          ? copy.archivedStatus
          : status === "INACTIVE" || status === "DISABLED"
            ? copy.inactiveStatus
            : status}
    </span>
  );
}
function IconAction({
  label,
  active = false,
  tone = "soft",
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "aria-label" | "title" | "size" | "variant"> & {
  label: string;
  active?: boolean;
  tone?: "soft" | "primary" | "danger";
}) {
  return (
    <Button
      size="icon"
      variant={active ? "primary" : tone}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </Button>
  );
}
function LoadingRows() {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <div role="status" aria-label={copy.loading} className="grid gap-3 p-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}
function Retry({ message, retry }: { message: string; retry: () => void }) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <div role="alert" className="grid justify-items-center gap-3 p-8">
      <ShieldCheck className="text-rose-600" />
      <p className="text-sm text-rose-700">{message}</p>
      <Button variant="soft" onClick={retry}>
        {copy.retry}
      </Button>
    </div>
  );
}
