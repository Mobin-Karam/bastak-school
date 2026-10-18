import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../shared/api/api";
import { getCampaign } from "./sms.api";

describe("SMS API contract", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads a campaign detail through the read-capability endpoint", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({} as never);

    await getCampaign("campaign/id");

    expect(get).toHaveBeenCalledWith("/sms/campaigns/campaign%2Fid");
  });
});
