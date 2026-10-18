import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getClassOptions, type ClassOptions } from "../api/classes.api.ts";
import { BookEditor } from "./BookEditor";

vi.mock("../api/classes.api.ts", () => ({ getClassOptions: vi.fn() }));
const options = { teachers: [{ id: "teacher-1", name: "Teacher One" }] } as ClassOptions;
function mount(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <BookEditor
        language="en"
        schoolYear="1405-1406"
        classId="class-1"
        organizationId="org-1"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    </QueryClientProvider>,
  );
  return onSubmit;
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("book creation", () => {
  it("loads teachers after opening and saves without randomUUID", async () => {
    let resolve!: (value: ClassOptions) => void;
    vi.mocked(getClassOptions).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("Unavailable over HTTP");
    });
    const submit = mount();
    expect(screen.getByRole("button", { name: "Save to shelf" })).toBeDisabled();
    await act(async () => resolve(options));
    await userEvent.type(screen.getByRole("textbox", { name: "Book title" }), "Math");
    await userEvent.selectOptions(screen.getByRole("combobox"), "teacher-1");
    await userEvent.click(screen.getByRole("button", { name: "Save to shelf" }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^class-book-[0-9a-f]{32}$/),
        titleFa: "Math",
        teacherId: "teacher-1",
        organizationId: "org-1",
      }),
    );
  });
  it("blocks duplicate submissions and permits retry after failure", async () => {
    vi.mocked(getClassOptions).mockResolvedValue(options);
    let reject!: (error: Error) => void;
    const submit = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_, fail) => {
            reject = fail;
          }),
      )
      .mockResolvedValue(undefined);
    mount(submit);
    await screen.findByRole("option", { name: "Teacher One" });
    await userEvent.type(screen.getByRole("textbox", { name: "Book title" }), "Math");
    await userEvent.selectOptions(screen.getByRole("combobox"), "teacher-1");
    const button = screen.getByRole("button", { name: "Save to shelf" });
    await userEvent.click(button);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    fireEvent.submit(button.closest("form")!);
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () => reject(new Error("Failed")));
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(submit).toHaveBeenCalledTimes(2);
  });
  it("offers retry when teachers fail to load", async () => {
    vi.mocked(getClassOptions)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue(options);
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Teachers could not be loaded.");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("option", { name: "Teacher One" })).toBeInTheDocument();
  });
  it("validates required and overlong book fields with Zod", async () => {
    vi.mocked(getClassOptions).mockResolvedValue(options);
    const submit = mount();
    await screen.findByRole("option", { name: "Teacher One" });
    await userEvent.selectOptions(screen.getByRole("combobox"), "teacher-1");
    await userEvent.click(screen.getByRole("button", { name: "Save to shelf" }));
    expect(await screen.findByText("A book title is required.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Book title" }), {
      target: { value: "x".repeat(241) },
    });
    await userEvent.click(screen.getByRole("button", { name: "Save to shelf" }));
    expect(await screen.findByText("Use at most 240 characters.")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
