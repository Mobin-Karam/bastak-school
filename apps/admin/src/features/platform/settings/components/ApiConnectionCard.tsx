import { CheckCircle2, Copy, Server } from "lucide-react";
import { useState } from "react";
import { getBackendTargetUrl } from "../../../shared/api/api";
import { Button, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { settingsCopy } from "../settings-locale";

export function ApiConnectionCard() {
  const { language } = useLocale();
  const copyText = settingsCopy(language);
  const [copied, setCopied] = useState(false);
  const target = getBackendTargetUrl();
  async function copy() {
    await navigator.clipboard.writeText(target);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-700">
          <Server size={20} />
        </span>
        <div>
          <h3 className="font-bold">{copyText.apiTitle}</h3>
          <p className="text-xs text-slate-500">{copyText.apiDescription}</p>
        </div>
      </div>
      <div
        className="rounded-lg border bg-slate-950 p-3 text-left text-xs text-slate-100"
        dir="ltr"
      >
        <span className="mb-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-1 font-bold text-emerald-300">
          API v2
        </span>
        <p className="break-all font-mono">{target}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{copyText.apiContract}</span>
        <Button className="shrink-0" variant="soft" onClick={() => void copy()}>
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}{" "}
          {copied ? copyText.copied : copyText.copy}
        </Button>
      </div>
    </Card>
  );
}
