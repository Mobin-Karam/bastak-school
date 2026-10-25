import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Pencil, Plus } from "lucide-react";
import { useAuth } from "../auth";
import type { RoleCode } from "../../../shared/types/domain";
import { roleLabel, roleLabels } from "../../../shared/lib/role-ui";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PasswordInput,
  Select,
} from "../../../shared/ui/ui";
import { DataTable, defaultTableQuery, type DataTableQuery } from "../../../shared/ui/data-table";
import { ResponsiveDrawer } from "../../../shared/ui/responsive-drawer";

import {
  archiveUser,
  createUser,
  listOrganizations,
  listUsers,
  setUserActive,
  setUserRoles,
  transferPlatformOwnership,
  updateUser,
  type PortalOrganization,
  type PortalUser,
} from "./api/access.api";
import { accessCopy } from "./model/access-copy";
import {
  principalAssignableRoles,
  rolesForOrganizationType,
} from "../../../shared/lib/organization-role-policy";
import { OrganizationTag } from "../../../shared/ui/organization-tag";

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
    isPlatform = auth.activeRole === "PLATFORM_ADMIN",
    isPlatformOwner = auth.context?.user.isPlatformOwner === true,
    principalProvisioningOnly = auth.activeRole === "PRINCIPAL";
  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
    enabled: isPlatform,
  });
  const [organizationId, setOrganizationId] = useState(
    () => searchParams.get("organizationId") ?? auth.context?.activeOrganization?.id ?? "",
  );
  const authorityScope = `${auth.context?.activeOrganization?.id ?? ""}:${auth.activeRole}`;
  const previousScope = useRef(authorityScope);
  useEffect(() => {
    if (previousScope.current === authorityScope) return;
    previousScope.current = authorityScope;
    setOrganizationId(auth.context?.activeOrganization?.id ?? "");
    setSelectedUserId("");
    setEditing(null);
  }, [auth.context?.activeOrganization?.id, authorityScope]);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? ""),
    [status, setStatus] = useState(() => searchParams.get("status") ?? "ALL"),
    [selectedUserId, setSelectedUserId] = useState(() => searchParams.get("userId") ?? "");
  const users = useQuery({
    queryKey: ["users", organizationId || "platform"],
    queryFn: () => listUsers(organizationId || undefined, true),
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [editDraft, setEditDraft] = useState({
    phoneNumber: "",
    firstName: "",
    lastName: "",
    roles: ["COUNSELOR"] as RoleCode[],
    organizationId: "",
    password: "",
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const create = useMutation({
    mutationFn: (body: Parameters<typeof createUser>[0]) => createUser(body),
    onSuccess: async () => {
      setCreating(false);
      notify(copy.userCreated);
      await refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onError: (error) => {
      notify(errorText(error, copy.accountSaveFailed), "error");
      void refresh();
    },
    onSuccess: async () => {
      await refresh();
      notify(copy.userStatusUpdated);
    },
  });
  const archive = useMutation({
    mutationFn: archiveUser,
    onError: (error) => {
      notify(errorText(error, copy.accountSaveFailed), "error");
      void refresh();
    },
    onSuccess: async () => {
      await refresh();
      notify(copy.userArchived);
    },
  });
  const transferOwnership = useMutation({
    mutationFn: transferPlatformOwnership,
    onError: (error) => {
      notify(errorText(error, copy.accountSaveFailed), "error");
      void refresh();
    },
    onSuccess: async () => {
      notify(copy.ownershipTransferred);
      await refresh();
    },
  });
  const bulkStatus = useMutation({
    mutationFn: async ({ ids, active }: { ids: string[]; active: boolean }) => {
      const results = await Promise.allSettled(ids.map((id) => setUserActive(id, active)));
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
    },
    onError: (error) => {
      notify(errorText(error, copy.accountSaveFailed), "error");
      void refresh();
    },
    onSuccess: async (_, values) => {
      await refresh();
      notify(copy.accountsUpdated(values.ids.length, profile.locale));
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const profileChanged =
        editDraft.phoneNumber !== (editing.phoneNumber ?? editing.username) ||
        editDraft.firstName !== (editing.firstName ?? "") ||
        editDraft.lastName !== (editing.lastName ?? "") ||
        Boolean(editDraft.password);
      if (profileChanged)
        await updateUser(editing.id, {
          phoneNumber: editDraft.phoneNumber,
          firstName: editDraft.firstName,
          lastName: editDraft.lastName,
          ...(editDraft.password ? { password: editDraft.password } : {}),
        });
      if (
        !sameRoles(
          editDraft.roles,
          editing.assignments
            .filter((item) => item.organizationId === (editDraft.organizationId || null))
            .map((item) => item.role),
        ) &&
        !editing.isPlatformOwner &&
        editing.id !== auth.context?.user.id &&
        (!principalProvisioningOnly ||
          editDraft.roles.every(
            (role) =>
              principalAssignableRoles.includes(role) ||
              editing.assignments.some(
                (item) => item.role === role && item.organizationId === editDraft.organizationId,
              ),
          ))
      ) {
        await setUserRoles(editing.id, {
          roleCodes: editDraft.roles,
          ...(!editDraft.roles.includes("PLATFORM_ADMIN")
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
  const [tableQuery, setTableQuery] = useState<DataTableQuery>(() => ({
    ...defaultTableQuery,
    search,
    filters: status === "ALL" ? [] : [{ id: "status", value: status }],
  }));
  const updateTableQuery = (query: DataTableQuery) => {
    setTableQuery(query);
    setSearch(query.search);
    setStatus(String(query.filters.find((filter) => filter.id === "status")?.value ?? "ALL"));
  };
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
  const startEdit = (user: PortalUser) => {
    const assignment =
      user.assignments.find((item) => item.organizationId === organizationId) ??
      user.assignments[0];
    save.reset();
    setEditing(user);
    setEditDraft({
      phoneNumber: user.phoneNumber ?? user.username,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      roles: user.assignments
        .filter((item) => item.organizationId === (assignment?.organizationId ?? null))
        .map((item) => item.role),
      organizationId: assignment?.organizationId ?? organizationId,
      password: "",
    });
  };

  const details = selectedUser ? (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-slate-950 to-slate-700 p-3 text-white">
        <span className="grid size-9 place-items-center rounded-2xl bg-white/10 text-xl font-black">
          {nameOf(selectedUser).slice(0, 1)}
        </span>
        <h2 className="mt-2 text-sm font-black">{nameOf(selectedUser)}</h2>
        <p className="mt-1 text-xs text-white/60" dir="ltr">
          {selectedUser.username}
        </p>
      </div>
      <div className="grid gap-2 p-3">
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
                {item.organizationId ? (
                  <OrganizationTag
                    compact
                    organization={organizations.data?.find((org) => org.id === item.organizationId)}
                  />
                ) : (
                  <span className="ms-1 text-slate-500">{copy.platformLevel}</span>
                )}
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
          <Button
            variant="soft"
            onClick={() => {
              setSelectedUserId("");
              startEdit(selectedUser);
            }}
          >
            <Pencil size={15} />
            {copy.editAccountAccess}
          </Button>
        ) : null}
      </div>
    </Card>
  ) : (
    <Card className="p-4">
      <EmptyState title={copy.selectUserForDetails} />
    </Card>
  );
  return (
    <div className="grid gap-3">
      <section className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="sr-only">{copy.userList}</h2>
          <p className="text-xs text-slate-500">
            {copy.userResults(users.data?.length ?? 0, users.data?.length ?? 0, profile.locale)} ·{" "}
            {copy.active}:{" "}
            {(users.data?.filter((user) => user.status === "ACTIVE").length ?? 0).toLocaleString(
              profile.locale,
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPlatform ? (
            <Select
              aria-label={copy.organizationScope}
              className="h-9 max-w-48 text-xs"
              value={organizationId}
              onChange={(event) => {
                setOrganizationId(event.target.value);
                setSelectedUserId("");
                setEditing(null);
                updateTableQuery(defaultTableQuery);
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
          {canManage ? (
            <Button
              className="h-9 px-3 text-xs"
              onClick={() => {
                setEditing(null);
                setCreating(true);
              }}
            >
              <Plus size={15} />
              {copy.newUser}
            </Button>
          ) : null}
        </div>
      </section>
      <ResponsiveDrawer
        open={creating}
        onOpenChange={(open) => {
          if (!create.isPending) setCreating(open);
        }}
        title={copy.newUser}
        description={copy.newUserDescription}
        desktopSide="left"
      >
        <UserCreateForm
          organizations={organizations.data ?? []}
          defaultOrganizationId={organizationId || auth.context?.activeOrganization?.id || ""}
          isPlatform={isPlatform}
          allowPlatform={isPlatform && isPlatformOwner}
          allowedRoles={principalProvisioningOnly ? principalAssignableRoles : undefined}
          onSubmit={(body) => create.mutateAsync(body)}
        />
      </ResponsiveDrawer>
      {editing ? (
        <ResponsiveDrawer
          open={Boolean(editing)}
          onOpenChange={(open) => {
            if (!open && !save.isPending) setEditing(null);
          }}
          title={copy.editAccount(nameOf(editing))}
          description={copy.editAccountDescription}
          desktopSide="left"
        >
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!save.isPending) save.mutate();
            }}
          >
            <Field label={copy.phoneNumber}>
              <Input
                required
                inputMode="tel"
                pattern="09[0-9]{9}"
                dir="ltr"
                value={editDraft.phoneNumber}
                onChange={(e) => setEditDraft({ ...editDraft, phoneNumber: e.target.value })}
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
            <Field label={copy.resetPassword} description={copy.resetPasswordHint}>
              <PasswordInput
                minLength={12}
                autoComplete="new-password"
                dir="ltr"
                value={editDraft.password}
                onChange={(e) => setEditDraft({ ...editDraft, password: e.target.value })}
              />
            </Field>
            {!isProtected(editing) ? (
              <RoleField
                value={editDraft.roles}
                onChange={(roles) => setEditDraft({ ...editDraft, roles })}
                allowPlatform={isPlatform && isPlatformOwner && !editDraft.organizationId}
                allowedRoles={principalProvisioningOnly ? principalAssignableRoles : undefined}
                organizationType={
                  (organizations.data || []).find((item) => item.id === editDraft.organizationId)
                    ?.type ??
                  (editDraft.organizationId === auth.context?.activeOrganization?.id
                    ? auth.context.activeOrganization.type
                    : undefined)
                }
              />
            ) : (
              <p className="self-end rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {copy.protectedAccountHint}
              </p>
            )}
            {isPlatform && !isProtected(editing) && !editDraft.roles.includes("PLATFORM_ADMIN") ? (
              <OrganizationField
                organizations={organizations.data || []}
                value={editDraft.organizationId}
                onChange={(value) => {
                  const roles = rolesForOrganizationType(
                    (organizations.data || []).find((item) => item.id === value)?.type,
                  );
                  setEditDraft({
                    ...editDraft,
                    organizationId: value,
                    roles: editDraft.roles.filter((role) => roles.includes(role)),
                  });
                }}
              />
            ) : null}
            <div className="flex items-end gap-2">
              <Button
                loading={save.isPending}
                disabled={!isProtected(editing) && !editDraft.roles.length}
              >
                {copy.saveChanges}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={save.isPending}
                onClick={() => setEditing(null)}
              >
                {copy.cancel}
              </Button>
            </div>
            {save.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                {errorText(save.error, copy.accountSaveFailed)}
              </p>
            ) : null}
          </form>
        </ResponsiveDrawer>
      ) : null}
      <section dir="rtl">
        <Card
          dir={language === "fa" ? "rtl" : "ltr"}
          className="min-w-0 overflow-hidden"
          aria-label={copy.userList}
        >
          <DataTable
            key={`${organizationId}:${auth.context?.user.id}:${auth.activeRole}`}
            language={language}
            loading={users.isLoading}
            error={users.isError}
            errorMessage={copy.usersFailed}
            onRefresh={() => void users.refetch()}
            refreshing={users.isFetching && !users.isLoading}
            busy={toggle.isPending || archive.isPending || bulkStatus.isPending || save.isPending}
            preferenceKey={`users:${auth.context?.user.id}:${organizationId}`}
            data={users.data ?? []}
            query={tableQuery}
            onQueryChange={updateTableQuery}
            getRowId={(user) => user.id}
            label={copy.userList}
            onRowClick={(user) => setSelectedUserId(user.id)}
            selectable={canManage}
            bulkActions={(selectedRows, clearSelection) => (
              <>
                {
                  <Button
                    variant="soft"
                    className="h-9"
                    loading={bulkStatus.isPending}
                    disabled={bulkStatus.isPending || selectedRows.some(isProtected)}
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
                            bulkStatus.mutate(
                              {
                                ids: selectedRows.map((user) => user.id),
                                active: true,
                              },
                              { onSuccess: clearSelection },
                            ),
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
                  disabled={bulkStatus.isPending || selectedRows.some(isProtected)}
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
                          bulkStatus.mutate(
                            {
                              ids: selectedRows.map((user) => user.id),
                              active: false,
                            },
                            { onSuccess: clearSelection },
                          ),
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
                label: copy.user,
                primary: true,
                value: (user) => `${nameOf(user)} ${user.username} ${user.phoneNumber ?? ""}`,
                cell: (user) => (
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{nameOf(user)}</strong>
                      {user.isPlatformOwner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          <Crown size={12} /> {copy.platformOwner}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500" dir="ltr">
                      {user.username}
                    </p>
                  </div>
                ),
              },
              {
                id: "roles",
                label: copy.roles,
                value: (user) =>
                  user.assignments.map((item) => roleLabel(item.role, language)).join(", "),
              },
              {
                id: "status",
                label: copy.accountStatus,
                value: (user) => user.status,
                cell: (user) => <StatusPill status={user.status} />,
                filter: {
                  type: "select",
                  options: [
                    { value: "ACTIVE", label: copy.activeStatus },
                    { value: "DISABLED", label: copy.inactiveStatus },
                    { value: "ARCHIVED", label: copy.archivedStatus },
                  ],
                },
              },
            ]}
            actions={
              canManage
                ? [
                    {
                      id: "edit",
                      label: copy.edit,
                      icon: <Pencil size={16} />,
                      onClick: startEdit,
                    },
                    {
                      id: "activate",
                      label: copy.activateAccounts,
                      visible: (user) => !isProtected(user) && user.status !== "ACTIVE",
                      onClick: (user) => toggle.mutate({ id: user.id, active: true }),
                    },
                    {
                      id: "disable",
                      label: copy.disable,
                      visible: (user) => !isProtected(user) && user.status === "ACTIVE",
                      onClick: (user) =>
                        void modal
                          .confirm({
                            title: copy.disableAccountTitle,
                            description: copy.disableAccountDescription(nameOf(user)),
                            tone: "danger",
                            confirmLabel: copy.disableAccounts,
                            showCancel: true,
                          })
                          .then(
                            (confirmed) =>
                              confirmed && toggle.mutate({ id: user.id, active: false }),
                          ),
                    },
                    {
                      id: "archive",
                      label: copy.archive,
                      tone: "danger",
                      visible: (user) =>
                        !isProtected(user) && user.status !== "ARCHIVED",
                      onClick: (user) =>
                        void modal
                          .confirm({
                            title: copy.archiveAccountTitle,
                            description: copy.archiveAccountDescription(nameOf(user)),
                            confirmationText: copy.archive,
                            confirmLabel: copy.archive,
                            cancelLabel: copy.cancel,
                            showCancel: true,
                            tone: "danger",
                          })
                          .then((confirmed) => confirmed && archive.mutate(user.id)),
                    },
                  ]
                : []
            }
          />
        </Card>
      </section>
      <ResponsiveDrawer
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId("");
        }}
        title={selectedUser ? nameOf(selectedUser) : copy.userList}
        description={copy.usersDescription}
        desktopSide="left"
      >
        {details}
      </ResponsiveDrawer>
    </div>
  );
}

function UserCreateForm({
  organizations,
  defaultOrganizationId,
  isPlatform,
  allowPlatform,
  allowedRoles,
  onSubmit,
}: {
  organizations: PortalOrganization[];
  defaultOrganizationId: string;
  isPlatform: boolean;
  allowPlatform: boolean;
  allowedRoles?: readonly RoleCode[];
  onSubmit: (body: Parameters<typeof createUser>[0]) => Promise<unknown>;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  const [draft, setDraft] = useState({
    phoneNumber: "",
    password: "",
    firstName: "",
    lastName: "",
    roles: [] as RoleCode[],
    organizationId: defaultOrganizationId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requiresOrganization = !draft.roles.includes("PLATFORM_ADMIN");
  const selectedOrganization = organizations.find((item) => item.id === draft.organizationId);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError("");
        try {
          await onSubmit({
            phoneNumber: draft.phoneNumber,
            password: draft.password,
            firstName: draft.firstName,
            lastName: draft.lastName,
            roleCodes: draft.roles,
            ...(requiresOrganization ? { organizationId: draft.organizationId } : {}),
          });
        } catch (submissionError) {
          setError(errorText(submissionError, copy.accountCreateFailed));
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Field label={copy.phoneNumber}>
        <Input
          required
          autoComplete="tel"
          inputMode="tel"
          pattern="09[0-9]{9}"
          dir="ltr"
          value={draft.phoneNumber}
          onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })}
        />
      </Field>
      <Field label={copy.password}>
        <PasswordInput
          required
          minLength={12}
          autoComplete="new-password"
          dir="ltr"
          value={draft.password}
          onChange={(event) => setDraft({ ...draft, password: event.target.value })}
        />
      </Field>
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
      <RoleField
        value={draft.roles}
        onChange={(roles) => setDraft({ ...draft, roles })}
        allowPlatform={allowPlatform}
        organizationType={selectedOrganization?.type}
        allowedRoles={allowedRoles}
      />
      {isPlatform && requiresOrganization ? (
        <OrganizationField
          organizations={organizations}
          value={draft.organizationId}
          onChange={(organizationId) => {
            const roles = rolesForOrganizationType(
              organizations.find((item) => item.id === organizationId)?.type,
            );
            setDraft({
              ...draft,
              organizationId,
              roles: draft.roles.filter((role) => roles.includes(role)),
            });
          }}
        />
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          loading={isSubmitting}
          disabled={!draft.roles.length || (requiresOrganization && !draft.organizationId)}
        >
          {copy.createAccount}
        </Button>
      </div>
    </form>
  );
}

function sameRoles(a: readonly RoleCode[], b: readonly RoleCode[]) {
  return a.length === b.length && a.every((role) => b.includes(role));
}

function RoleField({
  value,
  onChange,
  allowPlatform,
  organizationType,
  allowedRoles,
}: {
  value: RoleCode[];
  onChange: (roles: RoleCode[]) => void;
  allowPlatform: boolean;
  organizationType?: string | null;
  allowedRoles?: readonly RoleCode[];
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  const available = (
    organizationType ? rolesForOrganizationType(organizationType) : allRoles
  ).filter(
    (role) =>
      role !== "STUDENT" &&
      (!allowedRoles || allowedRoles.includes(role)) &&
      (allowPlatform || role !== "PLATFORM_ADMIN"),
  );
  const roles = [...new Set([...value.filter((role) => role !== "STUDENT"), ...available])];
  return (
    <fieldset className="grid gap-2" aria-label={copy.role}>
      <legend className="text-sm font-medium">{copy.role}</legend>
      <p className="text-xs text-slate-500">
        {language === "fa"
          ? "می‌توانید چند نقش انتخاب کنید. نقش‌ها فقط در سازمان انتخاب‌شده اعمال می‌شوند."
          : "Select one or more roles. School roles apply to the selected organization."}
      </p>
      <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2 dark:border-slate-700">
        {roles.map((role) => (
          <label key={role} className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-brand"
              checked={value.includes(role)}
              disabled={!available.includes(role)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? role === "PLATFORM_ADMIN"
                      ? [role]
                      : [...value.filter((item) => item !== "PLATFORM_ADMIN"), role]
                    : value.filter((item) => item !== role),
                )
              }
            />
            {roleLabel(role, language)}
          </label>
        ))}
      </div>
      {allowPlatform ? (
        <p className="text-xs text-slate-500">
          {language === "fa"
            ? "نقش مدیر پلتفرم در محدوده جداگانه تعیین می‌شود."
            : "Platform administration uses a separate global scope."}
        </p>
      ) : null}
    </fieldset>
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
