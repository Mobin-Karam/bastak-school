import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { toast } from "sonner";
import { ThemeProvider } from "../theme/theme";
import { LocaleProvider } from "./locale";
import { AppToaster, notify, notifications } from "./notifications";

function renderToaster() {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <AppToaster />
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe("Sonner notification adapter", () => {
  afterEach(() => {
    toast.dismiss();
    localStorage.removeItem("moshaver-admin-location");
    cleanup();
  });

  it("renders typed RTL notifications", async () => {
    renderToaster();
    act(() => {
      notify("ذخیره شد", "success");
    });
    expect(await screen.findByText("ذخیره شد")).toBeInTheDocument();
    const toaster = document.querySelector("[data-sonner-toaster]");
    expect(toaster).toHaveAttribute("dir", "rtl");
    expect(toaster).toHaveAttribute("data-y-position", "bottom");
    expect(toaster).toHaveAttribute("data-x-position", "left");
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
    expect(toaster).toHaveAttribute("data-x-position", "right");
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeInTheDocument();
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
  it("keeps errors visible longer than success feedback", () => {
    const error = notifications.error("Connection unavailable");
    const success = notifications.success("Completed");
    const errorToast = toast.getToasts().find((item) => item.id === error);
    const successToast = toast.getToasts().find((item) => item.id === success);
    expect(errorToast && "duration" in errorToast ? errorToast.duration : undefined).toBe(8000);
    expect(successToast && "duration" in successToast ? successToast.duration : undefined).toBe(
      5000,
    );
  });

  it("replaces pending feedback with the result and its description", async () => {
    renderToaster();
    let resolve!: (value: number) => void;
    const pending = new Promise<number>((done) => {
      resolve = done;
    });
    let result!: ReturnType<typeof notifications.promise<number>>;
    act(() => {
      result = notifications.promise(pending, {
        id: "save-test",
        loading: "Saving residents",
        success: (count) => ({ message: "Residents saved", description: `${count} residents` }),
        error: "Save failed",
      });
    });
    await screen.findByText("Saving residents");
    await act(async () => {
      resolve(3);
      await result.unwrap();
    });
    expect(await screen.findByText("3 residents")).toBeInTheDocument();
    expect(screen.queryByText("Saving residents")).not.toBeInTheDocument();
    expect(document.querySelectorAll("[data-sonner-toast]")).toHaveLength(1);
  });

  it("replaces a rejected request with actionable error feedback", async () => {
    renderToaster();
    let reject!: (error: Error) => void;
    const pending = new Promise<never>((_, fail) => {
      reject = fail;
    });
    let result!: ReturnType<typeof notifications.promise<never>>;
    act(() => {
      result = notifications.promise(pending, {
        id: "failed-test",
        loading: "Sending",
        error: () => ({
          message: "Send failed",
          description: "Your message was kept.",
          duration: 8000,
        }),
      });
    });
    await screen.findByText("Sending");
    await act(async () => {
      reject(new Error("Offline"));
      await expect(result.unwrap()).rejects.toThrow("Offline");
    });
    await screen.findByText("Your message was kept.");
    await waitFor(() =>
      expect(document.querySelector("[data-sonner-toast]")).toHaveAttribute("data-type", "error"),
    );
    expect(screen.queryByText("Sending")).not.toBeInTheDocument();
  });
});
