import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Pencil,
  Link2,
  UserPlus,
  Users,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Check,
  X,
  UserRound,
  GraduationCap,
} from "lucide-react";
import type { RoleCode } from "../../../shared/types/domain";
import { Button, Card, EmptyState, Field, Input, Select } from "../../../shared/ui/ui";
import { DataTable } from "../../../shared/ui/data-table";
import { ResponsiveModal } from "../../../shared/ui/responsive-modal";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { roleLabel } from "../../../shared/lib/role-ui";
import { useAuth } from "../auth";
import { useLocale } from "../../../shared/ui/locale";
import { accessCopy } from "./model/access-copy";
import {
  principalAssignableRoles,
  rolesForOrganizationType,
  type AdminOrganizationType,
} from "../../../shared/lib/organization-role-policy";
import {
  acceptRelationship,
  addOrganizationMember,
  allowGuardianChange,
  createRelationship,
  listRelationshipStudents,
  listOrganizationMembers,
  listRelationships,
  listUsers,
  rejectRelationship,
  removeRelationship,
  removeOrganizationMember,
  updateOrganizationMember,
  setOrganizationStudentSignupPolicy,
  type OrganizationMember,
  type RelationshipStudent,
} from "./api/access.api.ts";

const statusTones: Record<string, string> = {
  PENDING:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  ACCEPTED:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  REJECTED:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
};

function displayName(
  user?: { firstName?: string | null; lastName?: string | null; username?: string } | null,
) {
  if (!user) return "—";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "—";
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <div className="text-lg font-black tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </span>
        <div>
          <h3 className="font-bold leading-tight">{title}</h3>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function OrganizationWorkspace({
  organizationId,
  organizationName,
  organizationType,
  studentSignupManagedByOrganization = false,
  studentSignupEnabled = false,
  studentSignupLimit = 0,
  studentSignupCount = 0,
}: {
  organizationId: string;
  organizationName: string;
  organizationType: AdminOrganizationType;
  studentSignupManagedByOrganization?: boolean;
  studentSignupEnabled?: boolean;
  studentSignupLimit?: number;
  studentSignupCount?: number;
}) {
  const auth = useAuth();
  const { language } = useLocale();
  const copy = accessCopy[language];
  const qc = useQueryClient();
  const modal = useModal();
  const [userId, setUserId] = useState("");
  const roles = rolesForOrganizationType(organizationType);
  const assignableRoles =
    auth.activeRole === "PRINCIPAL"
      ? roles.filter((item) => principalAssignableRoles.includes(item))
      : roles;
  const [role, setRole] = useState<RoleCode>(
    assignableRoles.includes("COUNSELOR") ? "COUNSELOR" : assignableRoles[0],
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [memberRole, setMemberRole] = useState<RoleCode>(role);

  const members = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => listOrganizationMembers(organizationId),
  });
  const users = useQuery({
    queryKey: ["users", "platform-membership-picker"],
    queryFn: () => listUsers(),
    enabled: showAddForm && auth.can("organization.members.manage"),
  });
  const relationships = useQuery({ queryKey: ["relationships"], queryFn: listRelationships });
  const relationshipStudents = useQuery({
    queryKey: ["students", "relationship-picker"],
    queryFn: () => listRelationshipStudents(organizationId),
    enabled: auth.can("relationships.manage"),
  });

  const reportError = (error: unknown) =>
    notify(error instanceof Error ? error.message : copy.relationshipsFailed, "error");
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }),
      qc.invalidateQueries({ queryKey: ["relationships"] }),
    ]);
  };

  const add = useMutation({
    mutationFn: () => addOrganizationMember(organizationId, { userId, roleCodes: [role] }),
    onSuccess: async () => {
      setUserId("");
      setShowAddForm(false);
      notify(copy.memberAdded);
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      status,
      roleCodes,
    }: {
      id: string;
      status?: "ACTIVE" | "INACTIVE";
      roleCodes?: RoleCode[];
    }) => updateOrganizationMember(organizationId, id, { status, roleCodes }),
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.membersFailed, "error"),
    onSuccess: async (_, variables) => {
      notify(
        variables.status
          ? variables.status === "ACTIVE"
            ? copy.memberActivated
            : copy.memberSuspended
          : copy.roleUpdated,
      );
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeOrganizationMember(organizationId, id),
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.membersFailed, "error"),
    onSuccess: async () => {
      notify(copy.memberRemoved);
      await refresh();
    },
  });
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      action === "accept" ? acceptRelationship(id) : rejectRelationship(id),
    onError: reportError,
    onSuccess: async (_, variables) => {
      notify(variables.action === "accept" ? copy.relationshipAccepted : copy.relationshipRejected);
      await refresh();
    },
  });
  const createLink = useMutation({
    mutationFn: (body: Parameters<typeof createRelationship>[0]) => createRelationship(body),
    onSuccess: async () => {
      modal.close();
      notify(copy.relationshipCreated);
      await refresh();
    },
  });
  const revokeLink = useMutation({
    mutationFn: removeRelationship,
    onError: reportError,
    onSuccess: async () => {
      notify(copy.relationshipRemoved);
      await refresh();
    },
  });
  const guardianOverride = useMutation({
    mutationFn: allowGuardianChange,
    onError: reportError,
    onSuccess: () => notify(copy.guardianChangeAllowed),
  });
  const signupPolicy = useMutation({
    mutationFn: (body: { enabled: boolean; limit: number }) =>
      setOrganizationStudentSignupPolicy(organizationId, body),
    onError: reportError,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["organizations"] });
      notify(language === "fa" ? "تنظیمات ثبت‌نام ذخیره شد." : "Signup settings saved.");
    },
  });

  const available = (users.data || []).filter(
    (user) => !members.data?.some((member) => member.user.id === user.id),
  );
  const relevant = (relationships.data || []).filter(
    (item) => !item.organizationId || item.organizationId === organizationId,
  );

  const pendingCount = relevant.filter((item) => item.status === "PENDING").length;
  const activeMembers = (members.data || []).filter((m) => m.status === "ACTIVE").length;

  return (
    <div className="grid gap-4">
      {/* ── Hero / Overview ─────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-b from-brand/10 via-brand/5 to-transparent p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand shadow-sm">
                <Building2 size={22} />
              </span>
              <div>
                <h2 className="break-words text-lg font-black leading-tight">{organizationName}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{copy.organizationWorkspace}</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
              <StatPill label={copy.totalMembers} value={members.data?.length ?? "—"} />
              <StatPill label={copy.active} value={activeMembers} />
              <StatPill label={copy.pending} value={pendingCount} />
            </div>
          </div>
        </div>
      </Card>
      {!auth.hasRole("PLATFORM_ADMIN") && auth.can("organization.members.manage") ? (
        <OrganizationSignupControl
          key={`${organizationId}:${studentSignupEnabled}:${studentSignupLimit}`}
          delegated={studentSignupManagedByOrganization}
          enabled={studentSignupEnabled}
          limit={studentSignupLimit}
          used={studentSignupCount}
          pending={signupPolicy.isPending}
          onSave={(body) => signupPolicy.mutate(body)}
        />
      ) : null}

      {/* ── Two-column main layout ─────────────────────────────────── */}
      <div className="grid min-w-0 gap-4 min-[1800px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ── Members ─────────────────────────────────────────────── */}
        <Card className="min-w-0 p-3 sm:p-5">
          <SectionHeader
            icon={<Users size={18} />}
            title={copy.members}
            description={copy.membersDescription}
            action={
              <div className="flex items-center gap-2">
                <Button
                  disabled={!auth.can("organization.members.manage")}
                  variant={showAddForm ? "soft" : "primary"}
                  onClick={() => setShowAddForm((v) => !v)}
                >
                  <UserPlus size={16} />
                  {showAddForm ? copy.close : copy.addMember}
                </Button>
              </div>
            }
          />

          <ResponsiveModal
            open={showAddForm}
            onOpenChange={(open) => {
              if (!add.isPending) setShowAddForm(open);
            }}
            title={copy.addMember}
            description={copy.membersDescription}
          >
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!add.isPending) add.mutate();
              }}
            >
              {users.isLoading ? (
                <p role="status">{copy.loading}</p>
              ) : users.isError ? (
                <div role="alert">
                  <p>{copy.membersFailed}</p>
                  <Button type="button" variant="soft" onClick={() => void users.refetch()}>
                    {copy.retry}
                  </Button>
                </div>
              ) : !available.length ? (
                <p>{copy.noMembers}</p>
              ) : null}
              <Field label={copy.user}>
                <Select
                  required
                  disabled={users.isLoading || users.isError || add.isPending}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">{copy.selectUser}</option>
                  {available.map((user) => (
                    <option key={user.id} value={user.id}>
                      {displayName(user)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={copy.organizationRole}>
                <Select value={role} onChange={(e) => setRole(e.target.value as RoleCode)}>
                  {assignableRoles.map((item) => (
                    <option key={item} value={item}>
                      {roleLabel(item, language)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end gap-2">
                <Button
                  className="flex-1"
                  loading={add.isPending}
                  disabled={!userId || users.isError || members.isError}
                >
                  <UserPlus size={16} />
                  {copy.add}
                </Button>
              </div>
              {add.isError ? (
                <p role="alert" className="md:col-span-3 text-sm text-rose-700">
                  {copy.addMemberFailed}
                </p>
              ) : null}
            </form>
          </ResponsiveModal>

          <ResponsiveModal
            open={Boolean(editingMember)}
            onOpenChange={(open) => {
              if (!open && !update.isPending) setEditingMember(null);
            }}
            title={
              editingMember
                ? copy.memberRoleFor(displayName(editingMember.user))
                : copy.organizationRole
            }
            description={copy.membersDescription}
          >
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (editingMember && !update.isPending)
                  update.mutate(
                    { id: editingMember.user.id, roleCodes: [memberRole] },
                    { onSuccess: () => setEditingMember(null) },
                  );
              }}
            >
              <Field label={copy.organizationRole}>
                <Select
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value as RoleCode)}
                >
                  {!assignableRoles.includes(memberRole) ? (
                    <option value={memberRole} disabled>
                      {roleLabel(memberRole, language)}
                    </option>
                  ) : null}
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role, language)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={update.isPending}
                  onClick={() => setEditingMember(null)}
                >
                  {copy.cancel}
                </Button>
                <Button
                  loading={update.isPending}
                  disabled={
                    !auth.can("organization.members.manage") ||
                    !assignableRoles.includes(memberRole)
                  }
                >
                  {copy.saveChanges}
                </Button>
              </div>
            </form>
          </ResponsiveModal>
          <DataTable<OrganizationMember>
            key={`${organizationId}:${auth.context?.user.id}:${auth.activeRole}`}
            data={members.data ?? []}
            getRowId={(member) => member.id}
            label={copy.members}
            language={language}
            loading={members.isLoading}
            error={members.isError}
            errorMessage={copy.membersFailed}
            onRefresh={() => void members.refetch()}
            refreshing={members.isFetching && !members.isLoading}
            busy={update.isPending || remove.isPending}
            emptyTitle={copy.noMembers}
            preferenceKey={`members:${auth.context?.user.id}:${organizationId}`}
            columns={[
              {
                id: "name",
                label: copy.user,
                primary: true,
                value: (member) => displayName(member.user),
                cell: (member) => (
                  <div>
                    <strong>{displayName(member.user)}</strong>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {member.user.username}
                    </p>
                  </div>
                ),
              },
              {
                id: "roles",
                label: copy.organizationRole,
                value: (member) => member.roles.map((role) => roleLabel(role, language)).join(", "),
                filter: { type: "text" },
              },
              {
                id: "status",
                label: copy.accountStatus,
                value: (member) => member.status,
                cell: (member) => (member.status === "ACTIVE" ? copy.active : copy.inactive),
                filter: {
                  type: "select",
                  options: [
                    { value: "ACTIVE", label: copy.active },
                    { value: "INACTIVE", label: copy.inactive },
                  ],
                },
              },
            ]}
            actions={
              auth.can("organization.members.manage")
                ? [
                    {
                      id: "edit",
                      label: copy.edit,
                      icon: <Pencil size={16} />,
                      onClick: (member) => {
                        update.reset();
                        setMemberRole(member.roles[0] ?? assignableRoles[0]);
                        setEditingMember(member);
                      },
                    },
                    {
                      id: "activate",
                      label: copy.activate,
                      icon: <ShieldCheck size={16} />,
                      visible: (member) => member.status !== "ACTIVE",
                      onClick: (member) => update.mutate({ id: member.user.id, status: "ACTIVE" }),
                    },
                    {
                      id: "suspend",
                      label: copy.suspend,
                      icon: <ShieldOff size={16} />,
                      visible: (member) => member.status === "ACTIVE",
                      onClick: (member) =>
                        void modal
                          .confirm({
                            title: copy.suspendMembershipTitle,
                            description: copy.suspendMembershipDescription(
                              displayName(member.user),
                            ),
                            tone: "danger",
                            confirmLabel: copy.disableAccounts,
                            showCancel: true,
                          })
                          .then(
                            (confirmed) =>
                              confirmed &&
                              update.mutate({ id: member.user.id, status: "INACTIVE" }),
                          ),
                    },
                    {
                      id: "remove",
                      label: copy.removeMember,
                      icon: <Trash2 size={16} />,
                      tone: "danger",
                      onClick: (member) =>
                        void modal
                          .confirm({
                            title: copy.removeMembershipTitle,
                            description: copy.removeMembershipDescription(displayName(member.user)),
                            tone: "danger",
                            confirmLabel: copy.removeMembership,
                            showCancel: true,
                          })
                          .then((confirmed) => confirmed && remove.mutate(member.user.id)),
                    },
                  ]
                : []
            }
          />
        </Card>

        {/* ── Relationships ───────────────────────────────────────── */}
        <Card className="min-w-0 p-3 sm:p-5">
          <SectionHeader
            icon={<Link2 size={18} />}
            title={copy.relationships}
            description={
              pendingCount
                ? copy.pendingRelationshipCount(pendingCount, language === "fa" ? "fa-IR" : "en-US")
                : copy.relationshipsDescription
            }
            action={
              <Button
                disabled={
                  !auth.can("relationships.manage") ||
                  members.isLoading ||
                  members.isError ||
                  relationshipStudents.isLoading ||
                  relationshipStudents.isError
                }
                onClick={() =>
                  modal.open({
                    title: copy.newRelationship,
                    description: copy.newRelationshipDescription,
                    size: "md",
                    content: (
                      <RelationshipCreateForm
                        members={members.data ?? []}
                        students={relationshipStudents.data ?? []}
                        onSubmit={(body) => createLink.mutateAsync({ ...body, organizationId })}
                      />
                    ),
                  })
                }
              >
                <Link2 size={16} />
                {copy.newRelationship}
              </Button>
            }
          />

          {relationships.isLoading ? (
            <div className="grid gap-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : relationships.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-900 dark:bg-rose-950/40"
            >
              <p className="text-sm text-rose-700 dark:text-rose-300">{copy.relationshipsFailed}</p>
              <Button variant="soft" className="mt-2" onClick={() => relationships.refetch()}>
                {copy.retry}
              </Button>
            </div>
          ) : !relevant.length ? (
            <EmptyState title={copy.noRelationships} description={copy.noRelationshipsHint} />
          ) : (
            <ul className="grid gap-2">
              {relevant.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <UserRound size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
                        <strong className="truncate">{displayName(item.fromUser)}</strong>
                        <span className="text-slate-400">←</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          <GraduationCap size={13} className="text-slate-400" />
                          {item.student.name}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {copy.relationTypeLabel(item.type)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                            statusTones[item.status] || ""
                          }`}
                        >
                          {copy.relationshipStatus(item.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    {item.status === "PENDING" ? (
                      <>
                        <Button
                          variant="soft"
                          loading={decide.isPending}
                          onClick={() =>
                            void modal
                              .confirm({
                                title: copy.rejectRelationshipTitle,
                                description: copy.rejectRelationshipDescription,
                                tone: "danger",
                                confirmLabel: copy.rejectRelationship,
                              })
                              .then(
                                (confirmed) =>
                                  confirmed && decide.mutate({ id: item.id, action: "reject" }),
                              )
                          }
                        >
                          <X size={14} />
                          {copy.reject}
                        </Button>
                        <Button
                          loading={decide.isPending}
                          onClick={() => decide.mutate({ id: item.id, action: "accept" })}
                        >
                          <Check size={14} />
                          {copy.approve}
                        </Button>
                      </>
                    ) : (
                      <>
                        {item.type === "GUARDIAN_OF" && auth.can("system.manage") ? (
                          <Button
                            variant="soft"
                            loading={guardianOverride.isPending}
                            onClick={() => guardianOverride.mutate(item.student.id)}
                          >
                            {copy.allowGuardianChange}
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          loading={revokeLink.isPending}
                          onClick={() =>
                            void modal
                              .confirm({
                                title: copy.revokeRelationshipTitle,
                                description: copy.revokeRelationshipDescription(
                                  displayName(item.fromUser),
                                  item.student.name,
                                ),
                                tone: "danger",
                                confirmLabel: copy.revokeRelationship,
                              })
                              .then((confirmed) => confirmed && revokeLink.mutate(item.id))
                          }
                        >
                          <Trash2 size={14} />
                          {copy.revokeRelationship}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function OrganizationSignupControl({
  delegated,
  enabled: initialEnabled,
  limit: initialLimit,
  used,
  pending,
  onSave,
}: {
  delegated: boolean;
  enabled: boolean;
  limit: number;
  used: number;
  pending: boolean;
  onSave(body: { enabled: boolean; limit: number }): void;
}) {
  const { language } = useLocale();
  const fa = language === "fa";
  const [enabled, setEnabled] = useState(initialEnabled);
  const [limit, setLimit] = useState(initialLimit);
  if (!delegated)
    return (
      <Card className="border-dashed p-4">
        <h3 className="font-bold">{fa ? "ثبت‌نام مستقیم دانش‌آموز" : "Student self-signup"}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {fa
            ? "مدیر پلتفرم هنوز مدیریت ثبت‌نام را به این سازمان واگذار نکرده است. دانش‌آموزان باید اطلاعات خود را به سازمان بدهند."
            : "The platform administrator has not delegated signup management. Students should provide their details to the organization."}
        </p>
      </Card>
    );
  return (
    <Card className="p-4">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ enabled, limit });
        }}
      >
        <div>
          <h3 className="font-bold">{fa ? "ثبت‌نام مستقیم دانش‌آموز" : "Student self-signup"}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {fa ? `${used} از ${limit} ظرفیت استفاده شده است.` : `${used} of ${limit} places used.`}
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {fa ? "اجازه ساخت حساب برای دانش‌آموز" : "Allow students to create accounts"}
          </label>
        </div>
        <Field label={fa ? "ظرفیت" : "Capacity"}>
          <Input
            type="number"
            min={0}
            max={100000}
            step={1}
            required
            disabled={pending}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
        </Field>
        <Button size="sm" loading={pending}>
          {fa ? "ذخیره" : "Save"}
        </Button>
      </form>
    </Card>
  );
}

function RelationshipCreateForm({
  members,
  students,
  onSubmit,
}: {
  members: OrganizationMember[];
  students: RelationshipStudent[];
  onSubmit: (
    body: Omit<Parameters<typeof createRelationship>[0], "organizationId">,
  ) => Promise<unknown>;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  const [fromUserId, setFromUserId] = useState("");
  const [toStudentId, setToStudentId] = useState("");
  const [type, setType] = useState<Parameters<typeof createRelationship>[0]["type"]>("GUARDIAN_OF");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const eligibleMembers = members.filter(
    (member) => member.status === "ACTIVE" && member.roles.some((role) => role !== "STUDENT"),
  );

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
          await onSubmit({ fromUserId, toStudentId, type });
        } catch {
          setError(copy.relationCreateFailed);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <p className="text-sm text-slate-500">
        {language === "fa"
          ? "۱. عضو سازمان را انتخاب کنید. ۲. دانش‌آموز و نوع ارتباط را مشخص کنید."
          : "1. Choose an organization member. 2. Select the student and relationship type."}
      </p>
      {!eligibleMembers.length || !students.length ? (
        <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
          {language === "fa"
            ? "ابتدا یک عضو فعال و یک دانش‌آموز به سازمان اضافه کنید."
            : "Add an active member and a student to this organization first."}
        </p>
      ) : null}
      <Field label={copy.relatedUser}>
        <Select required value={fromUserId} onChange={(event) => setFromUserId(event.target.value)}>
          <option value="">{copy.selectUser}</option>
          {eligibleMembers.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {displayName(member.user)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={copy.student}>
        <Select
          required
          value={toStudentId}
          onChange={(event) => setToStudentId(event.target.value)}
        >
          <option value="">{copy.selectStudent}</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={copy.relationType}>
        <Select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
          <option value="GUARDIAN_OF">{copy.relationTypeLabel("GUARDIAN_OF")}</option>
          <option value="ADVISOR_OF">{copy.relationTypeLabel("ADVISOR_OF")}</option>
          <option value="TEACHER_OF">{copy.relationTypeLabel("TEACHER_OF")}</option>
          <option value="MENTOR_OF">{copy.relationTypeLabel("MENTOR_OF")}</option>
        </Select>
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button loading={isSubmitting} disabled={!fromUserId || !toStudentId}>
          {copy.newRelationship}
        </Button>
      </div>
    </form>
  );
}
