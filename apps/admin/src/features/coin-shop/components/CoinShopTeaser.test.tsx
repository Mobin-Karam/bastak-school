import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CoinShopTeaser } from "./CoinShopTeaser";

afterEach(cleanup);

describe("CoinShopTeaser", () => {
  it.each([
    ["student", "بازار سکه‌های من"],
    ["school", "بازار سکه دانش‌آموزان"],
  ] as const)("shows the locked future marketplace to the %s audience", (audience, title) => {
    render(
      <MemoryRouter>
        <CoinShopTeaser audience={audience} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByRole("timer", { name: /بازار سکه/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /دیدن بازار آینده/ })).toHaveAttribute(
      "href",
      "/admin/coin-shop",
    );
  });
});
