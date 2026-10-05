import { useState, type ComponentProps } from "react";
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
import { useModal } from "../../shared/ui/modal";
import { notify } from "../../shared/ui/notifications";
import { useLocale } from "../../shared/ui/locale";
import { Button, Card, EmptyState, Field, Input, Select } from "../../shared/ui/ui";
import { AdminDataTable } from "../../shared/ui/admin-data-table";
import { CollectionToolbar } from "../../shared/ui/collection-toolbar";
import {
  ManagementPageHeader,
  ManagementMasterDetail,
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
  getPlatformStudentSignupPolicy,
  setPlatformStudentSignupPolicy,
  setOrganizationStudentSignupPolicy,
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

const nameOf = (user: PortalUser) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
const errorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function OrganizationsPage() {
  const auth = useAuth(),
    modal = useModal(),
    qc = useQueryClient();
  const { language, profile } = useLocale();
  const copy = accessCopy[language];
  const isPlatform = auth.hasRole("PLATFORM_ADMIN"),
    canManage = isPlatform && auth.can("organization.manage");
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: listOrganizations });
  const [search, setSearch] = useState(""),
    [draft, setDraft] = useState({ name: "", type: "SCHOOL" }),
    [editing, setEditing] = useState<PortalOrganization | null>(null),
    [creating, setCreating] = useState(false),
    [selectedId, setSelectedId] = useState(auth.context?.activeOrganization?.id ?? "");
  const refresh = () => qc.invalidateQueries({ queryKey: ["organizations"] });
  const signupPolicy = useQuery({ queryKey: ["platform-student-signup-policy"], queryFn: getPlatformStudentSignupPolicy, enabled: canManage });
  const setPlatformSignup = useMutation({ mutationFn: setPlatformStudentSignupPolicy, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["platform-student-signup-policy"] }); notify(language === "fa" ? "تنظیم سراسری ثبت‌نام ذخیره شد." : "Global signup setting saved."); } });
  const setOrganizationSignup = useMutation({ mutationFn: ({ id, body }: { id: string; body: { managedByOrganization?: boolean; enabled?: boolean; limit?: number } }) => setOrganizationStudentSignupPolicy(id, body), onSuccess: refresh });
  const create = useMutation({
    mutationFn: (body: { name: string; type: string; studentSignupManagedByOrganization?: boolean; studentSignupEnabled?: boolean; studentSignupLimit?: number }) => createOrganization(body),
    onSuccess: async () => {
      setDraft({ name: "", type: "SCHOOL" });
      setCreating(false);
      notify(copy.organizationCreated);
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: (org: PortalOrganization) =>
      updateOrganization(org.id, { name: org.name, type: org.type, status: org.status }),
    onSuccess: async () => {
      setEditing(null);
      notify(copy.organizationSaved);
      await refresh();
    },
  });
  const archive = useMutation({
    mutationFn: archiveOrganization,
    onSuccess: async () => {
      await refresh();
      notify(copy.organizationArchived);
    },
  });
  const setEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setOrganizationEnabled(id, enabled),
    onSuccess: async (_, { enabled }) => {
      notify(enabled ? copy.organizationEnabled : copy.organizationDisabled);
      await refresh();
    },
  });
  const setFeatures = useMutation({
    mutationFn: ({
      id,
      enabledFeatures,
    }: {
      id: string;
      enabledFeatures: (typeof organizationFeatures)[number][0][];
    }) => setOrganizationFeatures(id, enabledFeatures),
    onSuccess: async () => {
      modal.close();
      notify(copy.featuresUpdated);
      await refresh();
    },
  });
  const filtered = (organizations.data || []).filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selected = (organizations.data || []).find((item) => item.id === selectedId);
  const selectedEnabledFeatureCount = selected
    ? organizationFeatures.length - (selected.disabledFeatures || []).length
    : 0;
  const activate = (org: PortalOrganization) =>
    auth.setActiveOrganization({
      id: org.id,
      membershipId: "",
      name: org.name,
      type: org.type,
    } as OrganizationSummary);
  const openFeatures = (organization: PortalOrganization) =>
    modal.open({
      title: copy.organizationFeatures(organization.name),
      description: copy.featureDialogDescription,
      size: "lg",
      content: (
        <OrganizationFeatureSettings
          organization={organization}
          pending={setFeatures.isPending}
          onChange={(enabledFeatures) =>
            setFeatures.mutate({ id: organization.id, enabledFeatures })
          }
        />
      ),
    });
  const openEditor = (organization?: PortalOrganization) =>
    modal.open({
      title: organization ? copy.editOrganization(organization.name) : copy.newOrganization,
      description: organization
        ? copy.editOrganizationDescription
        : copy.newOrganizationDescription,
      size: "md",
      content: (
        <OrganizationEditor
          organization={organization}
          onSubmit={async (value) => {
            if (organization) await update.mutateAsync({ ...organization, ...value });
            else await create.mutateAsync(value);
            modal.close();
          }}
        />
      ),
    });
  return (
    <div className="grid gap-5">
      <AccessFlowGuidance scope="organizations" canManage={canManage} />
      {canManage ? <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">{language === "fa" ? "ثبت‌نام مستقیم دانش‌آموز" : "Student self-signup"}</h2><p className="mt-1 text-xs text-slate-500">{language === "fa" ? "کنترل سراسری؛ هر سازمان نیز باید ظرفیت و دسترسی خودش را فعال کند." : "Global gate; each organization must also enable its own capacity."}</p></div><button type="button" role="switch" aria-checked={Boolean(signupPolicy.data?.enabled)} disabled={signupPolicy.isLoading || setPlatformSignup.isPending} onClick={() => setPlatformSignup.mutate(!signupPolicy.data?.enabled)} className={`relative h-6 w-11 rounded-full ${signupPolicy.data?.enabled ? "bg-brand" : "bg-slate-300"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow ${signupPolicy.data?.enabled ? "start-1" : "end-1"}`} /></button></div></Card> : null}
      <section className="w-full" aria-label={copy.organizationListTools}>
        <ManagementSummaryBar
          action={
            canManage ? (
              <Button onClick={() => openEditor()}>
                <Plus size={16} />
                {copy.newOrganization}
              </Button>
            ) : null
          }
        >
          <div className="flex w-full flex-wrap items-end gap-3">
            <ManagementStat label={copy.allOrganizations} value={organizations.data?.length ?? 0} />
            <ManagementStat
              label={copy.active}
              value={organizations.data?.filter((x) => x.status === "ACTIVE").length ?? 0}
              tone="success"
            />
            <ManagementStat
              label={copy.archived}
              value={organizations.data?.filter((x) => x.status === "ARCHIVED").length ?? 0}
            />

            <div className="min-w-[260px] flex-1 self-end">
              <CollectionToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder={copy.searchOrganizations}
                resultLabel={copy.resultCount(filtered.length, profile.locale)}
                onClear={search ? () => setSearch("") : undefined}
              />
            </div>
          </div>
        </ManagementSummaryBar>
      </section>
      <ManagementMasterDetail
        detailWidth="minmax(460px,1.1fr)"
        directory={
          <Card aria-label={copy.organizationList}>
            {organizations.isLoading ? (
              <LoadingRows />
            ) : organizations.isError ? (
              <Retry message={copy.organizationsFailed} retry={() => organizations.refetch()} />
            ) : !filtered.length ? (
              <div className="p-6">
                <EmptyState
                  title={emptyAccessResult("organizations", Boolean(search), language)}
                  action={
                    search ? (
                      <Button variant="soft" onClick={() => setSearch("")}>
                        {copy.clearSearch}
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((org) => (
                  <article
                    key={org.id}
                    className={`p-4 transition ${selectedId === org.id ? "bg-brand/5" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"}`}
                  >
                    {editing?.id === org.id ? (
                      <form
                        className="grid gap-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          update.mutate(editing);
                        }}
                      >
                        <Field label={copy.organizationName}>
                          <Input
                            required
                            value={editing.name}
                            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                          />
                        </Field>
                        <OrganizationTypeField
                          value={editing.type}
                          onChange={(type) => setEditing({ ...editing, type })}
                        />
                        <Field label={copy.accountStatus}>
                          <Select
                            value={editing.status}
                            onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                          >
                            <option value="ACTIVE">{copy.activeStatus}</option>
                            <option value="INACTIVE">{copy.inactiveStatus}</option>
                            <option value="ARCHIVED">{copy.archivedStatus}</option>
                          </Select>
                        </Field>
                        <div className="flex gap-2">
                          <Button loading={update.isPending}>{copy.save}</Button>
                          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                            {copy.cancel}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                            <Building2 size={19} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate font-black">{org.name}</h2>
                              <StatusPill status={org.status} />
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {copy.organizationType(org.type)}
                              {org.status !== "ARCHIVED"
                                ? ` · ${copy.enabledFeatureCount(organizationFeatures.length - (org.disabledFeatures || []).length, profile.locale)}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <IconAction
                              label={
                                selectedId === org.id
                                  ? copy.selectedWorkspace
                                  : copy.openWorkspace(org.name)
                              }
                              active={selectedId === org.id}
                              disabled={org.status === "ARCHIVED"}
                              onClick={() => setSelectedId(org.id)}
                            >
                              <CheckCircle2 size={17} />
                            </IconAction>
                            {auth.context?.activeOrganization?.id !== org.id &&
                            org.status === "ACTIVE" ? (
                              <IconAction
                                label={copy.selectWorkspace(org.name)}
                                onClick={() => activate(org)}
                              >
                                <Building2 size={17} />
                              </IconAction>
                            ) : null}
                            {canManage ? (
                              <>
                                <IconAction
                                  label={copy.editOrganization(org.name)}
                                  onClick={() => openEditor(org)}
                                >
                                  <Pencil size={17} />
                                </IconAction>
                                {org.status !== "ARCHIVED" ? (
                                  <IconAction
                                    label={
                                      org.status === "ACTIVE"
                                        ? copy.deactivateOrganization(org.name)
                                        : copy.activateOrganization(org.name)
                                    }
                                    tone={org.status === "ACTIVE" ? "danger" : "primary"}
                                    loading={
                                      setEnabled.isPending && setEnabled.variables?.id === org.id
                                    }
                                    disabled={setEnabled.isPending}
                                    onClick={() =>
                                      void modal
                                        .confirm({
                                          title:
                                            org.status === "ACTIVE"
                                              ? copy.deactivateOrganizationTitle
                                              : copy.activateOrganizationTitle,
                                          description:
                                            org.status === "ACTIVE"
                                              ? copy.deactivateOrganizationDescription(org.name)
                                              : copy.activateOrganizationDescription(org.name),
                                          confirmLabel:
                                            org.status === "ACTIVE"
                                              ? copy.disableAccounts
                                              : copy.activateAccounts,
                                          tone: org.status === "ACTIVE" ? "danger" : undefined,
                                          showCancel: true,
                                        })
                                        .then(
                                          (confirmed) =>
                                            confirmed &&
                                            setEnabled.mutate({
                                              id: org.id,
                                              enabled: org.status !== "ACTIVE",
                                            }),
                                        )
                                    }
                                  >
                                    <Power size={17} />
                                  </IconAction>
                                ) : null}
                                {org.status !== "ARCHIVED" ? (
                                  <IconAction
                                    label={copy.archiveOrganization(org.name)}
                                    tone="danger"
                                    loading={archive.isPending && archive.variables === org.id}
                                    onClick={async () => {
                                      if (
                                        await modal.confirm({
                                          title: copy.archiveOrganizationTitle,
                                          description: copy.archiveOrganizationDescription(
                                            org.name,
                                          ),
                                          confirmLabel: copy.archive,
                                          confirmationText: copy.archive,
                                          tone: "danger",
                                          cancelLabel: copy.cancel,
                                          showCancel: true,
                                        })
                                      )
                                        archive.mutate(org.id);
                                    }}
                                  >
                                    <Archive size={17} />
                                  </IconAction>
                                ) : (
                                  <IconAction
                                    label={copy.restoreOrganization(org.name)}
                                    onClick={() =>
                                      void modal
                                        .confirm({
                                          title: copy.restoreOrganizationTitle,
                                          description: copy.restoreOrganizationDescription(
                                            org.name,
                                          ),
                                          confirmLabel: copy.restoreOrganization(org.name),
                                          confirmationText: copy.restoreOrganization(org.name),
                                          showCancel: true,
                                        })
                                        .then(
                                          (confirmed) =>
                                            confirmed &&
                                            update.mutate({ ...org, status: "ACTIVE" }),
                                        )
                                    }
                                  >
                                    <RotateCcw size={17} />
                                  </IconAction>
                                )}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Card>
        }
        detail={
          <div aria-label={copy.selectedOrganizationDetails}>
            {selected && canManage && selected.status !== "ARCHIVED" ? (
              <Card className="mb-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black">{copy.organizationFeatures(selected.name)}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {copy.enabledFeaturesOf(
                        selectedEnabledFeatureCount,
                        organizationFeatures.length,
                        profile.locale,
                      )}
                    </p>
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => openFeatures(selected)}
                    title={copy.manageOrganizationFeatures}
                  >
                    {copy.manageFeatures}
                  </Button>
                </div>
              </Card>
            ) : null}
            {selected && canManage && selected.status !== "ARCHIVED" ? <Card className="mb-4 p-4"><StudentSignupSettings organization={selected} pending={setOrganizationSignup.isPending} onSave={(body) => setOrganizationSignup.mutate({ id: selected.id, body })} /></Card> : null}
            {selected &&
            auth.can("organization.members.manage") &&
            selected.status !== "ARCHIVED" ? (
              <OrganizationWorkspace
                organizationId={selected.id}
                organizationName={selected.name}
                studentSignupManagedByOrganization={selected.studentSignupManagedByOrganization}
                studentSignupEnabled={selected.studentSignupEnabled}
                studentSignupLimit={selected.studentSignupLimit}
                studentSignupCount={selected.studentSignupCount}
              />
            ) : (
              <Card className="p-6">
                <EmptyState
                  title={
                    selected?.status === "ARCHIVED"
                      ? copy.archivedOrganizationUnavailable
                      : copy.selectOrganizationToManage
                  }
                />
              </Card>
            )}
          </div>
        }
      />
    </div>
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
function OrganizationEditor({
  organization,
  onSubmit,
}: {
  organization?: PortalOrganization;
  onSubmit: (value: { name: string; type: string; studentSignupManagedByOrganization?: boolean; studentSignupEnabled?: boolean; studentSignupLimit?: number }) => Promise<void>;
}) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = accessCopy[language];
  const [name, setName] = useState(organization?.name ?? "");
  const [type, setType] = useState(organization?.type ?? "SCHOOL");
  const [managedByOrganization, setManagedByOrganization] = useState(organization?.studentSignupManagedByOrganization ?? false);
  const [studentSignupEnabled, setStudentSignupEnabled] = useState(organization?.studentSignupEnabled ?? false);
  const [studentSignupLimit, setStudentSignupLimit] = useState(organization?.studentSignupLimit ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        void onSubmit({ name, type, studentSignupManagedByOrganization: managedByOrganization, studentSignupEnabled, studentSignupLimit })
          .catch((reason) => setError(errorText(reason, copy.organizationSaveFailed)))
          .finally(() => setSubmitting(false));
      }}
    >
      <Field label={copy.organizationName}>
        <Input
          required
          minLength={2}
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <OrganizationTypeField value={type} onChange={setType} />
      {!organization ? <StudentSignupFields managedByOrganization={managedByOrganization} enabled={studentSignupEnabled} limit={studentSignupLimit} onManagedChange={setManagedByOrganization} onEnabledChange={setStudentSignupEnabled} onLimitChange={setStudentSignupLimit} /> : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="soft" onClick={modal.close}>
          {copy.cancel}
        </Button>
        <Button loading={submitting}>
          {organization ? copy.saveChanges : copy.createOrganization}
        </Button>
      </div>
    </form>
  );
}
function OrganizationFeatureSettings({
  organization,
  pending,
  onChange,
}: {
  organization: PortalOrganization;
  pending: boolean;
  onChange: (features: (typeof organizationFeatures)[number][0][]) => void;
}) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = accessCopy[language];
  const disabled = organization.disabledFeatures || [];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {organizationFeatures.map(([code, label]) => {
        const enabled = !disabled.includes(code);
        const next = organizationFeatures
          .filter(([feature]) => (feature === code ? !enabled : !disabled.includes(feature)))
          .map(([feature]) => feature);
        const apply = () => onChange(next);
        return (
          <div
            key={code}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
          >
            <span className="font-medium text-sm">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={enabled ? copy.disableFeature(label) : copy.enableFeature(label)}
              title={enabled ? copy.disableFeature(label) : copy.enableFeature(label)}
              disabled={pending}
              onClick={() => {
                if (!enabled) {
                  apply();
                  return;
                }
                void modal
                  .confirm({
                    title: copy.disableFeatureTitle(label),
                    description: copy.disableFeatureDescription(organization.name, label),
                    confirmLabel: copy.disableAccounts,
                    confirmationText: copy.disable,
                    tone: "danger",
                  })
                  .then((confirmed) => confirmed && apply());
              }}
              className={`relative h-6 w-11 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${enabled ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <span
                className={`absolute top-1 size-4 rounded-full bg-white shadow transition-[inset-inline-start] ${enabled ? "start-1" : "end-1"}`}
                aria-hidden="true"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StudentSignupFields({ managedByOrganization, enabled, limit, onManagedChange, onEnabledChange, onLimitChange }: { managedByOrganization: boolean; enabled: boolean; limit: number; onManagedChange(value: boolean): void; onEnabledChange(value: boolean): void; onLimitChange(value: number): void }) {
  const { language } = useLocale();
  const fa = language === "fa";
  return <fieldset className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><legend className="px-1 text-sm font-bold">{fa ? "ثبت‌نام دانش‌آموز" : "Student signup"}</legend><label className="flex items-center justify-between gap-3 text-sm"><span><b>{fa ? "واگذاری به مدیر سازمان" : "Delegate to organization admin"}</b><small className="block text-slate-500">{fa ? "مدیر سازمان می‌تواند ظرفیت و دسترسی را تغییر دهد." : "The organization admin can manage availability and capacity."}</small></span><input type="checkbox" checked={managedByOrganization} onChange={(event) => onManagedChange(event.target.checked)} /></label><label className="flex items-center justify-between gap-3 text-sm"><span>{fa ? "فعال‌سازی ثبت‌نام مستقیم" : "Enable direct signup"}</span><input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} /></label><Field label={fa ? "ظرفیت ثبت‌نام مستقیم" : "Direct-signup capacity"}><Input type="number" min={0} max={100000} value={limit} onChange={(event) => onLimitChange(Math.max(0, Number(event.target.value) || 0))} /></Field></fieldset>;
}

function StudentSignupSettings({ organization, pending, onSave }: { organization: PortalOrganization; pending: boolean; onSave(body: { managedByOrganization?: boolean; enabled?: boolean; limit?: number }): void }) {
  const { language } = useLocale();
  const fa = language === "fa";
  const [managed, setManaged] = useState(Boolean(organization.studentSignupManagedByOrganization));
  const [enabled, setEnabled] = useState(Boolean(organization.studentSignupEnabled));
  const [limit, setLimit] = useState(organization.studentSignupLimit ?? 0);
  return <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSave({ managedByOrganization: managed, enabled, limit }); }}><div><h2 className="font-black">{fa ? "دسترسی ثبت‌نام دانش‌آموز" : "Student signup access"}</h2><p className="mt-1 text-xs text-slate-500">{fa ? `${organization.studentSignupCount ?? 0} از ${organization.studentSignupLimit ?? 0} ظرفیت استفاده شده است.` : `${organization.studentSignupCount ?? 0} of ${organization.studentSignupLimit ?? 0} places used.`}</p></div><StudentSignupFields managedByOrganization={managed} enabled={enabled} limit={limit} onManagedChange={setManaged} onEnabledChange={setEnabled} onLimitChange={setLimit} /><div className="flex justify-end"><Button size="sm" loading={pending}>{fa ? "ذخیره تنظیمات ثبت‌نام" : "Save signup settings"}</Button></div></form>;
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
