import { RefreshCw } from "lucide-react";
import { Button } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";

export function LiveHeader({
  generatedAt,
  fetching,
  formatDateTime,
  onRefresh,
}: {
  generatedAt?: string;
  fetching: boolean;
  formatDateTime: (value?: string | Date) => string;
  onRefresh: () => void;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-bold text-brand">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        {copy.realtime}
      </div>

      <div className="ms-auto flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-500">
          {generatedAt ? `${copy.lastSync} ${formatDateTime(generatedAt)}` : copy.waitingSync}
        </span>

        <Button variant="soft" loading={fetching} loadingLabel={copy.loading} onClick={onRefresh}>
          <RefreshCw size={16} />
          {copy.refresh}
        </Button>
      </div>
    </header>
  );
}
