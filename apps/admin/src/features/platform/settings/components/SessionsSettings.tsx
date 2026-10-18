import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { Laptop, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { settingsCopy } from "../settings-locale";
import type { Session } from "../model/settings.types";
export function SessionsSettings({
  sessions,
  revoke,
  formatDateTime,
  confirm,
}: {
  sessions: UseQueryResult<Session[], Error>;
  revoke: UseMutationResult<unknown, Error, string>;
  formatDateTime: (value?: string | Date) => string;
  confirm: (id: string) => void;
}) {
  const { language, profile } = useLocale();
  const copy = settingsCopy(language);
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-brand">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h3 className="font-bold">{copy.sessionsTitle}</h3>
            <p className="text-xs text-slate-500">{copy.sessionsDescription}</p>
          </div>
        </div>
        <Badge>
          {(sessions.data?.length || 0).toLocaleString(profile.locale)} {copy.active}
        </Badge>
      </div>
      {sessions.isLoading ? (
        <div className="grid gap-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : sessions.isError ? (
        <EmptyState
          title={copy.sessionsLoadFailed}
          action={
            <Button variant="soft" onClick={() => void sessions.refetch()}>
              <RefreshCw size={14} />
              {copy.retry}
            </Button>
          }
        />
      ) : sessions.data?.length ? (
        <div className="grid gap-2">
          {sessions.data.map((session) => {
            const mobile = /mobile|android|iphone/i.test(session.userAgent || "");
            return (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {mobile ? (
                    <Smartphone className="mt-0.5 shrink-0 text-slate-400" size={18} />
                  ) : (
                    <Laptop className="mt-0.5 shrink-0 text-slate-400" size={18} />
                  )}
                  <div className="min-w-0">
                    <strong>{session.current ? copy.currentDevice : copy.activeDevice}</strong>
                    <p className="truncate text-xs text-slate-500" dir="ltr">
                      {session.ipAddress || copy.unknownIp} ·{" "}
                      {(session.userAgent || copy.unknownBrowser).slice(0, 100)}
                    </p>
                    {session.lastSeenAt ? (
                      <small className="text-slate-400">
                        {copy.lastActivity}: {formatDateTime(session.lastSeenAt)}
                      </small>
                    ) : null}
                  </div>
                </div>
                {session.current ? (
                  <Badge tone="green">{copy.current}</Badge>
                ) : (
                  <Button
                    variant="danger"
                    loading={revoke.isPending && revoke.variables === session.id}
                    disabled={revoke.isPending}
                    onClick={() => confirm(session.id)}
                  >
                    {copy.revoke}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title={copy.noSessions} />
      )}
    </Card>
  );
}
