import { useLayoutEffect, type ReactNode } from "react";

type Fixture = Record<string, unknown> | readonly unknown[];

const dashboardFixture = {
  context: "SCHOOL_ADMIN",
  generatedAt: "2026-10-20T00:00:00.000Z",
  assignedStudents: 84,
  unreadConversations: 5,
  attentionStudents: 4,
  taskIssues: 2,
  recoveryRequests: 1,
  retryRequests: 2,
  organizations: 1,
  members: 36,
  students: 84,
  staff: 18,
};

const studentTextbooksFixture = {
  schoolYear: "۱۴۰۵–۱۴۰۶",
  education: {
    gradeId: 9,
    gradeLabel: "پایه نهم",
    educationTypeId: "religious",
    trackId: "humanities",
    trackLabel: "علوم انسانی",
  },
  books: [
    {
      id: "storybook-logic",
      schoolYear: "۱۴۰۵–۱۴۰۶",
      grade: 9,
      titleFa: "منطق مقدماتی",
      titleEn: "Introduction to Logic",
      branch: "religious",
      track: "humanities",
      category: "دروس پایه",
      textbookCode: "LOG-09",
      appliesTo: ["STUDENT"],
    },
    {
      id: "storybook-literature",
      schoolYear: "۱۴۰۵–۱۴۰۶",
      grade: 9,
      titleFa: "ادبیات فارسی",
      titleEn: "Persian Literature",
      branch: "religious",
      track: "humanities",
      category: "دروس عمومی",
      textbookCode: "LIT-09",
      appliesTo: ["STUDENT"],
    },
  ],
};

const studentLeaveRequestsFixture = [
  {
    id: "storybook-leave-1",
    organizationId: "storybook-bastak",
    organizationName: "مدرسه دینی سلطان العلماء بستک",
    leaveType: "SCHOOL_EXIT",
    reviewerRole: "SCHOOL_SUPERVISOR",
    startDate: "2026-10-21",
    endDate: "2026-10-21",
    reason: "مراجعه درمانی",
    note: "بازگشت پیش از نماز مغرب",
    status: "APPROVED",
    createdAt: "2026-10-20T08:00:00.000Z",
  },
];

function fixtureFor(pathname: string): Fixture {
  if (pathname.endsWith("/dashboard")) return dashboardFixture;
  if (pathname.endsWith("/dashboard/work-queue"))
    return { generatedAt: dashboardFixture.generatedAt, items: [] };
  if (pathname.endsWith("/dashboard/home"))
    return {
      ...dashboardFixture,
      home: {
        currentClass: {
          id: "storybook-class",
          title: "منطق",
          startTime: "08:00",
          endTime: "09:30",
        },
        prayer: null,
      },
    };
  if (pathname.endsWith("/schedule")) {
    return [
      {
        id: "storybook-schedule",
        title: "منطق",
        weekday: new Date().getDay(),
        startTime: "08:00",
        endTime: "09:30",
        room: "۱۰۱",
        status: "ACTIVE",
        organization: { id: "storybook-bastak", name: "مدرسه دینی سلطان العلماء بستک" },
      },
    ];
  }
  if (pathname.endsWith("/education-catalog/my-books")) return studentTextbooksFixture;
  if (pathname.endsWith("/student/leave-requests")) return studentLeaveRequestsFixture;
  if (pathname.endsWith("/student/attendance/encouragement"))
    return {
      present: 18,
      absent: 1,
      late: 2,
      excused: 1,
      points: 240,
      message: "روند حضورت خوب است.",
    };
  if (pathname.endsWith("/auth/me/context"))
    return {
      user: { id: "storybook-admin", displayName: "مدیر نمونه", role: "SCHOOL_ADMIN" },
      roles: ["SCHOOL_ADMIN"],
      capabilities: [],
      memberships: [],
      activeOrganization: null,
      availableOrganizations: [],
    };
  if (pathname.endsWith("/auth/me"))
    return { id: "storybook-admin", csrfToken: "storybook", phoneNumber: "۰۹۱۲۱۲۳۴۵۶۷" };
  return [];
}

/** Prevents Storybook pages from reaching a live backend; expand fixtures per feature story. */
export function StorybookApiFixture({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(requestUrl, window.location.origin);
      if (!url.pathname.includes("/api/v2/")) return originalFetch(input, init);
      return new Response(JSON.stringify({ ok: true, data: fixtureFor(url.pathname) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  return <>{children}</>;
}
