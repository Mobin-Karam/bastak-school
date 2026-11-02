#!/usr/bin/env node
/**
 * Captures the capability-filtered Admin route matrix with deterministic mock API data.
 * Start the Admin preview first, then run this script from the repository root.
 */
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const fs = require("node:fs/promises");

const requireAdmin = createRequire(
  resolve(__dirname, "../../apps/admin/package.json"),
);
const { chromium } = requireAdmin("playwright");
const baseUrl = process.env.ROLE_CAPTURE_BASE_URL || "http://127.0.0.1:5173";
const output = resolve(
  process.env.ROLE_CAPTURE_OUTPUT ||
    "docs/visual-captures/admin-role-pages/latest",
);
const org = {
  id: "org-demo",
  membershipId: "member-demo",
  name: "مدرسه دینی سلطان العلماء بستک",
  type: "SCHOOL",
};
const schedule = [
  {
    id: "schedule-1",
    title: "فقه مقدماتی",
    weekday: 2,
    startTime: "08:00",
    endTime: "09:15",
    room: "کلاس ۱",
    status: "ACTIVE",
    organization: org,
    classroom: { id: "class-1", name: "پایه اول" },
    teacher: {
      id: "teacher-1",
      firstName: "محمد",
      lastName: "احمدی",
      username: "teacher",
    },
    classBook: {
      id: "book-1",
      book: { id: "book-1", titleFa: "فقه مقدماتی" },
      teacher: {
        id: "teacher-1",
        firstName: "محمد",
        lastName: "احمدی",
        username: "teacher",
      },
    },
  },
];
const names = {
  PRINCIPAL: "مدیر",
  TEACHER: "محمد",
  STUDENT: "علی",
  SCHOOL_SUPERVISOR: "ناظر",
};
const roles = [
  {
    slug: "principal",
    role: "PRINCIPAL",
    capabilities: [
      "announcements.read",
      "announcements.manage",
      "schedule.read",
      "classes.read",
      "classes.manage",
      "class_groups.read",
      "attendance.read",
      "attendance.manage",
      "attendance.review",
      "attendance.class.read",
      "attendance.class.manage",
      "attendance.self.read",
      "leave.read",
      "exit.read",
      "students.read",
      "dormitory.read",
      "rewards.read",
      "permission_requests.read",
      "users.read",
    ],
    paths: [
      "",
      "announcements",
      "announcements/manage",
      "schedule",
      "classes",
      "teachers",
      "books",
      "class-groups",
      "students",
      "dormitory",
      "rewards",
      "leave-requests",
      "exit-permissions",
      "permission-requests",
      "users",
      "settings",
      "attendance?section=class",
      "attendance?section=class_group",
      "attendance?section=dorm",
      "attendance?section=sessions",
      "attendance?section=pool",
      "attendance?section=comparison",
    ],
  },
  {
    slug: "teacher",
    role: "TEACHER",
    capabilities: [
      "schedule.read",
      "classes.read",
      "attendance.read",
      "attendance.class.read",
      "attendance.class.manage",
      "attendance.group.read",
      "attendance.group.manage",
      "attendance.reports.read",
    ],
    paths: [
      "",
      "schedule",
      "classes",
      "teacher-chat",
      "teacher-profile",
      "settings",
      "attendance?section=class",
      "attendance?section=sessions",
    ],
  },
  {
    slug: "student",
    role: "STUDENT",
    capabilities: [
      "schedule.read",
      "attendance.read",
      "attendance.self.read",
      "attendance.self.request",
      "leave.read",
      "leave.manage",
      "rewards.self.read",
    ],
    paths: [
      "",
      "schedule",
      "books",
      "profile",
      "student-leave",
      "my-rewards",
      "achievements",
      "coin-shop",
      "registration",
      "my-attendance",
      "settings",
    ],
  },
  {
    slug: "supervisor",
    role: "SCHOOL_SUPERVISOR",
    capabilities: [
      "announcements.read",
      "announcements.manage",
      "schedule.read",
      "classes.read",
      "classes.manage",
      "class_groups.read",
      "attendance.read",
      "attendance.manage",
      "attendance.review",
      "attendance.class.read",
      "attendance.class.manage",
      "leave.read",
      "exit.read",
      "students.read",
      "dormitory.read",
      "registration.read",
    ],
    paths: [
      "",
      "announcements",
      "announcements/manage",
      "schedule",
      "classes",
      "teachers",
      "books",
      "class-groups",
      "students",
      "registration",
      "dormitory",
      "leave-requests",
      "exit-permissions",
      "settings",
      "attendance?section=class",
      "attendance?section=class_group",
      "attendance?section=dorm",
      "attendance?section=sessions",
      "attendance?section=supervisor",
      "attendance?section=comparison",
    ],
  },
];
const contexts = [
  {
    id: "class-1",
    contextType: "class",
    code: "101",
    name: "پایه اول",
    label: "پایه اول",
    total: 24,
    classId: "class-1",
  },
  {
    id: "group-1",
    contextType: "class_group",
    code: "A",
    name: "گروه الف",
    label: "گروه الف پایه اول",
    total: 12,
    classId: "class-1",
  },
  {
    id: "dorm-1",
    contextType: "dorm",
    code: "101",
    name: "اتاق ۱۰۱",
    label: "خوابگاه اصلی · اتاق ۱۰۱",
    total: 8,
    building: "خوابگاه اصلی",
    floor: 1,
  },
];

function dashboard(role) {
  return {
    context: role,
    activeRole: role,
    generatedAt: new Date().toISOString(),
    assignedStudents: 24,
    unreadConversations: 2,
    staff: 18,
    students: 124,
    home: {
      calendar: {
        date: "2026-10-28",
        audience: role,
        entries: schedule.map(
          ({ id, title, weekday, startTime, endTime, room, classroom }) => ({
            id,
            title,
            weekday,
            startTime,
            endTime,
            room,
            className: classroom.name,
            classId: classroom.id,
          }),
        ),
      },
      prayer: {
        organizationId: org.id,
        date: "2026-10-28",
        times: {
          id: "prayer",
          date: "2026-10-28",
          fajr: "05:10",
          sunrise: "06:28",
          dhuhr: "11:49",
          asr: "14:54",
          maghrib: "17:15",
          isha: "18:25",
          source: "visual-capture",
          updatedAt: new Date().toISOString(),
        },
      },
      announcements: [
        {
          id: "a1",
          audience: "STUDENTS",
          classroomId: null,
          title: "یادآوری برنامه امروز",
          body: "کلاس‌ها طبق برنامه برگزار می‌شوند.",
          status: "ACTIVE",
          publishedAt: new Date().toISOString(),
          expiresAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
      currentClass: null,
    },
  };
}

function apiData(url, role, capabilities) {
  if (url.endsWith("/auth/me"))
    return {
      id: `${role}-1`,
      role,
      firstName: names[role],
      lastName: "مدرسه",
      displayName: names[role],
      csrfToken: "visual-capture",
    };
  if (url.endsWith("/me/context"))
    return {
      user: {
        id: `${role}-1`,
        role,
        firstName: names[role],
        lastName: "مدرسه",
        displayName: names[role],
      },
      roles: [role],
      capabilities,
      memberships: [org],
      activeOrganization: org,
      availableOrganizations: [org],
    };
  if (url.includes("/dashboard/home")) return dashboard(role);
  if (url.endsWith("/schedule")) return schedule;
  if (url.includes("/attendance/contexts")) return contexts;
  if (url.includes("/participants"))
    return ["علی رضایی", "حسن محمدی", "محمد کریمی"].map((name, index) => ({
      id: `student-${index + 1}`,
      name,
    }));
  if (
    url.includes("/attendance/staff-sessions") ||
    url.includes("/attendance/history") ||
    url.includes("/student/attendance/history")
  )
    return { items: [], total: 0, page: 1, limit: 50 };
  if (
    url.includes("/attendance/supervisor-sessions") ||
    url.includes("/attendance/supervisor-comparisons")
  )
    return [];
  if (url.includes("/attendance/overview"))
    return {
      present: 112,
      absent: 7,
      late: 3,
      excused: 2,
      resetsAt: new Date(Date.now() + 60_000).toISOString(),
    };
  if (url.includes("/attendance/encouragement"))
    return {
      message: "حضور شما در وضعیت خوبی است.",
      totalSessions: 21,
      attendanceRate: 90,
      present: 18,
      absent: 1,
      late: 2,
      excused: 0,
      points: 145,
      records: [],
    };
  if (url.includes("/attendance-summary"))
    return { present: 18, absent: 1, late: 2, excused: 0 };
  if (url.includes("/student/attendance")) return [];
  if (url.includes("/prayer-times")) return dashboard(role).home.prayer;
  if (
    url.includes("/announcements") ||
    url.includes("/notifications") ||
    url.includes("/teacher-leave-requests")
  )
    return [];
  return [];
}

const slugify = (path) =>
  (path || "dashboard")
    .replace(/[?=&/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const manifest = [];
  try {
    for (const person of roles)
      for (const [viewportName, viewport] of Object.entries({
        desktop: { width: 1440, height: 900 },
        mobile: { width: 390, height: 844 },
      }))
        for (const path of person.paths) {
          const page = await browser.newPage({
            viewport,
            deviceScaleFactor: 1,
          });
          await page.route("**/api/v2/**", (route) =>
            route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                ok: true,
                data: apiData(
                  route.request().url(),
                  person.role,
                  person.capabilities,
                ),
              }),
            }),
          );
          const url = `${baseUrl}/admin${path ? `/${path}` : ""}`;
          await page.goto(url, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(450);
          const skip = page.getByText("فعلاً نه", { exact: true });
          if (await skip.count()) await skip.first().click();
          await page.waitForTimeout(250);
          const file = `${person.slug}/${viewportName}/${slugify(path)}.png`;
          await fs.mkdir(resolve(output, file, ".."), { recursive: true });
          await page.screenshot({
            path: resolve(output, file),
            fullPage: true,
          });
          manifest.push({
            role: person.slug,
            viewport: viewportName,
            path: `/admin${path ? `/${path}` : ""}`,
            file,
          });
          await page.close();
        }
  } finally {
    await browser.close();
  }
  await fs.writeFile(
    resolve(output, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(JSON.stringify({ output, captures: manifest.length }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
