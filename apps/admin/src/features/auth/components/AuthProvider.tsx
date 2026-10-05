import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, ApiError, onAuthFailure, setApiWorkContext } from "../../../shared/api/api";
import type { AccountContext, OrganizationSummary, User } from "../../../shared/types/domain";
import { getCurrentUser, getAccountContext, loginRequest, logoutRequest } from "../api/auth.api";
import {
  AUTH_SIGNAL_KEY,
  adminPortalRole,
  normalizeUser,
  PENDING_LOGOUT_KEY,
  signalAuthEvent,
} from "../lib/auth-session";
import type { AuthState, AuthStatus } from "../model/auth.types";
import { authSessionCopy } from "../model/auth-locale";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";

export const AuthContext = createContext<AuthState | null>(null);

const MAX_RESTORE_ATTEMPTS = 3;
const RESTORE_RETRY_DELAY_MS = 1_800;

export function AuthProvider({ children }: { children: ReactNode }) {
  const language = useOptionalAdminLanguage();
  const copy = authSessionCopy(language);
  const [user, setUser] = useState<User | null>(null);
  const [accountContext, setAccountContext] = useState<AccountContext | null>(null);
  const [activeRole, setActiveRoleState] = useState<AccountContext["roles"][number] | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [message, setMessage] = useState(copy.sessionChecking);
  const operation = useRef(0);
  const retryTimer = useRef<number>();
  const restoreAttempts = useRef(0);
  const lastCheck = useRef(0);

  const finishLocalLogout = useCallback((text: string, broadcast = true) => {
    operation.current += 1;
    api.setCsrf();
    setUser(null);
    setAccountContext(null);
    setActiveRoleState(null);
    setApiWorkContext();
    setStatus("anonymous");
    setMessage(text);

    if (broadcast) {
      signalAuthEvent("logout");
    }
  }, []);

  const restore = useCallback(async () => {
    const current = ++operation.current;
    window.clearTimeout(retryTimer.current);

    setStatus((value) => (value === "authenticated" ? value : "checking"));

    setMessage(copy.sessionChecking);

    try {
      const raw = await getCurrentUser();
      const context = await getAccountContext();
      const me = normalizeUser({ ...context.user, role: context.roles[0] ?? raw.role });

      if (current !== operation.current) return;

      const role = adminPortalRole(context.roles);
      if (!role) {
        try {
          await logoutRequest();
        } catch {
          sessionStorage.setItem(PENDING_LOGOUT_KEY, "1");
        }

        finishLocalLogout(copy.nonAdminAccount);
        return;
      }

      lastCheck.current = Date.now();
      restoreAttempts.current = 0;
      setUser(me);
      setAccountContext(context);
      setActiveRoleState(role);
      setApiWorkContext(role, context.activeOrganization?.id);
      setStatus("authenticated");
      setMessage("");
    } catch (error) {
      if (current !== operation.current) return;

      if (error instanceof ApiError && error.status === 401) {
        restoreAttempts.current = 0;
        finishLocalLogout("");
        return;
      }

      restoreAttempts.current += 1;

      if (restoreAttempts.current >= MAX_RESTORE_ATTEMPTS) {
        finishLocalLogout(copy.serverUnresponsive, false);
        return;
      }

      setStatus("checking");

      setMessage(copy.serverUnreachable(restoreAttempts.current, MAX_RESTORE_ATTEMPTS));

      retryTimer.current = window.setTimeout(() => void restore(), RESTORE_RETRY_DELAY_MS);
    }
  }, [copy, finishLocalLogout]);

  useEffect(() => {
    if (sessionStorage.getItem(PENDING_LOGOUT_KEY) === "1") {
      setStatus("logging-out");

      logoutRequest()
        .then(() => {
          sessionStorage.removeItem(PENDING_LOGOUT_KEY);
          finishLocalLogout(copy.previousLogoutComplete);
        })
        .catch(() => finishLocalLogout(copy.previousLogoutPending, false));
    } else {
      void restore();
    }

    const stopAuthFailure = onAuthFailure((error) =>
      finishLocalLogout(error.message || copy.sessionExpired),
    );

    const sync = () => {
      if (!document.hidden && Date.now() - lastCheck.current > 15_000) {
        void restore();
      }
    };

    const online = () => {
      if (sessionStorage.getItem(PENDING_LOGOUT_KEY) === "1") {
        void logoutRequest().then(() => {
          sessionStorage.removeItem(PENDING_LOGOUT_KEY);
          finishLocalLogout(copy.serverLogoutComplete);
        });
      } else {
        sync();
      }
    };

    const storage = (event: StorageEvent) => {
      if (event.key !== AUTH_SIGNAL_KEY || !event.newValue) {
        return;
      }

      try {
        const data = JSON.parse(event.newValue) as {
          kind?: string;
        };

        if (data.kind === "logout") {
          finishLocalLogout(copy.sessionExpired, false);
        } else if (data.kind === "login") {
          void restore();
        }
      } catch {
        /* Ignore malformed cross-tab signals. */
      }
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("online", online);
    window.addEventListener("storage", storage);

    return () => {
      stopAuthFailure();
      window.clearTimeout(retryTimer.current);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("online", online);
      window.removeEventListener("storage", storage);
    };
  }, [copy, finishLocalLogout, restore]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      status,
      message,
      restore,
      stopRestore() {
        window.clearTimeout(retryTimer.current);
        restoreAttempts.current = 0;
        finishLocalLogout(copy.restoreStopped, false);
      },

      async login(username, password) {
        const current = ++operation.current;
        setMessage("");

        const data = await loginRequest(username, password);

        if (current !== operation.current) return;

        const normalizedUser = normalizeUser(data.user);
        let context: AccountContext;
        try {
          context = await getAccountContext();
        } catch (error) {
          await logoutRequest().catch(() => sessionStorage.setItem(PENDING_LOGOUT_KEY, "1"));
          finishLocalLogout(copy.accessVerificationFailed);
          throw error;
        }
        const contextUser = normalizeUser({
          ...context.user,
          role: context.roles[0] ?? normalizedUser.role,
        });
        const role = adminPortalRole(context.roles);
        if (!role) {
          try {
            await logoutRequest();
          } catch {
            sessionStorage.setItem(PENDING_LOGOUT_KEY, "1");
          }

          finishLocalLogout(copy.nonAdminAccount);
          throw new Error(copy.nonAdminAccount);
        }

        sessionStorage.removeItem(PENDING_LOGOUT_KEY);
        api.setCsrf(data.csrfToken);
        setUser(contextUser);
        setAccountContext(context);
        setActiveRoleState(role);
        setApiWorkContext(role, context.activeOrganization?.id);
        setStatus("authenticated");
        restoreAttempts.current = 0;
        lastCheck.current = Date.now();
        signalAuthEvent("login");
      },

      async logout() {
        operation.current += 1;
        setStatus("logging-out");
        sessionStorage.setItem(PENDING_LOGOUT_KEY, "1");

        try {
          await logoutRequest();
          sessionStorage.removeItem(PENDING_LOGOUT_KEY);
          finishLocalLogout(copy.signedOut);
        } catch (error) {
          finishLocalLogout(
            error instanceof ApiError && error.status === 0
              ? copy.localLogoutPending
              : copy.signedOut,
          );
        }
      },

      hasRole(role) {
        return (
          accountContext?.roles.some((item) => item.toLowerCase() === String(role).toLowerCase()) ??
          user?.role === role
        );
      },
      context: accountContext,
      can(capability) {
        const scoped = accountContext?.workContexts?.find((item) => item.role === activeRole);
        return (scoped?.capabilities ?? accountContext?.capabilities ?? []).includes(capability);
      },
      activeRole,
      capabilities:
        accountContext?.workContexts?.find((item) => item.role === activeRole)?.capabilities ??
        accountContext?.capabilities ??
        [],
      setActiveRole(role) {
        if (!accountContext?.roles.includes(role) || adminPortalRole([role]) !== role) return;
        setActiveRoleState(role);
        setApiWorkContext(role, accountContext.activeOrganization?.id);
      },
      setActiveOrganization(organization: OrganizationSummary | null) {
        setAccountContext((current) =>
          current ? { ...current, activeOrganization: organization } : current,
        );
        setApiWorkContext(activeRole ?? undefined, organization?.id);
      },
    }),
    [copy, finishLocalLogout, message, restore, status, user, accountContext, activeRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
