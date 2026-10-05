import { Languages } from "lucide-react";


import { useAuthLocale } from "../model/auth-locale";

import { LoginBrand } from "./LoginBrand";
import { DevBackendSwitcher } from "../../../app/dev/DevBackendSwitcher";

export function LoginToolbar() {
  const { copy, toggleLanguage } = useAuthLocale();

  return (
    <header
      className="
        flex min-h-10
        items-center justify-between
        gap-3
      "
    >
      <div className="min-w-0 xl:hidden">
        <LoginBrand brandName={copy.brandName} productName={copy.productName} />
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={copy.languageSwitch}
          title={copy.languageSwitch}
          className="
            inline-flex size-9
            items-center justify-center
            rounded-lg
            border border-[rgb(var(--border-subtle))]
            bg-[rgb(var(--surface-card))]
            text-slate-600

            transition-colors

            hover:bg-[rgb(var(--surface-muted))]
            hover:text-brand

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand/40

            dark:text-slate-300

            sm:w-auto
            sm:px-3
            sm:gap-1.5
          "
        >
          <Languages size={16} aria-hidden="true" />

          <span className="hidden text-xs font-bold sm:inline">{copy.languageSwitch}</span>
        </button>

        <DevBackendSwitcher />
      </div>
    </header>
  );
}
