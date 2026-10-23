import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { useAuthLocale } from "../model/auth-locale";

export function BackendHealthStatus() {
  const { health, checkHealth } = useBackendHealth();
  const { copy } = useAuthLocale();
  const checking = health.status === "checking";
  const unavailable = health.status === "unavailable";

  return (
    <div
      role={unavailable ? "alert" : "status"}
      aria-live="polite"
      className={[
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5",
        unavailable
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : checking
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-emerald-200 bg-emerald-50 text-emerald-800",
      ].join(" ")}
    >
      {checking ? (
        <RefreshCw className="shrink-0 animate-spin motion-reduce:animate-none" size={16} />
      ) : unavailable ? (
        <WifiOff size={16} />
      ) : (
        <CheckCircle2 size={16} />
      )}

      <span className="min-w-0 flex-1 truncate">
        {checking
          ? copy.connectionChecking
          : unavailable
            ? copy.connectionUnavailable
            : copy.connectionReady(health.data?.version || "—")}
      </span>

      <button
        type="button"
        className="grid size-8 shrink-0 place-items-center rounded-lg transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current disabled:cursor-wait disabled:opacity-60"
        aria-label={copy.retryConnection}
        title={copy.retryConnection}
        disabled={checking}
        onClick={() => void checkHealth()}
      >
        <RefreshCw
          className={checking ? "animate-spin motion-reduce:animate-none" : undefined}
          size={15}
        />
      </button>
    </div>
  );
}
