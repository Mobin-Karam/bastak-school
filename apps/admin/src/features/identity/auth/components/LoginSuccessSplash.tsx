import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import { brand, brandText } from "../../../../app/config/brand";

/** A brief, explicit-login-only transition before opening the workspace. */
export function LoginSuccessSplash() {
  const language = useOptionalAdminLanguage();
  const isPersian = language === "fa";
  const productName = brandText("name", isPersian ? "fa" : "en");

  return (
    <main
      dir={isPersian ? "rtl" : "ltr"}
      aria-label={productName}
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#0e324d] p-6 text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/bg-login.png')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(145deg,rgb(4_34_52_/_92%),rgb(0_105_96_/_68%),rgb(6_37_59_/_93%))]"
      />
      <section className="relative z-[1] grid max-w-sm justify-items-center text-center">
        <img
          src={brand.asset.logo}
          alt={brand.name.fa}
          width={360}
          height={120}
          className="h-auto w-64 max-w-full object-contain drop-shadow-[0_14px_30px_rgb(0_0_0_/_30%)] motion-safe:animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none"
        />
        <div className="mt-8 h-px w-16 bg-saffron/80" aria-hidden="true" />
        <p className="mt-5 text-sm font-bold text-white/90">
          {isPersian ? "خوش آمدید" : "Welcome"}
        </p>
        <p role="status" className="mt-2 text-xs text-white/70">
          {isPersian ? `در حال ورود به ${productName}` : `Opening ${productName}`}
        </p>
      </section>
    </main>
  );
}
