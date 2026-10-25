import type { AccountContext, OrganizationSummary, User } from "../../../../shared/types/domain";

export type AuthStatus = "checking" | "authenticated" | "anonymous" | "logging-out" | "unavailable";

export type AuthState = {
  user: User | null;
  status: AuthStatus;
  message: string;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  stopRestore: () => void;
  hasRole: (role: User["role"]) => boolean;
  context: AccountContext | null;
  can: (capability: string) => boolean;
  canAny: (capabilities: readonly string[]) => boolean;
  canAll: (capabilities: readonly string[]) => boolean;
  activeRole: AccountContext["roles"][number] | null;
  capabilities: string[];
  setActiveRole: (role: AccountContext["roles"][number]) => Promise<void>;
  setActiveOrganization: (organization: OrganizationSummary | null) => Promise<void>;
};

export type LoginResponse = {
  user: User;
  csrfToken?: string;
};

export type BackendHealth = {
  status?: string;
  version?: string;
};
