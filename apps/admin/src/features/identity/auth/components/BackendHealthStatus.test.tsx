import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkHealth = vi.fn();
let health: { status: "checking" | "ready" | "unavailable"; data?: { version?: string } };

vi.mock("../hooks/useBackendHealth", () => ({
  useBackendHealth: () => ({ health, checkHealth }),
}));
vi.mock("../model/auth-locale", () => ({
  useAuthLocale: () => ({
    copy: {
      connectionChecking: "در حال بررسی اتصال…",
      connectionUnavailable: "این بک‌اند در دسترس نیست.",
      connectionReady: (version: string) => `اتصال برقرار است • نسخه ${version}`,
      retryConnection: "بررسی دوباره اتصال",
    },
  }),
}));

import { BackendHealthStatus } from "./BackendHealthStatus";

describe("BackendHealthStatus", () => {
  afterEach(cleanup);

  beforeEach(() => {
    checkHealth.mockClear();
    health = { status: "checking" };
  });

  it("disables a duplicate probe while checking", () => {
    render(<BackendHealthStatus />);

    expect(screen.getByRole("status")).toHaveTextContent("در حال بررسی اتصال…");
    expect(screen.getByRole("button", { name: "بررسی دوباره اتصال" })).toBeDisabled();
  });

  it("makes an unavailable backend an announced, retryable state", () => {
    health = { status: "unavailable" };
    render(<BackendHealthStatus />);

    expect(screen.getByRole("alert")).toHaveTextContent("این بک‌اند در دسترس نیست.");
    fireEvent.click(screen.getByRole("button", { name: "بررسی دوباره اتصال" }));
    expect(checkHealth).toHaveBeenCalledOnce();
  });

  it("shows the server version once reachable", () => {
    health = { status: "ready", data: { version: "2.0.0" } };
    render(<BackendHealthStatus />);

    expect(screen.getByRole("status")).toHaveTextContent("نسخه 2.0.0");
  });
});
