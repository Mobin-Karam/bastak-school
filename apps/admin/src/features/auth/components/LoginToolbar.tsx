import { useAuthLocale } from "../model/auth-locale";

import { LoginBrand } from "./LoginBrand";
import { DevBackendSwitcher } from "../../../app/dev/DevBackendSwitcher";
import { ThemeSwitcher } from "../../../shared/theme/theme";

export function LoginToolbar() {
  const { copy } = useAuthLocale();

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
        <ThemeSwitcher />
        <DevBackendSwitcher />
      </div>
    </header>
  );
}
