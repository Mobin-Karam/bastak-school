export { AuthProvider } from "./components/AuthProvider";
export { CapabilityGate } from "./components/CapabilityGate";
export { UnsupportedRoleModal } from "./components/UnsupportedRoleModal";
export { LoginPage } from "./pages/LoginPage";
export { LoginSuccessSplash } from "./components/LoginSuccessSplash";
export { useAuth } from "./hooks/useAuth";
export { isReleasedSchoolPortalRole, isSupportedAdminPortalRole } from "./lib/auth-session";

export type { AuthState, AuthStatus, BackendHealth, LoginResponse } from "./model/auth.types.ts";
