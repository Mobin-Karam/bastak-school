import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../services/api-client";
import { useStudentStore } from "../../services/student-store";
import { LearningResourcesPage } from "./LearningResourcesPage";

describe("LearningResourcesPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => cleanup());

  it("loads published resources assigned to the signed-in student", async () => {
    useStudentStore.setState({
      access: { mode: "student" },
      selectedGuardianStudentId: null,
    } as never);
    const request = vi
      .spyOn(apiClient, "request")
      .mockResolvedValueOnce([
        {
          id: "resource-1",
          title: "ویدئوی مرور",
          description: "فصل اول",
          type: "VIDEO",
          url: "https://example.test/video",
        },
      ] as never);

    render(
      <MemoryRouter>
        <LearningResourcesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("ویدئوی مرور")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith("GET", "/learning-resources/assigned");
    expect(screen.getByRole("link", { name: /باز کردن منبع/ })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: /باز کردن منبع/ })).toHaveAttribute(
      "rel",
      "noreferrer",
    );
  });

  it("scopes guardian resources to the selected child", async () => {
    useStudentStore.setState({
      access: { mode: "guardian" },
      selectedGuardianStudentId: "student/1",
    } as never);
    const request = vi
      .spyOn(apiClient, "request")
      .mockResolvedValueOnce([] as never);

    render(
      <MemoryRouter>
        <LearningResourcesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("هنوز منبعی برای شما منتشر نشده است."),
    ).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      "GET",
      "/learning-resources/assigned?studentId=student%2F1",
    );
  });

  it("filters by category and refreshes after a resource update event", async () => {
    useStudentStore.setState({
      access: { mode: "student" },
      selectedGuardianStudentId: null,
    } as never);
    const request = vi.spyOn(apiClient, "request").mockResolvedValue([
      {
        id: "resource-1",
        title: "ویدئوی مرور",
        type: "VIDEO",
        category: "زیست",
        url: "https://example.test/video",
      },
      {
        id: "resource-2",
        title: "جزوه ریاضی",
        type: "LINK",
        category: "ریاضی",
        url: "https://example.test/math",
      },
    ] as never);

    render(
      <MemoryRouter>
        <LearningResourcesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("ویدئوی مرور")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("دسته‌بندی منبع"), {
      target: { value: "ریاضی" },
    });
    expect(screen.queryByText("ویدئوی مرور")).not.toBeInTheDocument();
    expect(screen.getByText("جزوه ریاضی")).toBeInTheDocument();

    window.dispatchEvent(
      new CustomEvent("moshaver:v2-event", {
        detail: { type: "learning-resource.updated" },
      }),
    );
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });
});
