import { cn } from "../lib/utils";
import { brand } from "../../app/config/brand";

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
        src={brand.asset.logo}
        width={120}
        height={40}
        alt={brand.name.fa}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        className="h-8 w-auto shrink-0 rounded bg-white object-contain px-1 shadow-sm"
      />
      {showName ? (
        <span className="min-w-0 truncate text-sm font-black tracking-tight text-ink">
          {brand.name.fa}
        </span>
      ) : null}
    </div>
  );
}
