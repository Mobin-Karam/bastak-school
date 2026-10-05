import { BookOpenCheck } from "lucide-react";

type LoginBrandProps = {
  brandName: string;
  productName: string;
  variant?: "compact" | "hero";
};

export function LoginBrand({ brandName, productName, variant = "compact" }: LoginBrandProps) {
  if (variant === "hero") {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="
            grid size-11 shrink-0 place-items-center
            rounded-xl
            bg-white/10 text-white
            ring-1 ring-white/15
          "
        >
          <BookOpenCheck size={21} aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <strong className="block truncate text-base font-black text-white">{productName}</strong>

          <span
            className="
              mt-0.5 block truncate
              text-[10px] font-bold uppercase
              tracking-[0.16em]
              text-teal-200
            "
          >
            {brandName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="
          grid size-9 shrink-0 place-items-center
          rounded-xl
          bg-brand text-white
          shadow-sm
        "
      >
        <BookOpenCheck size={18} aria-hidden="true" />
      </span>

      <div className="min-w-0">
        <strong className="block truncate text-sm font-black text-ink">{productName}</strong>

        <span
          className="
            mt-0.5 block truncate
            text-[9px] font-bold uppercase
            tracking-[0.14em]
            text-brand
          "
        >
          {brandName}
        </span>
      </div>
    </div>
  );
}
