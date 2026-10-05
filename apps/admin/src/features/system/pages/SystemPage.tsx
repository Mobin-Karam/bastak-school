import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Database, FileClock, PackageOpen, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import {
  downloadDatabaseBackup,
  getAppVersions,
  getAudit,
  getDatabaseMeta,
  getImportHistory,
  getReadiness,
  getReleases,
  getServiceHealth,
  restoreDatabase,
  saveAppRelease,
  saveAppVersion,
} from "../api/system.api";
import { AppVersionManager } from "../components/AppVersionManager";
import { DatabaseBackupPanel } from "../components/DatabaseBackupPanel";
import { ReleasePanel } from "../components/ReleasePanel";
import { SystemHistory } from "../components/SystemHistory";
import { RelaxationMusicManager } from "../components/RelaxationMusicManager";
import { ChatEmojiManager } from "../components/ChatEmojiManager";
import { systemCopy } from "../system-locale";

export type SystemView = "overview" | "releases" | "database" | "audit";
function QueryError({ retry }: { retry: () => void }) {
  const { language } = useLocale();
  const copy = systemCopy(language);
  return (
    <EmptyState
      title={copy.queryFailed}
      action={
        <Button variant="soft" onClick={retry}>
          <RefreshCw size={15} />
          {copy.retry}
        </Button>
      }
    />
  );
}

export function SystemPage({ view = "overview" }: { view?: SystemView }) {
  const auth = useAuth(),
    qc = useQueryClient(),
    modal = useModal();
  const { language, profile } = useLocale();
  const copy = systemCopy(language);
  const [file, setFile] = useState<File | null>(null);
  const [release, setRelease] = useState({ app: "admin", version: "", notes: "" });
  const canReadDatabase = auth.can("database.read"),
    canReadReleases = auth.can("release.read"),
    canManageReleases = auth.can("release.manage"),
    canReadAudit = auth.can("audit.read"),
    canReadImports = auth.can("import.preview");
  const health = useQuery({
    queryKey: ["system-health"],
    queryFn: getServiceHealth,
    enabled: view === "overview",
  });
  const ready = useQuery({
    queryKey: ["system-ready"],
    queryFn: getReadiness,
    enabled: view === "overview",
  });
  const database = useQuery({
    queryKey: ["system-database"],
    queryFn: getDatabaseMeta,
    enabled: view === "database" && canReadDatabase,
  });
  const versions = useQuery({
    queryKey: ["app-versions"],
    queryFn: getAppVersions,
    enabled: view === "releases" && canReadReleases,
  });
  const releases = useQuery({
    queryKey: ["app-releases"],
    queryFn: getReleases,
    enabled: view === "releases" && canReadReleases,
  });
  const audit = useQuery({
    queryKey: ["audit"],
    queryFn: getAudit,
    enabled: (view === "audit" || view === "database") && canReadAudit,
  });
  const imports = useQuery({
    queryKey: ["import-history"],
    queryFn: getImportHistory,
    enabled: view === "database" && canReadImports,
  });
  const backup = useMutation({
    mutationFn: downloadDatabaseBackup,
    onError: (e) => notify(e instanceof Error ? e.message : copy.backupFailed, "error"),
  });
  const restore = useMutation({
    mutationFn: () => (file ? restoreDatabase(file) : Promise.reject(new Error(copy.noFile))),
    onSuccess: () => {
      setFile(null);
      notify(copy.restored);
      void qc.invalidateQueries({ queryKey: ["system-database"] });
      // The database page renders restore events from the audit feed beside the
      // preflight. Refresh it immediately so the outcome is not stale until a
      // manual revisit.
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
    onError: (e) => notify(e instanceof Error ? e.message : copy.restoreFailed, "error"),
  });
  const databaseAuditRows = (audit.data ?? []).filter((row) =>
    String(row.action || "").startsWith("database."),
  );
  const saveRelease = useMutation({
    mutationFn: () => saveAppRelease(release),
    onSuccess: () => {
      setRelease({ ...release, version: "", notes: "" });
      notify(copy.releaseSaved);
      void qc.invalidateQueries({ queryKey: ["app-releases"] });
    },
    onError: (e) => notify(e instanceof Error ? e.message : copy.releaseFailed, "error"),
  });
  const updateVersion = useMutation({
    mutationFn: ({ app, value }: { app: string; value: { version: string; notes: string } }) =>
      saveAppVersion(app, value),
    onSuccess: () => {
      notify(copy.versionSaved);
      void qc.invalidateQueries({ queryKey: ["app-versions"] });
    },
    onError: (e) => notify(e instanceof Error ? e.message : copy.versionFailed, "error"),
  });
  async function download() {
    const result = await backup.mutateAsync();
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    notify(copy.backupDownloaded);
  }

  if (view === "overview") {
    const destinations = [
      {
        to: "/admin/releases",
        title: copy.releases,
        detail: copy.releasesDetail,
        icon: PackageOpen,
        show: canReadReleases,
      },
      {
        to: "/admin/database",
        title: copy.database,
        detail: copy.databaseDetail,
        icon: Database,
        show: canReadDatabase,
      },
      {
        to: "/admin/audit",
        title: copy.audit,
        detail: copy.auditDetail,
        icon: ShieldCheck,
        show: canReadAudit,
      },
      {
        to: "/admin/settings",
        title: copy.account,
        detail: copy.accountDetail,
        icon: FileClock,
        show: true,
      },
    ].filter((item) => item.show);
    return (
      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold">
                <Activity size={18} />
                {copy.apiService}
              </span>
              <Badge tone={health.data?.status === "ok" ? "green" : "neutral"}>
                {health.isLoading ? copy.checking : health.data?.status || copy.unknown}
              </Badge>
            </div>
            {health.isError ? (
              <QueryError retry={() => void health.refetch()} />
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                {health.data?.service || copy.apiConnection}
              </p>
            )}
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold">
                <Database size={18} />
                {copy.dataReadiness}
              </span>
              <Badge tone={ready.data?.database === "ready" ? "green" : "neutral"}>
                {ready.isLoading ? copy.checking : ready.data?.database || copy.unknown}
              </Badge>
            </div>
            {ready.isError ? (
              <QueryError retry={() => void ready.refetch()} />
            ) : (
              <p className="mt-3 text-sm text-slate-500">{copy.databaseProbe}</p>
            )}
          </Card>
        </section>
        <section aria-labelledby="system-tools">
          <h2
            id="system-tools"
            className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200"
          >
            {copy.tools}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {destinations.map(({ to, title, detail, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-[var(--shadow-surface)] transition hover:border-brand/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Icon className="text-brand" size={22} />
                <strong className="mt-3 block">{title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>
              </Link>
            ))}
          </div>
        </section>
        {auth.hasRole("PLATFORM_ADMIN") ? (
          <>
            <ChatEmojiManager />
            <RelaxationMusicManager />
          </>
        ) : null}
      </div>
    );
  }
  if (view === "releases")
    return (
      <div className="grid gap-5">
        {!canManageReleases ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
            {copy.readOnly}
          </div>
        ) : null}
        {canManageReleases ? (
          <ReleasePanel
            release={release}
            setRelease={setRelease}
            busy={saveRelease.isPending}
            onSubmit={() =>
              void modal
                .confirm({
                  title: copy.newReleaseTitle,
                  description: `${release.app} · ${release.version}`,
                  confirmLabel: copy.saveRelease,
                })
                .then((ok) => ok && saveRelease.mutate())
            }
          />
        ) : null}
        <AppVersionManager
          versions={versions.data}
          loading={versions.isLoading}
          error={versions.isError}
          busy={updateVersion.isPending}
          canManage={canManageReleases}
          onRetry={() => void versions.refetch()}
          onSave={(app, value) => updateVersion.mutate({ app, value })}
        />
        <SystemHistory
          title={copy.releaseTitle}
          rows={releases.data}
          loading={releases.isLoading}
          error={releases.isError}
          onRetry={() => void releases.refetch()}
        />
      </div>
    );
  if (view === "database")
    return (
      <div className="grid gap-5">
        {database.isError ? (
          <Card className="p-5">
            <QueryError retry={() => void database.refetch()} />
          </Card>
        ) : (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={copy.databaseInfo}>
            {[
              [copy.engine, database.data?.engine],
              [copy.status, database.data?.status],
              [copy.migrations, database.data?.migrations?.toLocaleString(profile.locale)],
              [
                copy.size,
                database.data
                  ? `${(database.data.sizeBytes / 1024 / 1024).toLocaleString(profile.locale, { maximumFractionDigits: 1 })} MB`
                  : undefined,
              ],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <span className="text-xs text-slate-500">{label}</span>
                <strong className="mt-2 block">
                  {database.isLoading ? `${copy.checking}…` : value || copy.unknown}
                </strong>
              </Card>
            ))}
          </section>
        )}
        <DatabaseBackupPanel
          file={file}
          busy={restore.isPending}
          downloading={backup.isPending}
          setFile={setFile}
          canBackup={auth.can("database.backup")}
          canRestore={auth.can("database.restore")}
          restoreEnabled={Boolean(database.data?.remoteRestoreEnabled)}
          onDownload={() => void download()}
          onRestore={() =>
            void modal
              .confirm({
                title: copy.restoreTitle,
                description: copy.restoreDescription(file?.name || copy.selectedFile),
                tone: "danger",
                confirmLabel: copy.restore,
              })
              .then((ok) => ok && restore.mutate())
          }
        />
        {canReadAudit ? (
          <SystemHistory
            title={copy.backupHistory}
            rows={databaseAuditRows}
            loading={audit.isLoading}
            error={audit.isError}
            onRetry={() => void audit.refetch()}
          />
        ) : null}
        {canReadImports ? (
          <SystemHistory
            title={copy.importHistory}
            rows={imports.data}
            loading={imports.isLoading}
            error={imports.isError}
            onRetry={() => void imports.refetch()}
          />
        ) : null}
      </div>
    );
  return (
    <div className="grid gap-5">
      <SystemHistory
        title={copy.auditEvents}
        rows={audit.data}
        loading={audit.isLoading}
        error={audit.isError}
        onRetry={() => void audit.refetch()}
      />
    </div>
  );
}
