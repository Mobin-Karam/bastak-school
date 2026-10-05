import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { gooeyToast } from "goey-toast";
import { LocaleProvider } from "./locale";
import { AppToaster, notify, notifications } from "./notifications";

function renderToaster() {
  return render(
    <LocaleProvider>
      <AppToaster />
    </LocaleProvider>,
  );
}

describe("Gooey notification adapter", () => {
  afterEach(() => {
    gooeyToast.dismiss();
    localStorage.removeItem("moshaver-admin-location");
    cleanup();
  });

  it("renders typed RTL notifications", async () => {
    renderToaster();
    act(() => {
      notify("ذخیره شد", "success");
    });
    expect(await screen.findByText("ذخیره شد")).toBeInTheDocument();
    expect(document.querySelector("[data-sonner-toaster]")).toHaveAttribute("dir", "rtl");
  });

  it("uses an LTR notification surface for the international workspace", async () => {
    localStorage.setItem("moshaver-admin-location", "international");
    renderToaster();
    act(() => {
      notify("Saved", "success");
    });

    await screen.findByText("Saved");
    const toaster = document.querySelector("[data-sonner-toaster]");
    expect(toaster).toHaveAttribute("dir", "ltr");
  });

  it("updates and dismisses a notification by id", async () => {
    renderToaster();
    let id: string | number = "";
    act(() => {
      id = notifications.loading("در حال ذخیره");
    });
    expect((await screen.findAllByText("در حال ذخیره")).length).toBeGreaterThan(0);
    act(() => {
      notifications.update(id, "ذخیره شد");
    });
    expect(await screen.findByText("ذخیره شد")).toBeInTheDocument();
    act(() => {
      notifications.dismiss(id);
    });
  });

  it("deduplicates repeated typed feedback by stable id", () => {
    let first: string | number = "";
    let second: string | number = "";
    act(() => {
      first = notifications.error("ذخیره ناموفق بود");
      second = notifications.error("ذخیره ناموفق بود");
    });
    expect(first).toBe(second);
  });
});
