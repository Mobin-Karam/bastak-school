import { RegistrationProvider } from "./registration.context";

export function RegistrationFeatureProvider({ children }: { children: React.ReactNode }) {
  return <RegistrationProvider>{children}</RegistrationProvider>;
}
