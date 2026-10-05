import {
  BookOpenCheck,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

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
        bg-gradient-to-br
        from-teal-950
        via-teal-900
        to-slate-950
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
          pointer-events-none
          absolute -start-24 top-20
          size-72 rounded-full
          bg-teal-300/10
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -bottom-32 -end-24
          size-80 rounded-full
          bg-sky-400/[0.06]
          blur-3xl
        "
      />

      <div className="relative z-[1]">
        <LoginBrand
          variant="hero"
          brandName={copy.brandName}
          productName={copy.productName}
        />

        <div className="mt-12 max-w-md">
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

          <p className="mt-3 text-sm leading-7 text-slate-300">
            {copy.heroDescription}
          </p>
        </div>
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