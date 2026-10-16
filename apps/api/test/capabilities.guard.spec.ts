import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { CapabilitiesGuard } from "../src/common/guards/capabilities.guard";
import {
  ANY_CAPABILITIES_KEY,
  CAPABILITIES_KEY,
} from "../src/common/decorators/capabilities.decorator";

function context(capabilities: string[]): ExecutionContext {
  return {
    getHandler: () => class Handler {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user: { capabilities } }) }),
  } as unknown as ExecutionContext;
}

describe("CapabilitiesGuard", () => {
  function guard(all: string[] | undefined, any: string[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === CAPABILITIES_KEY) return all;
        if (key === ANY_CAPABILITIES_KEY) return any;
        return undefined;
      }),
    } as unknown as Reflector;
    return new CapabilitiesGuard(reflector);
  }

  it("preserves all-of requirements", () => {
    expect(() =>
      guard(["attendance.read", "attendance.review"], undefined).canActivate(
        context(["attendance.read"]),
      ),
    ).toThrow();
    expect(
      guard(["attendance.read", "attendance.review"], undefined).canActivate(
        context(["attendance.read", "attendance.review"]),
      ),
    ).toBe(true);
  });

  it("allows one scoped authority from an any-of requirement", () => {
    expect(
      guard(undefined, [
        "attendance.manage",
        "attendance.class.manage",
      ]).canActivate(context(["attendance.class.manage"])),
    ).toBe(true);
    expect(() =>
      guard(undefined, [
        "attendance.manage",
        "attendance.class.manage",
      ]).canActivate(context(["attendance.read"])),
    ).toThrow();
  });

  it("requires both an all-of set and an any-of alternative when both are declared", () => {
    const guarded = guard(
      ["attendance.read"],
      ["attendance.manage", "attendance.class.manage"],
    );
    expect(() =>
      guarded.canActivate(context(["attendance.class.manage"])),
    ).toThrow();
    expect(
      guarded.canActivate(
        context(["attendance.read", "attendance.class.manage"]),
      ),
    ).toBe(true);
  });
});
