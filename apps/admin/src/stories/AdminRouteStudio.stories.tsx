import type { Meta, StoryObj } from "@storybook/react-vite";
import { useNavigate, useRoutes } from "react-router-dom";
import { useEffect, useState } from "react";

import { StorybookApiFixture } from "../../.storybook/fixtures/api";
import { StorybookAuthProvider } from "../../.storybook/fixtures/auth";
import { AdaptiveSelect } from "../shared/ui/adaptive-select";
import { adminRouteObjects } from "../app/routing/router";
import { adminStoryRoutes } from "./component-catalog.generated";

const meta = {
  title: "Bastak School/Admin route studio",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function RouteCanvas() {
  const [route, setRoute] = useState<(typeof adminStoryRoutes)[number]>("/admin");
  const [role, setRole] = useState<"SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PRINCIPAL">(
    "SCHOOL_ADMIN",
  );
  const navigate = useNavigate();
  useEffect(() => {
    navigate(route, { replace: true });
  }, [navigate, route]);
  return (
    <div className="min-h-screen bg-paper" dir="rtl">
      <header className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-sm">
        <label className="text-sm font-bold">
          مسیر{" "}
          <AdaptiveSelect
            value={route}
            onChange={(event) => setRoute(event.target.value as typeof route)}
            className="ms-2 max-w-72 rounded border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-2 text-xs"
            dir="ltr"
          >
            {adminStoryRoutes.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </AdaptiveSelect>
        </label>
        <label className="text-sm font-bold">
          نقش{" "}
          <AdaptiveSelect
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
            className="ms-2 rounded border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-2 text-xs"
            dir="ltr"
          >
            <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="STUDENT">STUDENT</option>
            <option value="PRINCIPAL">PRINCIPAL</option>
          </AdaptiveSelect>
        </label>
        <span className="text-xs text-slate-500">fixture محلی؛ هیچ API واقعی فراخوانی نمی‌شود</span>
      </header>
      <StorybookApiFixture>
        <StorybookAuthProvider
          role={role}
          capabilities={[
            "students.read",
            "classes.read",
            "schedule.read",
            "attendance.read",
            "attendance.manage",
            "attendance.review",
            "attendance.class.read",
            "attendance.class.manage",
            "registration.read",
            "system.manage",
            "announcements.manage",
            "leave.read",
            "leave.manage",
          ]}
        >
          <RouteTree />
        </StorybookAuthProvider>
      </StorybookApiFixture>
    </div>
  );
}

function RouteTree() {
  return useRoutes(adminRouteObjects);
}

export const AllRoutes: Story = { render: () => <RouteCanvas /> };
