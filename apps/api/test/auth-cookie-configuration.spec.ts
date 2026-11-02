import { ConfigService } from "@nestjs/config";
import {
  AuthController,
  loginPortalFromOrigin,
} from "../src/modules/auth/auth.controller";
import { normalizeCookieDomain } from "../src/config/auth.config";
import appConfig from "../src/config/app.config";
import { resolveTrustedProxy } from "../src/config/trusted-proxy";

function response() {
  return {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

const loginResult = {
  user: { id: "user-1", username: "student", role: "STUDENT" },
  accessToken: "access-token",
  refreshToken: "refresh-token",
  csrfToken: "csrf-token",
  expiresAt: new Date("2030-01-01T00:00:00Z"),
  refreshExpiresAt: new Date("2030-02-01T00:00:00Z"),
};

describe("API cookie and proxy configuration", () => {
  it("derives the login portal only from approved browser origins", () => {
    expect(loginPortalFromOrigin("https://stud.sultano.ir")).toBe("student");
    expect(loginPortalFromOrigin("https://app.sultano.ir")).toBe("admin");
    expect(loginPortalFromOrigin("http://stud.localhost:5173")).toBe("student");
    expect(loginPortalFromOrigin("https://evil.example")).toBeUndefined();
    expect(loginPortalFromOrigin(undefined)).toBeUndefined();
  });

  it("keeps access and refresh cookies host-only by default", async () => {
    const auth = {
      login: jest.fn().mockResolvedValue(loginResult),
      logout: jest.fn(),
    };
    const config = {
      get: (_key: string, fallback?: unknown) => fallback,
    } as ConfigService;
    const controller = new AuthController(auth as never, config);
    const res = response();

    await controller.login(
      { phoneNumber: "09120000000", password: "password" },
      { ip: "127.0.0.1" } as never,
      res as never,
    );
    expect(res.setCookie).toHaveBeenCalledTimes(2);
    expect(res.setCookie.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    expect(res.setCookie.mock.calls[0][2].domain).toBeUndefined();
  });

  it("uses the configured domain consistently when setting and clearing cookies", async () => {
    const auth = {
      login: jest.fn().mockResolvedValue(loginResult),
      logout: jest.fn(),
    };
    const config = {
      get: (key: string, fallback?: unknown) =>
        key === "cookieDomain" ? "sultano.ir" : fallback,
    } as ConfigService;
    const controller = new AuthController(auth as never, config);
    const res = response();

    await controller.login(
      { phoneNumber: "09120000000", password: "password" },
      { ip: "127.0.0.1" } as never,
      res as never,
    );
    await controller.logout(
      { cookies: {}, headers: {} } as never,
      res as never,
    );
    expect(res.setCookie.mock.calls[0][2].domain).toBe("sultano.ir");
    expect(res.clearCookie.mock.calls[0][1]).toMatchObject({
      domain: "sultano.ir",
      path: "/",
    });
  });

  it("allows session bootstrap only from an approved origin with the custom header", async () => {
    const auth = {
      bootstrapSession: jest.fn().mockResolvedValue(loginResult),
    };
    const config = {
      get: (key: string, fallback?: unknown) =>
        key === "corsOrigins" ? ["https://app.sultano.ir"] : fallback,
    } as ConfigService;
    const controller = new AuthController(auth as never, config);
    const res = response();

    await controller.bootstrapSession(
      {
        headers: {
          origin: "https://app.sultano.ir",
          "x-auth-session-bootstrap": "1",
        },
        cookies: { moshaver_v2_refresh: "refresh-token" },
      } as never,
      res as never,
    );

    expect(auth.bootstrapSession).toHaveBeenCalledWith("refresh-token");
    expect(res.setCookie).toHaveBeenCalledTimes(2);
  });

  it("rejects session bootstrap without its trusted browser proof", async () => {
    const auth = { bootstrapSession: jest.fn() };
    const config = {
      get: (key: string, fallback?: unknown) =>
        key === "corsOrigins" ? ["https://app.sultano.ir"] : fallback,
    } as ConfigService;
    const controller = new AuthController(auth as never, config);

    await expect(
      controller.bootstrapSession(
        {
          headers: {
            origin: "https://evil.example",
            "x-auth-session-bootstrap": "1",
          },
          cookies: { moshaver_v2_refresh: "refresh-token" },
        } as never,
        response() as never,
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "SESSION_BOOTSTRAP_FORBIDDEN" } },
    });
    expect(auth.bootstrapSession).not.toHaveBeenCalled();
  });

  it("accepts only hostname cookie domains and trusts only local/private proxies", () => {
    expect(normalizeCookieDomain(".sultano.ir")).toBe("sultano.ir");
    expect(normalizeCookieDomain("")).toBeUndefined();
    expect(() => normalizeCookieDomain("https://sultano.ir")).toThrow();
    expect(resolveTrustedProxy("0", undefined)).toBe(false);
    expect(resolveTrustedProxy("1", undefined)).toEqual([
      "loopback",
      "linklocal",
      "uniquelocal",
    ]);
    expect(resolveTrustedProxy("1", "10.0.0.0/8, 127.0.0.1")).toEqual([
      "10.0.0.0/8",
      "127.0.0.1",
    ]);
  });

  it("allows the local Admin and Student portal hosts to bootstrap a session", () => {
    const config = appConfig();
    expect(config.corsOrigins).toContain("http://app.localhost:5173");
    expect(config.corsOrigins).toContain("http://stud.localhost:5173");
  });
});
