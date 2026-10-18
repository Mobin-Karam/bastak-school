import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  RefreshCw,
  Save,
  Send,
  Smartphone,
  UsersRound,
  XCircle,
} from "lucide-react";
import { Button, Card, CheckboxGroup, Input, LoadingState, Textarea } from "../../../../shared/ui/ui";
import { SegmentedControl } from "../../../../shared/ui/segmented-control";
import {
  DataTable,
  type DataTableAction,
  type DataTableColumn,
} from "../../../../shared/ui/data-table";
import { notify } from "../../../../shared/ui/notifications";
import { useAuth } from "../../../identity/auth";
import {
  cancelCampaign,
  configureSmsProvider,
  createCampaign,
  getCampaign,
  listCampaigns,
  previewAudience,
  refreshCampaignStatus,
  retryCampaign,
  sendCampaign,
  smsStatus,
  type Campaign,
  type Criteria,
  type ProviderStatus,
  type Preview,
} from "../api/sms.api";
import type { SmsCampaignDetail } from "@moshaver/api-contract";

const audienceRoles = [
  "STUDENT",
  "GUARDIAN",
  "TEACHER",
  "PRINCIPAL",
  "ORGANIZATION_ADMIN",
] as const;
const roleLabels: Record<(typeof audienceRoles)[number], string> = {
  STUDENT: "طلبه",
  GUARDIAN: "ولی",
  TEACHER: "استاد",
  PRINCIPAL: "مدیر",
  ORGANIZATION_ADMIN: "مدیر سازمان",
};
const statusLabel: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  SCHEDULED: "زمان‌بندی‌شده",
  SENDING: "در حال ارسال",
  SENT: "ارسال شد",
  PARTIAL: "ناقص",
  FAILED: "ناموفق",
  CANCELLED: "لغو شد",
};
type SmsTab = "compose" | "campaigns" | "settings";
type ComposeStep = "roles" | "users" | "message" | "review";
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

export function SmsPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const isPlatformAdmin = Boolean(auth.context?.roles.includes("PLATFORM_ADMIN"));
  const [tab, setTab] = useState<SmsTab>("compose");
  const [composeStep, setComposeStep] = useState<ComposeStep>("roles");
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [includeAll, setIncludeAll] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [lineNumber, setLineNumber] = useState("");
  const [providerEnabled, setProviderEnabled] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const audienceCriteria = useMemo<Criteria>(
    () => ({ organizationId: auth.context?.activeOrganization?.id, roleCodes, includeAll }),
    [auth.context?.activeOrganization?.id, roleCodes, includeAll],
  );
  const criteria = useMemo<Criteria>(
    () =>
      selectedUserIds.length
        ? { organizationId: auth.context?.activeOrganization?.id, userIds: selectedUserIds }
        : audienceCriteria,
    [audienceCriteria, auth.context?.activeOrganization?.id, selectedUserIds],
  );
  const preview = useQuery({
    queryKey: ["sms", "preview", "candidates", audienceCriteria],
    queryFn: () => previewAudience(audienceCriteria),
    enabled: Boolean(includeAll || roleCodes.length),
  });
  const deliveryPreview = useQuery({
    queryKey: ["sms", "preview", "selected", criteria],
    queryFn: () => previewAudience(criteria),
    enabled: selectedUserIds.length > 0,
  });
  const campaigns = useQuery({
    queryKey: ["sms", "campaigns", auth.context?.activeOrganization?.id],
    queryFn: listCampaigns,
  });
  const provider = useQuery({
    queryKey: ["sms", "provider"],
    queryFn: smsStatus,
    enabled: auth.can("sms.manage"),
  });
  useEffect(() => {
    if (!provider.data) return;
    setLineNumber((current) => current || provider.data.lineNumber || "");
    setProviderEnabled(provider.data.enabled);
    setDryRun(provider.data.dryRun);
  }, [provider.data]);
  const invalidateSms = () => void client.invalidateQueries({ queryKey: ["sms"] });
  const configure = useMutation({
    mutationFn: () =>
      configureSmsProvider({
        apiKey: apiKey || undefined,
        lineNumber: lineNumber || provider.data?.lineNumber || "",
        enabled: providerEnabled,
        dryRun,
      }),
    onSuccess: () => {
      setApiKey("");
      notify("تنظیمات پیامک با رمزگذاری ذخیره شد.", "success");
      invalidateSms();
    },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const send = useMutation({
    mutationFn: sendCampaign,
    onSuccess: () => {
      notify(scheduledAt ? "کمپین زمان‌بندی شد." : "کمپین برای ارسال ثبت شد.", "success");
      setTitle("");
      setMessageText("");
      setScheduledAt("");
      setTab("campaigns");
      invalidateSms();
    },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const create = useMutation({
    mutationFn: () =>
      createCampaign({
        title,
        messageText,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        criteria,
      }),
    onSuccess: (campaign) => send.mutate(campaign.id),
    onError: (error: Error) => notify(error.message, "error"),
  });
  const retry = useMutation({
    mutationFn: retryCampaign,
    onSuccess: () => {
      notify("ارسال ناموفق دوباره تلاش شد.", "success");
      invalidateSms();
    },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const cancel = useMutation({
    mutationFn: cancelCampaign,
    onSuccess: () => {
      notify("کمپین زمان‌بندی‌شده لغو شد.", "success");
      invalidateSms();
    },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const refresh = useMutation({
    mutationFn: refreshCampaignStatus,
    onSuccess: () => {
      notify("گزارش تحویل به‌روزرسانی شد.", "success");
      invalidateSms();
    },
    onError: (error: Error) => notify(error.message, "error"),
  });
  const canSubmit = Boolean(
    title.trim() &&
    messageText.trim() &&
    (selectedUserIds.length ? deliveryPreview.data?.total : preview.data?.total) &&
    !create.isPending &&
    !send.isPending,
  );
  const tabs = [
    {
      value: "compose" as const,
      className: "min-h-11 px-4 text-sm text-brand",
      label: (
        <>
          <MessageSquareText size={18} className="text-brand" aria-hidden="true" />
          ارسال پیامک
        </>
      ),
    },
    {
      value: "campaigns" as const,
      className: "min-h-11 px-4 text-sm text-violet-700 dark:text-violet-300",
      label: (
        <>
          <FileText size={18} className="text-violet-600 dark:text-violet-300" aria-hidden="true" />
          کمپین‌ها
        </>
      ),
    },
    ...(isPlatformAdmin
      ? [
          {
            value: "settings" as const,
            className: "min-h-11 px-4 text-sm text-amber-700 dark:text-amber-300",
            label: (
              <>
                <Smartphone
                  size={18}
                  className="text-amber-600 dark:text-amber-300"
                  aria-hidden="true"
                />
                تنظیمات
              </>
            ),
          },
        ]
      : []),
  ];
  return (
    <main
      dir="rtl"
      className="grid min-w-0 max-w-full gap-4 overflow-x-clip"
      aria-labelledby="sms-page-title"
    >
      {tab === "compose" ? (
        <section className="">
          <ComposeWorkflow
            step={composeStep}
            onStepChange={setComposeStep}
            roleCodes={roleCodes}
            includeAll={includeAll}
            onAudienceChange={(nextRoles, nextIncludeAll) => {
              setRoleCodes(nextRoles);
              setIncludeAll(nextIncludeAll);
              setSelectedUserIds([]);
            }}
            preview={preview.data}
            previewLoading={preview.isFetching}
            selectedUserIds={selectedUserIds}
            onSelectedUserIdsChange={setSelectedUserIds}
            title={title}
            messageText={messageText}
            scheduledAt={scheduledAt}
            onTitleChange={setTitle}
            onMessageChange={setMessageText}
            onScheduledAtChange={setScheduledAt}
            recipientTotal={
              selectedUserIds.length
                ? (deliveryPreview.data?.total ?? 0)
                : (preview.data?.total ?? 0)
            }
            reviewLoading={selectedUserIds.length ? deliveryPreview.isFetching : preview.isFetching}
            canSubmit={canSubmit}
            sending={create.isPending || send.isPending}
            onSubmit={() => create.mutate()}
            provider={
              <aside className="grid h-fit gap-4 xl:sticky xl:top-4">
                <SegmentedControl
                  value={tab}
                  onValueChange={setTab}
                  options={tabs}
                  ariaLabel="بخش‌های مرکز پیامک"
                  className="max-w-full overflow-x-auto p-1.5 shadow-sm"
                />{" "}
                <ProviderSummary
                  provider={provider.data}
                  loading={provider.isLoading}
                  isPlatformAdmin={isPlatformAdmin}
                  onOpenSettings={() => setTab("settings")}
                />
              </aside>
            }
          />
        </section>
      ) : null}

      {tab === "campaigns" ? (
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
          <CampaignList
            data={campaigns.data}
            isLoading={campaigns.isLoading}
            isError={campaigns.isError}
            canManage={auth.can("sms.manage")}
            retryPending={retry.isPending}
            cancelPending={cancel.isPending}
            refreshPending={refresh.isPending}
            onRetry={(id) => retry.mutate(id)}
            onCancel={(id) => cancel.mutate(id)}
            onRefresh={(id) => refresh.mutate(id)}
          />

          <aside className="grid h-fit gap-4 xl:sticky xl:top-4">
            <SegmentedControl
              value={tab}
              onValueChange={setTab}
              options={tabs}
              ariaLabel="بخش‌های مرکز پیامک"
              className="max-w-full overflow-x-auto p-1.5 shadow-sm"
            />
            <ProviderSummary
              provider={provider.data}
              loading={provider.isLoading}
              isPlatformAdmin={isPlatformAdmin}
              onOpenSettings={() => setTab("settings")}
            />
            <Card className="p-4">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-5 text-amber-600" aria-hidden="true" />
                <div>
                  <h2 className="font-black text-[rgb(var(--color-ink))]">پیگیری تحویل</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    برای وضعیت‌های ارسال‌شده، «گزارش» را بزنید تا آخرین وضعیت SMS.ir خوانده شود.
                  </p>
                </div>
              </div>
            </Card>
          </aside>
        </section>
      ) : null}
      {tab === "settings" && isPlatformAdmin ? (
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
          <ProviderSettings
            apiKey={apiKey}
            lineNumber={lineNumber}
            providerEnabled={providerEnabled}
            dryRun={dryRun}
            pending={configure.isPending}
            configured={Boolean(provider.data?.configured)}
            onApiKeyChange={setApiKey}
            onLineNumberChange={setLineNumber}
            onProviderEnabledChange={setProviderEnabled}
            onDryRunChange={setDryRun}
            onSubmit={() => configure.mutate()}
          />
          <aside className="grid h-fit gap-4 xl:sticky xl:top-4">
            <SegmentedControl
              value={tab}
              onValueChange={setTab}
              options={tabs}
              ariaLabel="بخش‌های مرکز پیامک"
              className="max-w-full overflow-x-auto p-1.5 shadow-sm"
            />{" "}
            <ProviderSummary
              provider={provider.data}
              loading={provider.isLoading}
              isPlatformAdmin={isPlatformAdmin}
              onOpenSettings={() => setTab("settings")}
            />
          </aside>
        </section>
      ) : null}
    </main>
  );
}

function ComposeWorkflow({
  step,
  onStepChange,
  roleCodes,
  includeAll,
  onAudienceChange,
  preview,
  previewLoading,
  selectedUserIds,
  onSelectedUserIdsChange,
  title,
  messageText,
  scheduledAt,
  onTitleChange,
  onMessageChange,
  onScheduledAtChange,
  recipientTotal,
  reviewLoading,
  canSubmit,
  sending,
  onSubmit,
  provider,
}: {
  step: ComposeStep;
  onStepChange: (step: ComposeStep) => void;
  roleCodes: string[];
  includeAll: boolean;
  onAudienceChange: (roles: string[], includeAll: boolean) => void;
  preview?: Preview;
  previewLoading: boolean;
  selectedUserIds: string[];
  onSelectedUserIdsChange: (ids: string[]) => void;
  title: string;
  messageText: string;
  scheduledAt: string;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onScheduledAtChange: (value: string) => void;
  recipientTotal: number;
  reviewLoading: boolean;
  canSubmit: boolean;
  sending: boolean;
  onSubmit: () => void;
  provider: React.ReactNode;
}) {
  const steps: Array<{ id: ComposeStep; label: string; description: string }> = [
    { id: "roles", label: "نقش‌ها", description: "گروه مخاطب" },
    { id: "users", label: "کاربران", description: "انتخاب گیرندگان" },
    { id: "message", label: "پیام", description: "متن و زمان" },
    { id: "review", label: "بازبینی", description: "تأیید ارسال" },
  ];
  const currentIndex = steps.findIndex((item) => item.id === step);
  const canMoveTo = (target: ComposeStep) => {
    const targetIndex = steps.findIndex((item) => item.id === target);
    return (
      targetIndex <= currentIndex ||
      (Boolean(includeAll || roleCodes.length) &&
        (targetIndex < 2 || Boolean(selectedUserIds.length || preview?.total)) &&
        (targetIndex < 3 || Boolean(title.trim() && messageText.trim())))
    );
  };
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
      <div className="grid min-w-0 gap-4">
        <Card className="p-3 sm:p-4">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="مراحل ارسال پیامک">
            {steps.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canMoveTo(item.id)}
                  aria-current={step === item.id ? "step" : undefined}
                  onClick={() => onStepChange(item.id)}
                  className={`flex min-h-16 w-full items-center gap-2 rounded-lg border px-3 text-right transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-55 ${step === item.id ? "border-brand bg-brand/10 text-brand" : index < currentIndex ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700" : "border-[rgb(var(--border-subtle))] text-slate-600 dark:text-slate-300"}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[rgb(var(--surface-card))] text-xs font-black shadow-sm">
                    {index + 1}
                  </span>
                  <span className="grid gap-0.5">
                    <strong className="text-sm">{item.label}</strong>
                    <span className="text-xs font-normal opacity-80">{item.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Card>
        {step === "roles" ? (
          <Card className="p-4 sm:p-5">
            <h2 className="font-black text-[rgb(var(--color-ink))]">
              ۱. نقش مخاطبان را انتخاب کنید
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              در مرحله بعد، کاربران واجد شرایط را از فهرست بررسی و انتخاب می‌کنید.
            </p>
            <CheckboxGroup
              className="mt-4"
              legend="گروه‌های دریافت‌کننده"
              description="شماره‌های تکراری فقط یک‌بار پیامک می‌گیرند."
              options={audienceRoles.map((value) => ({ value, label: roleLabels[value] }))}
              value={roleCodes as (typeof audienceRoles)[number][]}
              onValueChange={(value) => onAudienceChange(value, false)}
              listClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            />
            <Button
              type="button"
              variant={includeAll ? "primary" : "soft"}
              size="sm"
              className="mt-3"
              aria-pressed={includeAll}
              onClick={() => onAudienceChange([], !includeAll)}
            >
              همه کاربران مجاز سازمان
            </Button>
            <div className="mt-5 flex justify-end">
              <Button
                disabled={!includeAll && !roleCodes.length}
                onClick={() => onStepChange("users")}
              >
                ادامه: مشاهده کاربران
              </Button>
            </div>
          </Card>
        ) : null}
        {step === "users" ? (
          <AudienceUsersTable
            data={preview?.users ?? []}
            total={preview?.total ?? 0}
            loading={previewLoading}
            selectedUserIds={selectedUserIds}
            onSelectedUserIdsChange={onSelectedUserIdsChange}
            onBack={() => onStepChange("roles")}
            onNext={() => onStepChange("message")}
          />
        ) : null}
        {step === "message" ? (
          <Card className="p-4 sm:p-5">
            <h2 className="font-black text-[rgb(var(--color-ink))]">۳. متن و زمان ارسال</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              عنوان فقط برای مدیریت داخلی کمپین است و برای گیرندگان ارسال نمی‌شود.
            </p>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1.5 text-sm font-bold text-[rgb(var(--color-ink))]">
                عنوان داخلی
                <Input
                  value={title}
                  maxLength={140}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="مثلاً اطلاعیه جلسه اولیا"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-[rgb(var(--color-ink))]">
                متن پیام
                <Textarea
                  value={messageText}
                  maxLength={2000}
                  onChange={(event) => onMessageChange(event.target.value)}
                  className="min-h-36 resize-y"
                  placeholder="متن پیامک…"
                />
              </label>
              <div className="grid gap-1.5">
                <label
                  htmlFor="sms-scheduled-at"
                  className="text-sm font-bold text-[rgb(var(--color-ink))]"
                >
                  زمان ارسال <span className="font-normal text-slate-500">(اختیاری)</span>
                </label>
                <div className="relative">
                  <CalendarClock
                    className="pointer-events-none absolute end-3 top-3 size-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="sms-scheduled-at"
                    className="pe-10"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => onScheduledAtChange(event.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                {messageText.length.toLocaleString("fa-IR")} نویسه · تعداد بخش و هزینه نهایی را
                SMS.ir تعیین می‌کند.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-2">
              <Button variant="ghost" onClick={() => onStepChange("users")}>
                بازگشت
              </Button>
              <Button
                disabled={!title.trim() || !messageText.trim()}
                onClick={() => onStepChange("review")}
              >
                ادامه: بازبینی
              </Button>
            </div>
          </Card>
        ) : null}
        {step === "review" ? (
          <CampaignReview
            total={recipientTotal}
            scheduledAt={scheduledAt}
            disabled={!canSubmit || reviewLoading}
            loading={sending || reviewLoading}
            onSubmit={onSubmit}
            onBack={() => onStepChange("message")}
          />
        ) : null}
      </div>
      <aside className="grid h-fit min-w-0 gap-4 xl:sticky xl:top-4">
        {provider}
        <Card className="p-4">
          <div className="flex gap-3">
            <UsersRound className="mt-0.5 size-5 text-brand" aria-hidden="true" />
            <div>
              <h2 className="font-black text-[rgb(var(--color-ink))]">انتخاب فعلی</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {selectedUserIds.length
                  ? `${selectedUserIds.length.toLocaleString("fa-IR")} کاربر مشخص انتخاب شده است.`
                  : preview
                    ? `${preview.total.toLocaleString("fa-IR")} کاربرِ نقش‌های انتخاب‌شده، دریافت‌کننده هستند.`
                    : "ابتدا نقش مخاطبان را انتخاب کنید."}
              </p>
            </div>
          </div>
        </Card>
      </aside>
    </section>
  );
}

function AudienceUsersTable({
  data,
  total,
  loading,
  selectedUserIds,
  onSelectedUserIdsChange,
  onBack,
  onNext,
}: {
  data: Preview["users"];
  total: number;
  loading: boolean;
  selectedUserIds: string[];
  onSelectedUserIdsChange: (ids: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const columns: DataTableColumn<Preview["users"][number]>[] = [
    {
      id: "name",
      label: "کاربر",
      primary: true,
      value: (row) => row.displayName,
      cell: (row) => (
        <div className="grid gap-1">
          <strong>{row.displayName}</strong>
          <span className="text-xs text-slate-500" dir="ltr">
            {row.maskedPhoneNumber}
          </span>
        </div>
      ),
    },
    {
      id: "roles",
      label: "نقش‌ها",
      value: (row) => row.roles.join(" "),
      cell: (row) => (
        <span>
          {row.roles.map((role) => roleLabels[role as keyof typeof roleLabels] || role).join("، ")}
        </span>
      ),
    },
    { id: "organization", label: "سازمان", value: (row) => row.organization || "—" },
  ];
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-black text-[rgb(var(--color-ink))]">۲. کاربران نقش‌های انتخاب‌شده</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            همهٔ کاربرانِ نقش‌ها پیش‌فرض گیرنده‌اند؛ برای محدودکردن ارسال، چند کاربر را تیک بزنید و
            انتخاب را تأیید کنید.
          </p>
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
          {total.toLocaleString("fa-IR")} کاربر
        </span>
      </div>
      <div className="mt-4">
        <DataTable
          data={data}
          columns={columns}
          getRowId={(row) => row.userId}
          label="کاربران منتخب برای پیامک"
          language="fa"
          loading={loading}
          selectable
          preferenceKey="sms-audience-users"
          emptyTitle="کاربر واجد شرایطی پیدا نشد"
          bulkActions={(rows, clear) => (
            <Button
              size="sm"
              onClick={() => {
                onSelectedUserIdsChange(rows.map((row) => row.userId));
                clear();
              }}
            >
              تأیید {rows.length.toLocaleString("fa-IR")} کاربر
            </Button>
          )}
        />
      </div>
      {selectedUserIds.length ? (
        <p className="mt-3 text-sm font-bold text-emerald-700">
          ارسال فقط برای {selectedUserIds.length.toLocaleString("fa-IR")} کاربر انتخاب‌شده انجام
          می‌شود.
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          بازگشت
        </Button>
        <Button disabled={loading || !data.length} onClick={onNext}>
          ادامه: نوشتن پیام
        </Button>
      </div>
    </Card>
  );
}
function CampaignReview({
  total,
  scheduledAt,
  disabled,
  loading,
  onSubmit,
  onBack,
}: {
  total: number;
  scheduledAt: string;
  disabled: boolean;
  loading: boolean;
  onSubmit: () => void;
  onBack?: () => void;
}) {
  return (
    <Card className="border-brand/20 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <Send size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-black text-[rgb(var(--color-ink))]">۴. بررسی و ارسال</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {total.toLocaleString("fa-IR")} گیرنده انتخاب شده است.
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-[rgb(var(--surface-muted))] p-3 text-sm text-slate-600 dark:text-slate-400">
        {scheduledAt ? (
          <span className="flex gap-2">
            <Clock3 size={16} className="shrink-0 text-amber-600" aria-hidden="true" />
            ارسال در {formatDateTime(scheduledAt)}
          </span>
        ) : (
          <span className="flex gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden="true" />
            پس از تأیید، پیامک برای ارسال ثبت می‌شود.
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            بازگشت
          </Button>
        ) : null}
        <Button
          className="min-w-44 flex-1"
          disabled={disabled}
          loading={loading}
          loadingLabel="در حال ثبت…"
          onClick={onSubmit}
        >
          <Send size={16} aria-hidden="true" />
          {scheduledAt ? "زمان‌بندی کمپین" : "ارسال پیامک"}
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        با ثبت، مخاطبان به‌صورت snapshot نگه‌داری می‌شوند و تغییرهای بعدی فهرست روی این کمپین اثر
        نمی‌گذارد.
      </p>
    </Card>
  );
}
function ProviderSummary({
  provider,
  loading,
  isPlatformAdmin,
  onOpenSettings,
}: {
  provider?: ProviderStatus;
  loading: boolean;
  isPlatformAdmin: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone size={18} aria-hidden="true" />
          <h2 className="font-black text-[rgb(var(--color-ink))]">وضعیت SMS.ir</h2>
        </div>
        {provider?.configured ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700">
            متصل
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="mt-3">
          <LoadingState label="در حال دریافت وضعیت…" />
        </div>
      ) : provider ? (
        <div className="mt-3 grid gap-2 text-sm">
          <p
            className={provider.dryRun ? "font-bold text-amber-700" : "font-bold text-emerald-700"}
          >
            {provider.dryRun
              ? "حالت آزمایشی؛ پیامکی ارسال نمی‌شود."
              : provider.enabled
                ? "ارسال واقعی فعال است."
                : "ارسال واقعی غیرفعال است."}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            خط پیش‌فرض: <span dir="ltr">{provider.lineNumber || "—"}</span>
          </p>
          {provider.keyLastFour ? (
            <p className="text-slate-600 dark:text-slate-400">
              کلید: <span dir="ltr">••••{provider.keyLastFour}</span>
            </p>
          ) : null}
          {provider.credit !== null ? (
            <p className="text-slate-600 dark:text-slate-400">
              اعتبار: {provider.credit.toLocaleString("fa-IR")}
            </p>
          ) : null}
          {isPlatformAdmin ? (
            <Button variant="soft" size="sm" className="mt-1 w-full" onClick={onOpenSettings}>
              مدیریت تنظیمات
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex gap-2 text-sm leading-6 text-slate-500">
          <AlertTriangle size={16} className="mt-1 shrink-0" aria-hidden="true" />
          وضعیت ارائه‌دهنده فقط برای مدیر سامانه قابل مشاهده است.
        </div>
      )}
    </Card>
  );
}
function CampaignList({
  data = [],
  isLoading,
  isError,
  canManage,
  retryPending,
  cancelPending,
  refreshPending,
  onRetry,
  onCancel,
  onRefresh,
}: {
  data?: Campaign[];
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  retryPending: boolean;
  cancelPending: boolean;
  refreshPending: boolean;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRefresh: (id: string) => void;
}) {
  const columns: DataTableColumn<Campaign>[] = [
    {
      id: "title",
      label: "کمپین",
      primary: true,
      value: (row) => row.title,
      cell: (row) => (
        <div className="grid gap-1">
          <strong>{row.title}</strong>
          <span className="text-xs text-slate-500">
            {row.scheduledAt
              ? `زمان ارسال: ${formatDateTime(row.scheduledAt)}`
              : `ایجاد: ${formatDateTime(row.createdAt)}`}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      label: "وضعیت",
      value: (row) => statusLabel[row.status] || row.status,
      filter: {
        type: "select",
        options: Object.entries(statusLabel).map(([label]) => ({ value: label, label })),
      },
      cell: (row) => (
        <span className="rounded-full bg-[rgb(var(--surface-muted))] px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
          {statusLabel[row.status] || row.status}
        </span>
      ),
    },
    {
      id: "recipients",
      label: "گیرندگان",
      value: (row) => row.totalRecipients,
      cell: (row) => (
        <span>
          {row.totalRecipients.toLocaleString("fa-IR")}{" "}
          <span className="text-xs text-slate-500">گیرنده</span>
        </span>
      ),
    },
    {
      id: "failed",
      label: "ناموفق",
      value: (row) => row.failedRecipients,
      cell: (row) => (
        <span className={row.failedRecipients ? "font-bold text-rosewood" : "text-slate-500"}>
          {row.failedRecipients.toLocaleString("fa-IR")}
        </span>
      ),
    },
  ];
  const actions: DataTableAction<Campaign>[] = canManage
    ? [
        {
          id: "retry",
          label: "تلاش مجدد",
          visible: (row) => row.status === "PARTIAL",
          disabled: () => retryPending,
          onClick: (row) => onRetry(row.id),
        },
        {
          id: "cancel",
          label: "لغو",
          tone: "danger",
          icon: <XCircle size={16} aria-hidden="true" />,
          visible: (row) => row.status === "SCHEDULED",
          disabled: () => cancelPending,
          onClick: (row) => onCancel(row.id),
        },
        {
          id: "report",
          label: "گزارش",
          icon: <RefreshCw size={16} aria-hidden="true" />,
          visible: (row) => ["SENT", "PARTIAL", "SCHEDULED"].includes(row.status),
          disabled: () => refreshPending,
          onClick: (row) => onRefresh(row.id),
        },
      ]
    : [];
  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      label="کمپین‌های پیامک"
      language="fa"
      loading={isLoading}
      error={isError}
      busy={retryPending || cancelPending || refreshPending}
      emptyTitle="هنوز کمپینی ثبت نشده است"
      actions={actions}
      renderDetail={(campaign) => <CampaignDetail campaignId={campaign.id} />}
      preferenceKey="sms-campaigns"
    />
  );
}
function CampaignDetail({ campaignId }: { campaignId: string }) {
  const campaign = useQuery({
    queryKey: ["sms", "campaign", campaignId],
    queryFn: () => getCampaign(campaignId),
  });
  if (campaign.isLoading) return <LoadingState label="در حال دریافت جزئیات کمپین…" />;
  if (campaign.isError || !campaign.data)
    return (
      <p role="alert" className="text-sm text-rosewood">
        جزئیات کمپین دریافت نشد.
      </p>
    );
  return <CampaignDetailContent campaign={campaign.data} />;
}
function CampaignDetailContent({ campaign }: { campaign: SmsCampaignDetail }) {
  const failedRecipients = campaign.recipients.filter((recipient) => recipient.status === "FAILED");
  return (
    <section className="grid gap-4" aria-labelledby={`sms-campaign-${campaign.id}`}>
      <header>
        <h2 id={`sms-campaign-${campaign.id}`} className="font-black text-[rgb(var(--color-ink))]">
          {campaign.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {statusLabel[campaign.status] || campaign.status} ·{" "}
          {campaign.totalRecipients.toLocaleString("fa-IR")} گیرنده
        </p>
      </header>
      <Card className="p-3 text-sm leading-7 whitespace-pre-wrap">{campaign.messageText}</Card>
      <dl className="grid grid-cols-3 gap-2 text-center text-sm">
        {[
          ["ثبت‌شده", campaign.submittedRecipients],
          ["ناموفق", campaign.failedRecipients],
          [
            "باقی‌مانده",
            Math.max(
              0,
              campaign.totalRecipients - campaign.submittedRecipients - campaign.failedRecipients,
            ),
          ],
        ].map(([label, count]) => (
          <div key={String(label)} className="rounded-lg bg-[rgb(var(--surface-muted))] p-2">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 font-black">{Number(count).toLocaleString("fa-IR")}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-2 text-sm">
        <p>ایجاد: {formatDateTime(campaign.createdAt)}</p>
        {campaign.scheduledAt ? <p>زمان‌بندی: {formatDateTime(campaign.scheduledAt)}</p> : null}
        {campaign.completedAt ? <p>پایان: {formatDateTime(campaign.completedAt)}</p> : null}
        <p>بسته‌های ارسال: {campaign.batches.length.toLocaleString("fa-IR")}</p>
      </div>
      {failedRecipients.length ? (
        <section
          aria-label="خطاهای ارسال"
          className="grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-3"
        >
          <h3 className="font-bold text-rosewood">ارسال‌های ناموفق</h3>
          {failedRecipients.map((recipient) => (
            <p key={recipient.id} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              {recipient.displayNameSnapshot}:{" "}
              {recipient.failureMessage || recipient.failureCode || "خطای نامشخص"}
            </p>
          ))}
        </section>
      ) : null}
    </section>
  );
}
function ProviderSettings({
  apiKey,
  lineNumber,
  providerEnabled,
  dryRun,
  pending,
  configured,
  onApiKeyChange,
  onLineNumberChange,
  onProviderEnabledChange,
  onDryRunChange,
  onSubmit,
}: {
  apiKey: string;
  lineNumber: string;
  providerEnabled: boolean;
  dryRun: boolean;
  pending: boolean;
  configured: boolean;
  onApiKeyChange: (value: string) => void;
  onLineNumberChange: (value: string) => void;
  onProviderEnabledChange: (value: boolean) => void;
  onDryRunChange: (value: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="mx-auto grid w-full max-w-3xl gap-4">
      <Card className="p-4 sm:p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            <Save size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-black text-[rgb(var(--color-ink))]">پیکربندی امن SMS.ir</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              کلید فقط هنگام ذخیره ارسال و در سرور رمزنگاری می‌شود؛ هیچ‌وقت دوباره نمایش داده نخواهد
              شد.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold text-[rgb(var(--color-ink))]">
            کلید API
            <Input
              type="password"
              autoComplete="new-password"
              value={apiKey}
              onChange={(event) => onApiKeyChange(event.target.value)}
              placeholder={configured ? "برای حفظ کلید، خالی بگذارید" : "کلید API"}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-[rgb(var(--color-ink))]">
            خط ارسال
            <Input
              inputMode="numeric"
              value={lineNumber}
              onChange={(event) => onLineNumberChange(event.target.value)}
              placeholder="3000…"
              dir="ltr"
            />
          </label>
          <CheckboxGroup
            legend="حالت سرویس"
            description="تا وقتی حالت آزمایشی روشن است، هیچ پیامکی از ارائه‌دهنده ارسال نمی‌شود."
            value={[...(providerEnabled ? ["enabled"] : []), ...(dryRun ? ["dry-run"] : [])]}
            onValueChange={(values) => {
              onProviderEnabledChange(values.includes("enabled"));
              onDryRunChange(values.includes("dry-run"));
            }}
            options={[
              {
                value: "enabled",
                label: "فعال‌سازی ارسال واقعی",
                description: "اجازه ارسال به ارائه‌دهنده",
              },
              {
                value: "dry-run",
                label: "حالت آزمایشی",
                description: "ثبت فرایند بدون ارسال واقعی",
              },
            ]}
          />
          <Button
            className="justify-self-start"
            variant="soft"
            disabled={pending || !lineNumber}
            loading={pending}
            loadingLabel="در حال ذخیره…"
            onClick={onSubmit}
          >
            <Save size={16} aria-hidden="true" />
            ذخیره امن
          </Button>
        </div>
      </Card>
    </section>
  );
}
