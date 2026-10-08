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

export function loginRequest(phoneNumber: string, password: string) {
  return api.post<LoginResponse>("/auth/login", {
    phoneNumber,
    password,
  });
}

export type PlatformBootstrapInput = {
  phoneNumber: string;
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
  return api.post<{ phoneNumber: string }>("/onboarding/platform-bootstrap", input);
}

export function logoutRequest() {
  return api.post("/auth/logout", {});
}

export function checkBackendHealth() {
  return request<BackendHealth>("GET", "/health", undefined, {
    // Login must remain usable even if a reverse proxy or a sleeping backend
    // does not answer. This is a display-only probe, not an auth dependency.
    timeoutMs: 5_000,
    suppressAuthFailure: true,
    unversioned: true,
  });
}
