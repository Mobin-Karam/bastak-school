import { cn } from "../lib/utils";

/** Compact, fixed-dimension brand asset so the shell never shifts while it loads. */
export function ZaninBrand({
  className,
  showName = true,
  priority = false,
}: {
  className?: string;
  showName?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <img
        src="/logo-bastak.webp"
        width={120}
        height={40}
        alt="Zanin / زانین"
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        className="h-8 w-auto shrink-0 rounded bg-white object-contain px-1 shadow-sm"
      />
      {showName ? (
        <span className="min-w-0 truncate text-sm font-black tracking-tight text-ink">
          <span dir="ltr">Zanin</span> <span className="text-slate-400">/</span> زانین
        </span>
      ) : null}
    </div>
  );
}
