type LoginBrandProps = {
  brandName: string;
  productName: string;
  variant?: "compact" | "hero";
};

export function LoginBrand({ brandName, productName, variant = "compact" }: LoginBrandProps) {
  if (variant === "hero") {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="/app-logo.png"
          width={48}
          height={48}
          alt="نشان زانین"
          decoding="async"
          className="size-12 shrink-0 object-contain drop-shadow-sm"
        />

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
      <img
        src="/app-logo.png"
        width={40}
        height={40}
        alt="نشان زانین"
        decoding="async"
        className="size-10 shrink-0 object-contain"
      />

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
