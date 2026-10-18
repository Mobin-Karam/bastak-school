import { Rocket } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { ReleaseDraft } from "../model/system.types";
import { systemCopy } from "../system-locale";
export function ReleasePanel({
  release,
  setRelease,
  busy,
  onSubmit,
}: {
  release: ReleaseDraft;
  setRelease: (value: ReleaseDraft) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const { language } = useLocale();
  const copy = systemCopy(language);
  const validVersion = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(release.version.trim());
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-700">
          <Rocket size={20} />
        </span>
        <div>
          <h3 className="font-bold">{copy.releasePanelTitle}</h3>
          <p className="text-xs text-slate-500">{copy.releasePanelDescription}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[180px_180px_1fr_auto]">
        <Field label={copy.application}>
          <Select
            value={release.app}
            onChange={(event) => setRelease({ ...release, app: event.target.value })}
          >
            <option value="admin">{copy.releaseAppAdmin}</option>
            <option value="student">{copy.releaseAppStudent}</option>
            <option value="backend">{copy.releaseAppBackend}</option>
          </Select>
        </Field>
        <Field label={copy.version}>
          <Input
            dir="ltr"
            placeholder="2.1.0"
            value={release.version}
            onChange={(event) => setRelease({ ...release, version: event.target.value.trim() })}
          />
        </Field>
        <Field label={copy.releaseNotes}>
          <Textarea
            maxLength={2000}
            rows={1}
            placeholder={copy.releaseNotesPlaceholder}
            value={release.notes}
            onChange={(event) => setRelease({ ...release, notes: event.target.value })}
          />
        </Field>
        <Button
          loading={busy}
          className="md:mt-6"
          disabled={!validVersion || busy}
          onClick={onSubmit}
        >
          {copy.saveRelease}
        </Button>
      </div>
      {release.version && !validVersion ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {copy.invalidVersion}
        </p>
      ) : null}
    </Card>
  );
}
