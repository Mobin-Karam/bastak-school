import { afterEach, describe, expect, it, vi } from "vitest";
import { attendanceRequestId } from "./attendance-request-id";
afterEach(() => vi.unstubAllGlobals());
describe("attendance request IDs in HTTP previews", () => {
  it("generates valid unique UUID v4 values when randomUUID is unavailable", () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal("crypto", { getRandomValues });
    const first = attendanceRequestId(),
      second = attendanceRequestId();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(first).not.toBe(second);
  });
});
