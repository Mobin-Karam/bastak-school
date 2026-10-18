import { describe, expect, it, vi } from "vitest";

const { post, patch } = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock("../../../shared/api/api", () => ({ api: { post, patch } }));

import { createPlan, updatePlan } from "./planner.api";

const draft = {
  planDate: "2026-09-26",
  title: "برنامه مطالعاتی امروز",
  dayLabel: "روز مطالعه",
  persianDate: "",
  jalaliId: "",
  motivationText: "",
  published: false,
};

describe("Planner plan API contract", () => {
  it("maps an empty-day create to the backend import contract", () => {
    createPlan("student-1", draft);
    expect(post).toHaveBeenCalledWith(
      "/plans",
      expect.objectContaining({
        studentId: "student-1",
        tasks: [],
        publish: false,
      }),
    );
    expect(post.mock.calls[0][1]).not.toHaveProperty("published");
  });

  it("maps the UI published flag on updates too", () => {
    updatePlan("plan-1", { published: true });
    expect(patch).toHaveBeenCalledWith("/plans/plan-1", { publish: true });
  });
});
