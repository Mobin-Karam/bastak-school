import { ConfigService } from "@nestjs/config";
import { AuthController } from "../src/modules/auth/auth.controller";
import { normalizeCookieDomain } from "../src/config/auth.config";
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
});
