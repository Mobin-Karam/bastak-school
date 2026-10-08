export { AuthProvider } from "./components/AuthProvider";
export { CapabilityGate } from "./components/CapabilityGate";
export { UnsupportedRoleModal } from "./components/UnsupportedRoleModal";
export { LoginPage } from "./pages/LoginPage";
export { useAuth } from "./hooks/useAuth";
export { isSupportedAdminPortalRole } from "./lib/auth-session";

export type { AuthState, AuthStatus, BackendHealth, LoginResponse } from "./model/auth.types";
