import { BookOpenCheck, ShieldCheck, UsersRound } from "lucide-react";

import { useAuthLocale } from "../model/auth-locale";

import { LoginBenefit } from "./LoginBenefit";
import { LoginBrand } from "./LoginBrand";

export function LoginHero() {
  const { copy } = useAuthLocale();

  return (
    <aside
      className="
        relative hidden
        min-h-[620px]
        overflow-hidden
        bg-[#0e324d]
        p-9 text-white

        xl:flex
        xl:flex-col
        xl:justify-between

        2xl:p-11
      "
    >
      <div
        aria-hidden="true"
        className="
          absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35
        "
        style={{ backgroundImage: "url('/bg-login.png')" }}
      />

      <div
        aria-hidden="true"
        className="
          absolute inset-0 bg-[linear-gradient(160deg,rgb(7_44_65_/_86%),rgb(0_95_92_/_58%),rgb(7_38_61_/_91%))]
        "
      />

      <div className="relative z-[1]">
        <LoginBrand variant="hero" brandName={copy.brandName} productName={copy.productName} />

        {/* <div className="mt-12 max-w-md">
          <h2
            className="
              text-2xl font-black
              leading-[1.7]
              tracking-tight

              2xl:text-3xl
            "
          >
            {copy.heroTitle}
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-300">{copy.heroDescription}</p>
        </div> */}
      </div>

      <div className="relative z-[1] grid gap-5">
        <LoginBenefit
          icon={<UsersRound size={17} aria-hidden="true" />}
          title={copy.benefitRoleTitle}
          text={copy.benefitRoleText}
        />

        <LoginBenefit
          icon={<ShieldCheck size={17} aria-hidden="true" />}
          title={copy.benefitSecureTitle}
          text={copy.benefitSecureText}
        />

        <LoginBenefit
          icon={<BookOpenCheck size={17} aria-hidden="true" />}
          title={copy.benefitUnifiedTitle}
          text={copy.benefitUnifiedText}
        />
      </div>
    </aside>
  );
}
