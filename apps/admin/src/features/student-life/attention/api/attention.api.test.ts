import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../shared/api/api";
import { getAttentionQueue } from "./attention.api";

describe("attention queue API contract", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses the bounded dashboard attention endpoint", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ generatedAt: "", items: [] } as never);

    await getAttentionQueue(500);

    expect(get).toHaveBeenCalledWith("/dashboard/attention?limit=100");
  });
});
