import { api, request } from "../../../shared/api/api";
import type { AccountContext, User } from "../../../shared/types/domain";
import type { BackendHealth, LoginResponse } from "../model/auth.types";

export function getCurrentUser() {
  return request<User>("GET", "/auth/me", undefined, {
    timeoutMs: 7_000,
    suppressAuthFailure: true,
  });
}

export function getAccountContext() {
  return request<AccountContext>("GET", "/me/context", undefined, { suppressAuthFailure: true });
}

export function loginRequest(username: string, password: string) {
  return api.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
}

export type PlatformBootstrapInput = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export function getPlatformBootstrapStatus() {
  return request<{ setupRequired: boolean }>("GET", "/onboarding/platform-bootstrap", undefined, {
    suppressAuthFailure: true,
  });
}

export function bootstrapPlatformAdmin(input: PlatformBootstrapInput) {
  return api.post<{ username: string }>("/onboarding/platform-bootstrap", input);
}

export function logoutRequest() {
  return api.post("/auth/logout", {});
}

export function checkBackendHealth() {
  return request<BackendHealth>("GET", "/health", undefined, {
    suppressAuthFailure: true,
  });
}
