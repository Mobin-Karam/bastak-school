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
          src="/logo-bastak.webp"
          width={150}
          height={50}
          alt="نشان زانین"
          decoding="async"
          className="h-12 w-[7.5rem] shrink-0 object-contain object-center drop-shadow-sm"
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
        src="/logo-bastak.webp"
        width={112}
        height={42}
        alt="نشان زانین"
        decoding="async"
        className="h-10 w-24 shrink-0 object-contain object-center"
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
