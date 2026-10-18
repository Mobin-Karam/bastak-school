import { ArrowLeft, MonitorSmartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { Session } from "../model/system.types";
import { settingsCopy } from "../../settings/settings-locale";
export function SystemSessionsPanel({
  sessions = [],
  loading,
}: {
  sessions?: Session[];
  loading?: boolean;
}) {
  const { language, profile } = useLocale();
  const copy = settingsCopy(language);
  return (
    <Card className="h-full">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-brand">
            <MonitorSmartphone size={20} />
          </span>
          <div>
            <h3 className="font-bold">{copy.sessionsTitle}</h3>
            <p className="text-xs text-slate-500">{copy.sessionsDescription}</p>
          </div>
        </div>
        <Badge>
          {sessions.length.toLocaleString(profile.locale)} {copy.active}
        </Badge>
      </div>
      {loading ? (
        <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
      ) : sessions.length ? (
        <div className="grid gap-2">
          {sessions.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
            >
              <span className="min-w-0 truncate">
                {session.current ? copy.currentDevice : session.userAgent || copy.activeDevice}
              </span>
              <Badge tone={session.current ? "green" : "neutral"}>
                {session.current ? copy.current : session.ipAddress || copy.active}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={copy.noSessions} />
      )}
      <Link
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand"
        to="/admin/settings"
      >
        <span>{language === "fa" ? "مدیریت و بستن نشست‌ها" : "Manage and close sessions"}</span>
        <ArrowLeft size={14} />
      </Link>
    </Card>
  );
}
