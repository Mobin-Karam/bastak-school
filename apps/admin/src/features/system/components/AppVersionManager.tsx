import { useState } from "react";
import { AppWindow, Save } from "lucide-react";
import type { AppVersion } from "../api/system.api";
import { Button, Card, EmptyState, Field, Input, Textarea } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { systemCopy } from "../system-locale";

export function AppVersionManager({
  versions,
  loading,
  error,
  busy,
  canManage,
  onRetry,
  onSave,
}: {
  versions?: AppVersion[];
  loading: boolean;
  error: boolean;
  busy: boolean;
  canManage: boolean;
  onRetry: () => void;
  onSave: (app: string, value: { version: string; notes: string }) => void;
}) {
  const { language } = useLocale();
  const copy = systemCopy(language);
  const [editing, setEditing] = useState<AppVersion | null>(null);
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
          <AppWindow size={19} />
        </span>
        <div>
          <h3 className="font-bold">{copy.versionManagerTitle}</h3>
          <p className="text-xs text-slate-500">{copy.versionManagerDescription}</p>
        </div>
      </div>
      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ) : error ? (
        <div role="alert">
          <p className="text-sm text-rose-700">{copy.versionsFailed}</p>
          <Button variant="soft" onClick={onRetry}>
            {copy.retry}
          </Button>
        </div>
      ) : !versions?.length ? (
        <EmptyState title={copy.noVersions} />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {versions.map((item) => (
            <button
              type="button"
              disabled={!canManage}
              key={item.app}
              onClick={() => setEditing({ ...item })}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-start disabled:cursor-default dark:border-slate-700 dark:bg-slate-900"
            >
              <span>
                <strong>{item.app}</strong>
                <small className="mt-1 block text-slate-500">{item.notes || copy.noNotes}</small>
              </span>
              <span className="font-mono text-sm" dir="ltr">
                {item.version}
              </span>
            </button>
          ))}
        </div>
      )}
      {editing ? (
        <form
          className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-[180px_1fr_auto] dark:border-slate-800"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(editing.app, { version: editing.version, notes: editing.notes });
          }}
        >
          <Field label={copy.versionFor(editing.app)}>
            <Input
              required
              dir="ltr"
              pattern="v?\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?"
              value={editing.version}
              onChange={(e) => setEditing({ ...editing, version: e.target.value })}
            />
          </Field>
          <Field label={copy.notes}>
            <Textarea
              rows={1}
              maxLength={2000}
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
          </Field>
          <div className="flex gap-2 md:mt-6">
            <Button loading={busy}>
              <Save size={15} />
              {copy.save}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {copy.cancel}
            </Button>
          </div>
        </form>
      ) : null}
      {!canManage && !loading && !error ? (
        <p className="mt-3 text-xs text-slate-500">{copy.versionsReadOnly}</p>
      ) : null}
    </Card>
  );
}
