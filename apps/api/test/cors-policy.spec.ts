import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  browserCorsMethods,
  isApprovedBrowserOrigin,
  parseCorsOrigins,
} from "../src/config/app.config";

const browserOrigins = ["https://app.sultano.ir", "https://stud.sultano.ir"];

describe("browser CORS policy", () => {
  it("normalizes configured origins without making CORS an authorization control", () => {
    expect(
      parseCorsOrigins("https://app.sultano.ir/, https://stud.sultano.ir", []),
    ).toEqual(browserOrigins);
    expect(
      isApprovedBrowserOrigin("https://app.sultano.ir", browserOrigins),
    ).toBe(true);
    expect(
      isApprovedBrowserOrigin("https://stud.sultano.ir", browserOrigins),
    ).toBe(true);
    expect(
      isApprovedBrowserOrigin("https://evil.example", browserOrigins),
    ).toBe(false);
    expect(isApprovedBrowserOrigin(undefined, browserOrigins)).toBe(false);
  });

  it("allows credentialed preflight for both portals but does not grant an unapproved origin", async () => {
    const app = Fastify();
    await app.register(cors, {
      origin: (origin, callback) =>
        callback(null, isApprovedBrowserOrigin(origin, browserOrigins)),
      credentials: true,
      methods: browserCorsMethods,
    });
    app.get("/protected", async () => ({ ok: true }));
    await app.ready();

    for (const origin of browserOrigins) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        const response = await app.inject({
          method: "OPTIONS",
          url: "/protected",
          headers: {
            origin,
            "access-control-request-method": method,
            "access-control-request-headers": "content-type,x-csrf-token",
          },
        });
        expect(response.statusCode).toBe(204);
        expect(response.headers["access-control-allow-origin"]).toBe(origin);
        expect(response.headers["access-control-allow-credentials"]).toBe(
          "true",
        );
        expect(
          response.headers["access-control-allow-methods"]
            ?.split(",")
            .map((value) => value.trim()),
        ).toContain(method);
      }
    }

    const denied = await app.inject({
      method: "OPTIONS",
      url: "/protected",
      headers: {
        origin: "https://evil.example",
        "access-control-request-method": "POST",
      },
    });
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });

  it("continues to serve no-Origin API clients without CORS response headers", async () => {
    const app = Fastify();
    await app.register(cors, {
      origin: (origin, callback) =>
        callback(null, isApprovedBrowserOrigin(origin, browserOrigins)),
      credentials: true,
      methods: browserCorsMethods,
    });
    app.get("/native-client", async () => ({ ok: true }));
    await app.ready();
    const response = await app.inject({ method: "GET", url: "/native-client" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });
});
