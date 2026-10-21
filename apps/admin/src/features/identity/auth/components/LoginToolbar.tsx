import { DevBackendSwitcher } from "../../../../app/dev/DevBackendSwitcher";
import { ThemeSwitcher } from "../../../../shared/theme/theme";

export function LoginToolbar() {
  return (
    <header
      className="
        flex min-h-10
        items-center justify-between
        gap-3
      "
    >
      <div className="ms-auto flex shrink-0 items-center gap-1.5">
        <ThemeSwitcher />
        <DevBackendSwitcher />
      </div>
    </header>
  );
}
