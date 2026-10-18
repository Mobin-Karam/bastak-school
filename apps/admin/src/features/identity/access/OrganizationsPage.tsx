import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Building2,
  CheckCircle2,
  MoreHorizontal,
  SlidersHorizontal,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../auth";
import type { OrganizationSummary } from "../../../shared/types/domain";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import { Button, Card, EmptyState, Field, Input, Select } from "../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../shared/ui/responsive-drawer";
import { OrganizationProfileEditor } from "./components/OrganizationProfileEditor";
import { OrganizationStudentAccounts } from "./components/OrganizationStudentAccounts";
import { ViewportPopover } from "../../../shared/ui/popover";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import {
  archiveOrganization,
  createOrganization,
  listOrganizations,
  setOrganizationEnabled,
  organizationFeatures,
  setOrganizationFeatures,
  getPlatformStudentSignupPolicy,
  setPlatformStudentSignupPolicy,
  setOrganizationStudentSignupPolicy,
  updateOrganization,
  type PortalOrganization,
} from "./api/access.api.ts";
import { OrganizationWorkspace } from "./OrganizationWorkspace";
import { AccessFlowGuidance } from "./components/AccessFlowGuidance";
import { emptyAccessResult } from "./model/access-flow";
import { accessCopy } from "./model/access-copy";
import {
  organizationTypes,
  type AdminOrganizationType,
} from "../../../shared/lib/organization-role-policy";

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function OrganizationsPage() {
  const auth = useAuth(),
    modal = useModal(),
    qc = useQueryClient();
  const { language, profile } = useLocale();
  const copy = accessCopy[language];
  const canEditProfile = auth.can("organization.manage");
  const canManage = canEditProfile && auth.can("system.manage");
  const fa = language === "fa";
  const organizations = useQuery({
    queryKey: [
      "organizations",
      auth.context?.user?.id,
      auth.activeRole,
      auth.context?.activeOrganization?.id,
    ],
    queryFn: listOrganizations,
  });
  const [search, setSearch] = useState(""),
    [selectedId, setSelectedId] = useState(auth.context?.activeOrganization?.id ?? "");
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    stepHeading.current?.focus();
  }, [step]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sort, setSort] = useState("NAME");
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const reportError = (error: unknown) =>
    notify(errorText(error, copy.organizationSaveFailed), "error");
  const refresh = () => qc.invalidateQueries({ queryKey: ["organizations"] });
  const signupPolicy = useQuery({
    queryKey: ["platform-student-signup-policy"],
    queryFn: getPlatformStudentSignupPolicy,
    enabled: canManage,
  });
  const setPlatformSignup = useMutation({
    mutationFn: setPlatformStudentSignupPolicy,
    onError: reportError,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["platform-student-signup-policy"] });
      notify(language === "fa" ? "تنظیم سراسری ثبت‌نام ذخیره شد." : "Global signup setting saved.");
    },
  });
  const setOrganizationSignup = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { managedByOrganization?: boolean; enabled?: boolean; limit?: number };
    }) => setOrganizationStudentSignupPolicy(id, body),
    onError: reportError,
    onSuccess: async () => {
      await refresh();
      notify(language === "fa" ? "تنظیمات ثبت‌نام ذخیره شد." : "Signup settings saved.");
    },
  });
  const create = useMutation({
    mutationFn: (body: {
      name: string;
      type: AdminOrganizationType;
      studentSignupManagedByOrganization?: boolean;
      studentSignupEnabled?: boolean;
      studentSignupLimit?: number;
    }) => createOrganization(body),
    onSuccess: async (organization) => {
      setSelectedId(organization.id);
      setStep(0);
      notify(copy.organizationCreated);
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: (org: PortalOrganization) =>
      updateOrganization(org.id, { name: org.name, type: org.type, status: org.status }),
    onError: reportError,
    onSuccess: async () => {
      notify(copy.organizationSaved);
      await refresh();
    },
  });
  const archive = useMutation({
    mutationFn: archiveOrganization,
    onError: reportError,
    onSuccess: async () => {
      await refresh();
      notify(copy.organizationArchived);
    },
  });
  const setEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setOrganizationEnabled(id, enabled),
    onError: reportError,
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
  const hasFilters = Boolean(search || statusFilter !== "ALL" || typeFilter !== "ALL");
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  };
  const filtered = (organizations.data || [])
    .filter(
      (item) =>
        `${item.name} ${item.id}`.toLowerCase().includes(search.trim().toLowerCase()) &&
        (statusFilter === "ALL" ||
          (statusFilter === "INACTIVE"
            ? ["INACTIVE", "DISABLED"].includes(item.status)
            : item.status === statusFilter)) &&
        (typeFilter === "ALL" || item.type === typeFilter),
    )
    .sort((a, b) =>
      sort === "CAPACITY"
        ? Math.max(0, (b.studentSignupLimit ?? 0) - (b.studentSignupCount ?? 0)) -
            Math.max(0, (a.studentSignupLimit ?? 0) - (a.studentSignupCount ?? 0)) ||
          a.name.localeCompare(b.name, profile.locale)
        : a.name.localeCompare(b.name, profile.locale),
    );
  const selected = canManage
    ? organizations.data?.find((item) => item.id === selectedId)
    : (organizations.data?.find((item) => item.id === auth.context?.activeOrganization?.id) ??
      organizations.data?.find((item) => item.id === selectedId) ??
      organizations.data?.[0]);
  const selectedEnabledFeatureCount = selected
    ? organizationFeatures.filter(([code]) => !selected.disabledFeatures?.includes(code)).length
    : 0;
  const activate = async (org: PortalOrganization) => {
    setSwitchingId(org.id);
    try {
      await auth.setActiveOrganization({
        id: org.id,
        membershipId: "",
        name: org.name,
        type: org.type,
      } as OrganizationSummary);
      setSelectedId(org.id);
    } catch (error) {
      reportError(error);
    } finally {
      setSwitchingId(null);
    }
  };
  const openSignup = (organization: PortalOrganization) => {
    setDirectoryOpen(false);
    modal.open({
      title: fa ? "دسترسی ثبت‌نام دانش‌آموز" : "Student signup access",
      description: organization.name,
      size: "md",
      content: (
        <StudentSignupSettings
          organization={organization}
          platform={canManage}
          onSave={async (body) => {
            await setOrganizationSignup.mutateAsync({
              id: organization.id,
              body: canManage ? body : { enabled: body.enabled, limit: body.limit },
            });
            modal.close();
          }}
        />
      ),
    });
  };
  const openFeatures = (organization: PortalOrganization) => {
    setDirectoryOpen(false);
    modal.open({
      title: copy.organizationFeatures(organization.name),
      description: copy.featureDialogDescription,
      size: "lg",
      content: (
        <OrganizationFeatureSettings
          organization={organization}
          onSave={(enabledFeatures) =>
            setFeatures.mutateAsync({ id: organization.id, enabledFeatures })
          }
        />
      ),
    });
  };
  const openEditor = (organization?: PortalOrganization) => {
    setDirectoryOpen(false);
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
  };
  const directory = (
    <Card aria-label={copy.organizationList}>
      {organizations.isLoading ? (
        <LoadingRows />
      ) : organizations.isError ? (
        <Retry message={copy.organizationsFailed} retry={() => organizations.refetch()} />
      ) : !filtered.length ? (
        <div className="p-6">
          <EmptyState
            title={emptyAccessResult("organizations", hasFilters, language)}
            action={
              hasFilters ? (
                <Button variant="soft" onClick={clearFilters}>
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
              className={`p-5 transition ${selectedId === org.id ? "bg-brand/5" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Building2 size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-black">{org.name}</h2>
                    <StatusPill status={org.status} />
                    {auth.context?.activeOrganization?.id === org.id ? (
                      <span className="rounded-full bg-brand/10 px-2 py-1 text-[11px] font-bold text-brand">
                        {fa ? "فضای کاری فعلی" : "Current workspace"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {copy.organizationType(org.type)}
                    {org.status !== "ARCHIVED"
                      ? ` · ${copy.enabledFeatureCount(organizationFeatures.filter(([code]) => !org.disabledFeatures?.includes(code)).length, profile.locale)}`
                      : ""}
                  </p>
                </div>
                <div className="w-full rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      {fa ? "ثبت‌نام مستقیم" : "Direct signup"} ·{" "}
                      {org.studentSignupEnabled
                        ? fa
                          ? "فعال"
                          : "Enabled"
                        : fa
                          ? "بسته"
                          : "Closed"}
                    </span>
                    <span className="font-bold tabular-nums">
                      {(org.studentSignupCount ?? 0).toLocaleString(profile.locale)} /{" "}
                      {(org.studentSignupLimit ?? 0).toLocaleString(profile.locale)}
                    </span>
                  </div>
                  <progress
                    aria-label={
                      fa ? `ظرفیت ثبت‌نام ${org.name}` : `Signup capacity for ${org.name}`
                    }
                    max={Math.max(1, org.studentSignupLimit ?? 0)}
                    value={Math.min(
                      org.studentSignupCount ?? 0,
                      Math.max(1, org.studentSignupLimit ?? 0),
                    )}
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full accent-brand"
                  />
                </div>
                <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto">
                  <IconAction
                    label={
                      selectedId === org.id ? copy.selectedWorkspace : copy.openWorkspace(org.name)
                    }
                    active={selectedId === org.id}
                    onClick={() => {
                      if (canManage) setSelectedId(org.id);
                      else void activate(org);
                      setDirectoryOpen(false);
                    }}
                  >
                    <CheckCircle2 size={17} />
                    {fa ? "فضای کاری" : "Workspace"}
                  </IconAction>
                  {auth.context?.activeOrganization?.id !== org.id && org.status === "ACTIVE" ? (
                    <IconAction
                      label={copy.selectWorkspace(org.name)}
                      loading={switchingId === org.id}
                      disabled={switchingId !== null}
                      onClick={() => void activate(org)}
                    >
                      <Building2 size={17} />
                      {fa ? "ورود" : "Switch"}
                    </IconAction>
                  ) : null}
                  {canManage ? (
                    <OrganizationActions
                      label={fa ? `عملیات ${org.name}` : `Actions for ${org.name}`}
                    >
                      {org.status !== "ARCHIVED" ? (
                        <>
                          <IconAction label={copy.manageFeatures} onClick={() => openFeatures(org)}>
                            <SlidersHorizontal size={17} />
                          </IconAction>
                          <IconAction
                            label={fa ? "تنظیمات ثبت‌نام" : "Signup settings"}
                            onClick={() => openSignup(org)}
                          >
                            <ShieldCheck size={17} />
                          </IconAction>
                        </>
                      ) : null}
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
                          loading={setEnabled.isPending && setEnabled.variables?.id === org.id}
                          disabled={setEnabled.isPending}
                          onClick={() =>
                            void (setDirectoryOpen(false), modal)
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
                            setDirectoryOpen(false);
                            if (
                              await modal.confirm({
                                title: copy.archiveOrganizationTitle,
                                description: copy.archiveOrganizationDescription(org.name),
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
                            void (setDirectoryOpen(false), modal)
                              .confirm({
                                title: copy.restoreOrganizationTitle,
                                description: copy.restoreOrganizationDescription(org.name),
                                confirmLabel: copy.restoreOrganization(org.name),
                                confirmationText: copy.restoreOrganization(org.name),
                                showCancel: true,
                              })
                              .then(
                                (confirmed) =>
                                  confirmed && update.mutate({ ...org, status: "ACTIVE" }),
                              )
                          }
                        >
                          <RotateCcw size={17} />
                        </IconAction>
                      )}
                    </OrganizationActions>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
  const steps = fa
    ? ["انتخاب و بررسی", "مشخصات مدرسه", "حساب‌های دانش‌آموزان"]
    : ["Select and review", "School profile", "Student accounts"];
  return (
    <div className="grid gap-5">
      <ManagementPageHeader
        title={
          canManage
            ? fa
              ? "مدیریت سازمان‌ها"
              : "Organization management"
            : fa
              ? "مدرسه من"
              : "My school"
        }
        description={
          fa
            ? "گام‌به‌گام مشخصات مدرسه را تکمیل و حساب‌های دانش‌آموزان را مدیریت کنید."
            : "Follow the steps to update your school profile and manage student accounts."
        }
        action={
          canManage ? (
            <Button onClick={() => openEditor()}>
              <Plus size={16} />
              {copy.newOrganization}
            </Button>
          ) : undefined
        }
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">
            {fa ? "سازمان‌های در دسترس" : "Available organizations"}
          </p>
          <p className="mt-2 text-2xl font-black">
            {(organizations.data?.length ?? 0).toLocaleString(profile.locale)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">
            {fa ? "سازمان انتخاب‌شده" : "Selected organization"}
          </p>
          <p className="mt-2 break-words font-black">{selected?.name ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">{fa ? "وضعیت صفحه عمومی" : "Public page status"}</p>
          <p className="mt-2 font-black">
            {selected?.authProfile?.published
              ? fa
                ? "منتشرشده"
                : "Published"
              : fa
                ? "منتشرنشده"
                : "Unpublished"}
          </p>
        </Card>
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <Card className="grid min-w-0 gap-5 p-5">
          <div>
            <h2 className="font-black">{fa ? "مسیر مدیریت مدرسه" : "School management steps"}</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {fa
                ? "ابتدا مدرسه را انتخاب کنید، سپس مشخصات و حساب‌ها را مدیریت کنید."
                : "Select your school, then manage its profile and student accounts."}
            </p>
          </div>
          <Button variant="soft" onClick={() => setDirectoryOpen(true)}>
            <Building2 size={16} />
            {fa ? "انتخاب سازمان" : "Choose organization"}
          </Button>
          <ol
            aria-label={fa ? "مراحل مدیریت مدرسه" : "School management steps"}
            className="grid gap-2"
          >
            {steps.map((title, index) => (
              <li key={title} aria-current={step === index ? "step" : undefined}>
                <Button
                  variant={step === index ? "primary" : "ghost"}
                  className="w-full justify-start text-start"
                  disabled={index > 0 && !selected}
                  onClick={() => setStep(index)}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs">
                    {(index + 1).toLocaleString(profile.locale)}
                  </span>
                  {title}
                </Button>
              </li>
            ))}
          </ol>
          {canManage ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <AccessFlowGuidance scope="organizations" canManage={canManage} />
            </div>
          ) : null}
        </Card>
        <Card className="min-w-0 p-5">
          <h2 ref={stepHeading} tabIndex={-1} className="mb-4 text-lg font-black outline-none">
            {steps[step]}
          </h2>
          {organizations.isLoading ? (
            <LoadingRows />
          ) : organizations.isError ? (
            <Retry message={copy.organizationsFailed} retry={() => void organizations.refetch()} />
          ) : !selected ? (
            <EmptyState
              title={copy.selectOrganizationToManage}
              action={
                <Button variant="soft" onClick={() => setDirectoryOpen(true)}>
                  {fa ? "انتخاب سازمان" : "Choose organization"}
                </Button>
              }
            />
          ) : step === 0 ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="break-words font-black">{selected.name}</h3>
                <StatusPill status={selected.status} />
              </div>
              <p className="text-sm text-slate-500">{copy.organizationType(selected.type)}</p>
              <dl className="grid grid-cols-2 gap-4 rounded-xl bg-brand/5 p-4">
                <div>
                  <dt className="text-xs text-slate-500">
                    {fa ? "امکانات فعال" : "Enabled features"}
                  </dt>
                  <dd className="mt-1 font-bold">
                    {selectedEnabledFeatureCount.toLocaleString(profile.locale)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    {fa ? "ظرفیت باقی‌مانده" : "Available capacity"}
                  </dt>
                  <dd className="mt-1 font-bold">
                    {Math.max(
                      0,
                      (selected.studentSignupLimit ?? 0) - (selected.studentSignupCount ?? 0),
                    ).toLocaleString(profile.locale)}
                  </dd>
                </div>
              </dl>
              {selected.status === "ACTIVE" &&
              auth.context?.activeOrganization?.id !== selected.id ? (
                <Button
                  variant="soft"
                  loading={switchingId === selected.id}
                  disabled={switchingId !== null}
                  onClick={() => void activate(selected)}
                >
                  {copy.selectWorkspace(selected.name)}
                </Button>
              ) : null}
              {canManage ? (
                <div className="grid gap-2">
                  <Button variant="soft" onClick={() => openEditor(selected)}>
                    {copy.editOrganization(selected.name)}
                  </Button>
                  {selected.status !== "ARCHIVED" ? (
                    <Button variant="soft" onClick={() => openFeatures(selected)}>
                      {copy.manageFeatures}
                    </Button>
                  ) : null}
                  {auth.can("organization.members.manage") && selected.status !== "ARCHIVED" ? (
                    <Button variant="soft" onClick={() => setWorkspaceOpen(true)}>
                      {fa ? "اعضا و ارتباط‌ها" : "Members and relationships"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {canEditProfile &&
              selected.status === "ACTIVE" &&
              (canManage || selected.studentSignupManagedByOrganization) ? (
                <Button variant="soft" onClick={() => openSignup(selected)}>
                  {fa ? "تنظیمات ثبت‌نام" : "Signup settings"}
                </Button>
              ) : null}
              {!canManage && !selected.studentSignupManagedByOrganization ? (
                <p className="text-xs leading-6 text-slate-500">
                  {fa
                    ? "تنظیم ثبت‌نام مستقیم توسط پلتفرم مدیریت می‌شود. ساخت حساب توسط شما از مرحله حساب‌ها انجام می‌شود."
                    : "The platform manages self-signup settings. Create student accounts in the accounts step."}
                </p>
              ) : null}
              {canManage ? (
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <label className="flex items-center justify-between gap-3 text-sm font-bold">
                    <span>{fa ? "ثبت‌نام مستقیم سراسری" : "Global student self-signup"}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(signupPolicy.data?.enabled)}
                      disabled={
                        !signupPolicy.data || signupPolicy.isFetching || setPlatformSignup.isPending
                      }
                      onChange={(event) => setPlatformSignup.mutate(event.target.checked)}
                    />
                  </label>
                  {signupPolicy.isError ? (
                    <Retry
                      message={copy.organizationsFailed}
                      retry={() => void signupPolicy.refetch()}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : step === 1 ? (
            canEditProfile && selected.status === "ACTIVE" ? (
              <OrganizationProfileEditor
                key={`${selected.id}:${JSON.stringify(selected.authProfile)}`}
                organization={selected}
              />
            ) : (
              <EmptyState
                title={fa ? "ویرایش مشخصات در دسترس نیست." : "Profile editing is unavailable."}
              />
            )
          ) : selected.status === "ACTIVE" ? (
            <OrganizationStudentAccounts
              key={selected.id}
              organizationId={selected.id}
              organizationName={selected.name}
            />
          ) : (
            <EmptyState title={copy.archivedOrganizationUnavailable} />
          )}
          <div className="mt-5 flex justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              {fa ? "گام قبل" : "Previous step"}
            </Button>
            <Button
              variant="soft"
              disabled={step === 2 || !selected}
              onClick={() => setStep(step + 1)}
            >
              {fa ? "گام بعد" : "Next step"}
            </Button>
          </div>
        </Card>
        <Card className="grid min-w-0 gap-3 p-5">
          <h2 className="font-black">{fa ? "پیش‌نمایش صفحه ورود" : "Login page preview"}</h2>
          <div className="rounded-xl border border-slate-200 p-4 text-center dark:border-slate-700">
            {selected?.authProfile?.logoUrl ? (
              <img
                src={selected.authProfile.logoUrl}
                alt=""
                className="mx-auto h-20 max-w-full object-contain"
              />
            ) : (
              <Building2 className="mx-auto text-brand" size={32} />
            )}
            <p className="mt-3 break-words font-black">
              {selected?.authProfile?.displayName || selected?.name || "—"}
            </p>
            <p className="mt-1 break-words text-xs text-brand">
              {selected?.authProfile?.brandName}
            </p>
            <p className="mt-3 break-words text-xs leading-6 text-slate-500">
              {selected?.authProfile?.description}
            </p>
            <p className="mt-4 font-bold">
              {selected?.authProfile?.loginTitle || (fa ? "ورود به میز کار" : "Sign in")}
            </p>
            <p className="mt-3 break-words text-xs leading-6 text-slate-500">
              {selected?.authProfile?.address}
            </p>
            <p className="break-words text-xs leading-6 text-slate-500">
              {selected?.authProfile?.location}
            </p>
            <p className="text-xs leading-6 text-slate-500" dir="ltr">
              {selected?.authProfile?.phone}
            </p>
          </div>
          {selected?.authProfile?.published ? (
            <a
              className="rounded-lg p-2 text-center text-sm font-bold text-brand focus-visible:ring-2 focus-visible:ring-brand"
              href={`/login?organizationId=${encodeURIComponent(selected.id)}`}
              target="_blank"
              rel="noreferrer"
            >
              {fa ? "مشاهده صفحه عمومی" : "Open public login page"}
            </a>
          ) : (
            <p className="text-xs leading-6 text-slate-500">
              {fa
                ? "برای نمایش عمومی، در مرحله مشخصات گزینه انتشار را فعال کنید."
                : "Enable publishing in the profile step to show these details publicly."}
            </p>
          )}
        </Card>
      </div>
      <ResponsiveDrawer
        open={directoryOpen}
        onOpenChange={setDirectoryOpen}
        title={copy.organizationList}
        description={
          fa
            ? "سازمان را جستجو و فضای کاری را باز کنید."
            : "Search organizations and open a workspace."
        }
        className="md:w-[min(52rem,94vw)]"
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label={copy.accountStatus}>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">{fa ? "همه وضعیت‌ها" : "All statuses"}</option>
              <option value="ACTIVE">{copy.activeStatus}</option>
              <option value="INACTIVE">{copy.inactiveStatus}</option>
              <option value="ARCHIVED">{copy.archivedStatus}</option>
            </Select>
          </Field>
          <Field label={copy.organizationKind}>
            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="ALL">{fa ? "همه انواع" : "All types"}</option>
              {organizationTypes.map((type) => (
                <option key={type} value={type}>
                  {copy.organizationType(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={fa ? "مرتب‌سازی" : "Sort by"}>
            <Select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="NAME">{fa ? "نام سازمان" : "Organization name"}</option>
              <option value="CAPACITY">{fa ? "ظرفیت باقی‌مانده" : "Available capacity"}</option>
            </Select>
          </Field>
        </div>
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder={copy.searchOrganizations}
          resultLabel={copy.resultCount(filtered.length, profile.locale)}
          onClear={hasFilters ? clearFilters : undefined}
        />
        <div className="mt-4">{directory}</div>
      </ResponsiveDrawer>
      {selected && canManage ? (
        <ResponsiveDrawer
          open={workspaceOpen}
          onOpenChange={setWorkspaceOpen}
          title={fa ? "اعضا و ارتباط‌ها" : "Members and relationships"}
          description={selected.name}
          className="md:w-[min(72rem,94vw)]"
        >
          {workspaceOpen ? (
            <OrganizationWorkspace
              key={selected.id}
              organizationId={selected.id}
              organizationName={selected.name}
              organizationType={selected.type}
            />
          ) : null}
        </ResponsiveDrawer>
      ) : null}
    </div>
  );
}

function OrganizationTypeField({
  value,
  onChange,
}: {
  value: AdminOrganizationType;
  onChange: (value: AdminOrganizationType) => void;
}) {
  const { language } = useLocale();
  const copy = accessCopy[language];
  return (
    <Field label={copy.organizationKind}>
      <Select value={value} onChange={(e) => onChange(e.target.value as AdminOrganizationType)}>
        {organizationTypes.map((type) => (
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
  onSubmit: (value: {
    name: string;
    type: AdminOrganizationType;
    studentSignupManagedByOrganization?: boolean;
    studentSignupEnabled?: boolean;
    studentSignupLimit?: number;
  }) => Promise<void>;
}) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = accessCopy[language];
  const [name, setName] = useState(organization?.name ?? "");
  const [type, setType] = useState<AdminOrganizationType>(organization?.type ?? "SCHOOL");
  const [managedByOrganization, setManagedByOrganization] = useState(
    organization?.studentSignupManagedByOrganization ?? false,
  );
  const [studentSignupEnabled, setStudentSignupEnabled] = useState(
    organization?.studentSignupEnabled ?? false,
  );
  const [studentSignupLimit, setStudentSignupLimit] = useState(
    organization?.studentSignupLimit ?? 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        void onSubmit({
          name: name.trim(),
          type,
          studentSignupManagedByOrganization: managedByOrganization,
          studentSignupEnabled,
          studentSignupLimit,
        })
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
      {!organization ? (
        <StudentSignupFields
          managedByOrganization={managedByOrganization}
          enabled={studentSignupEnabled}
          limit={studentSignupLimit}
          onManagedChange={setManagedByOrganization}
          onEnabledChange={setStudentSignupEnabled}
          onLimitChange={setStudentSignupLimit}
        />
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="soft" disabled={submitting} onClick={modal.close}>
          {copy.cancel}
        </Button>
        <Button loading={submitting} disabled={name.trim().length < 2}>
          {organization ? copy.saveChanges : copy.createOrganization}
        </Button>
      </div>
    </form>
  );
}
function OrganizationFeatureSettings({
  organization,
  onSave,
}: {
  organization: PortalOrganization;
  onSave: (features: (typeof organizationFeatures)[number][0][]) => Promise<unknown>;
}) {
  const modal = useModal();
  const { language } = useLocale();
  const copy = accessCopy[language];
  const [featureSearch, setFeatureSearch] = useState("");
  const [features, setFeatures] = useState(() =>
    organizationFeatures
      .filter(([code]) => !organization.disabledFeatures?.includes(code))
      .map(([code]) => code),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
          await onSave(features);
        } catch (reason) {
          setError(errorText(reason, copy.organizationSaveFailed));
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="text-sm text-slate-500">
        {language === "fa"
          ? "۱. امکانات را انتخاب کنید. ۲. تغییرات دسترسی سازمان را بررسی و ذخیره کنید."
          : "1. Choose features. 2. Review organization access changes and save."}
      </p>
      <Field label={language === "fa" ? "جستجوی امکانات" : "Search features"}>
        <Input value={featureSearch} onChange={(e) => setFeatureSearch(e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <span className="me-auto text-xs text-slate-500">
          {copy.enabledFeaturesOf(
            features.length,
            organizationFeatures.length,
            language === "fa" ? "fa-IR" : "en-US",
          )}
        </span>
        <Button
          type="button"
          variant="soft"
          size="sm"
          disabled={pending}
          onClick={() => setFeatures(organizationFeatures.map(([code]) => code))}
        >
          {language === "fa" ? "انتخاب همه" : "Select all"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setFeatures([])}
        >
          {language === "fa" ? "لغو انتخاب همه" : "Clear all"}
        </Button>
      </div>
      <fieldset disabled={pending} className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">{copy.manageFeatures}</legend>
        {organizationFeatures
          .filter(([code, label]) =>
            `${code} ${label} ${featureLabels[code]}`
              .toLowerCase()
              .includes(featureSearch.trim().toLowerCase()),
          )
          .map(([code, label]) => (
            <label
              key={code}
              className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <span className="text-sm font-medium">
                {language === "fa" ? label : featureLabels[code]}
              </span>
              <input
                type="checkbox"
                checked={features.includes(code)}
                onChange={(event) =>
                  setFeatures((current) =>
                    event.target.checked
                      ? [...current, code]
                      : current.filter((feature) => feature !== code),
                  )
                }
              />
            </label>
          ))}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="soft" disabled={pending} onClick={modal.close}>
          {copy.cancel}
        </Button>
        <Button loading={pending}>{copy.saveChanges}</Button>
      </div>
    </form>
  );
}

function StudentSignupFields({
  managedByOrganization,
  enabled,
  limit,
  onManagedChange,
  onEnabledChange,
  onLimitChange,
  showDelegation = true,
}: {
  managedByOrganization: boolean;
  enabled: boolean;
  limit: number;
  onManagedChange(value: boolean): void;
  onEnabledChange(value: boolean): void;
  onLimitChange(value: number): void;
  showDelegation?: boolean;
}) {
  const { language } = useLocale();
  const fa = language === "fa";
  return (
    <fieldset className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <legend className="px-1 text-sm font-bold">
        {fa ? "ثبت‌نام دانش‌آموز" : "Student signup"}
      </legend>
      {showDelegation ? (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <b>{fa ? "واگذاری به مدیر سازمان" : "Delegate to organization admin"}</b>
            <small className="block text-slate-500">
              {fa
                ? "مدیر سازمان می‌تواند ظرفیت و دسترسی را تغییر دهد."
                : "The organization admin can manage availability and capacity."}
            </small>
          </span>
          <input
            type="checkbox"
            checked={managedByOrganization}
            onChange={(event) => onManagedChange(event.target.checked)}
          />
        </label>
      ) : null}
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{fa ? "فعال‌سازی ثبت‌نام مستقیم" : "Enable direct signup"}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
      </label>
      <Field label={fa ? "ظرفیت ثبت‌نام مستقیم" : "Direct-signup capacity"}>
        <Input
          type="number"
          min={0}
          max={100000}
          value={limit}
          onChange={(event) => onLimitChange(Math.max(0, Number(event.target.value) || 0))}
        />
      </Field>
    </fieldset>
  );
}

function StudentSignupSettings({
  organization,
  platform = true,
  onSave,
}: {
  organization: PortalOrganization;
  platform?: boolean;
  onSave(body: {
    managedByOrganization?: boolean;
    enabled?: boolean;
    limit?: number;
  }): Promise<void>;
}) {
  const { language } = useLocale();
  const fa = language === "fa";
  const modal = useModal();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [managed, setManaged] = useState(Boolean(organization.studentSignupManagedByOrganization));
  const [enabled, setEnabled] = useState(Boolean(organization.studentSignupEnabled));
  const [limit, setLimit] = useState(organization.studentSignupLimit ?? 0);
  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
          await onSave({ managedByOrganization: managed, enabled, limit });
        } catch (reason) {
          setError(errorText(reason, fa ? "ذخیره ناموفق بود." : "Unable to save settings."));
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <h2 className="font-black">{fa ? "دسترسی ثبت‌نام دانش‌آموز" : "Student signup access"}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {fa
            ? `${organization.studentSignupCount ?? 0} از ${organization.studentSignupLimit ?? 0} ظرفیت استفاده شده است.`
            : `${organization.studentSignupCount ?? 0} of ${organization.studentSignupLimit ?? 0} places used.`}
        </p>
      </div>
      <fieldset disabled={pending} className="min-w-0">
        <StudentSignupFields
          showDelegation={platform}
          managedByOrganization={managed}
          enabled={enabled}
          limit={limit}
          onManagedChange={setManaged}
          onEnabledChange={setEnabled}
          onLimitChange={setLimit}
        />
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="soft" disabled={pending} onClick={modal.close}>
          {fa ? "انصراف" : "Cancel"}
        </Button>
        <Button size="sm" loading={pending}>
          {fa ? "ذخیره تنظیمات ثبت‌نام" : "Save signup settings"}
        </Button>
      </div>
    </form>
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
      size="sm"
      variant={active ? "primary" : tone}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
      {typeof children === "object" && !Array.isArray(children) ? label : null}
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

function OrganizationActions({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      actionsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return (
    <div ref={containerRef}>
      <ViewportPopover
        label={label}
        portalContainer={containerRef.current ?? undefined}
        open={open}
        onOpenChange={setOpen}
        width={280}
        trigger={(props) => (
          <button
            {...props}
            type="button"
            aria-label={label}
            title={label}
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <MoreHorizontal size={20} />
          </button>
        )}
      >
        <div
          ref={actionsRef}
          className="grid gap-1 p-2 [&>button]:justify-start"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button:not(:disabled)")) setOpen(false);
          }}
        >
          <p className="border-b border-slate-100 px-2 py-2 text-xs font-bold dark:border-slate-800">
            {label}
          </p>
          {children}
        </div>
      </ViewportPopover>
    </div>
  );
}

const featureLabels: Record<(typeof organizationFeatures)[number][0], string> = {
  PLANNER: "Planner",
  LEARNING: "Learning",
  EXAMS: "Exams",
  QUIZZES: "Quizzes",
  QUESTION_BANK: "Question bank",
  SUBJECTS: "Subjects",
  EDUCATION: "Classes and education",
  RESOURCES: "Learning resources",
  CHAT: "Chat",
  REPORTS: "Reports",
  STUDENTS: "Student management",
  FAMILY: "Family portal",
  ONBOARDING: "Student onboarding",
  ANALYTICS: "Analytics",
  IMPORT_EXPORT: "Import and export",
  SMS: "SMS",
};
