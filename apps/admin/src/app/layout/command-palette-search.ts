import { listOrganizations, listUsers } from "../../features/access/api/access.api";
import { getExams } from "../../features/exams/api/exams.api";
import { listStudents } from "../../features/students/api/students.api";
import { api } from "../../shared/api/api";
import { normalizePersianText } from "../../shared/lib/utils";

export type CommandPaletteEntity = {
  id: string;
  title: string;
  description: string;
  section: string;
  destination: string;
  kind: "student" | "user" | "organization" | "exam" | "conversation" | "action";
};

type ConversationResult = {
  id: string;
  title?: string;
  type?: string;
  student?: { id?: string; name?: string };
};

/**
 * A command may be described with its words in any order. Matching every
 * normalized query token keeps the palette predictable for Persian phrases
 * such as "آزمون جدید" and "جدید آزمون", while preserving partial matches.
 */
export function matchesCommandPaletteQuery(
  query: string,
  ...values: Array<string | undefined | null>
) {
  const normalizedQuery = normalizePersianText(query).toLowerCase().trim();
  if (!normalizedQuery) return true;

  const haystack = normalizePersianText(values.filter(Boolean).join(" ").toLowerCase());
  return normalizedQuery.split(/\s+/).every((token) => haystack.includes(token));
}

async function optionalSearch<T>(
  load: () => Promise<T>,
  map: (value: T) => CommandPaletteEntity[],
) {
  try {
    return map(await load());
  } catch {
    // A source may be unavailable while another permitted source remains useful.
    return [];
  }
}

export async function searchCommandPaletteEntities({
  query,
  capabilities,
}: {
  query: string;
  capabilities: readonly string[];
}) {
  if (query.length < 2) return [];
  const can = (capability: string) => capabilities.includes(capability);
  const sources: Array<Promise<CommandPaletteEntity[]>> = [];

  if (can("students.read"))
    sources.push(
      optionalSearch(listStudents, (students) =>
        students
          .filter((student) =>
            matchesCommandPaletteQuery(query, student.name, student.grade, student.major),
          )
          .slice(0, 6)
          .map((student) => ({
            id: `student:${student.id}`,
            title: student.name,
            description: [student.grade, student.major].filter(Boolean).join(" · ") || "دانش‌آموز",
            section: "دانش‌آموزان",
            destination: `/admin/students?studentId=${encodeURIComponent(student.id)}`,
            kind: "student",
          })),
      ),
    );

  if (can("users.read"))
    sources.push(
      optionalSearch(listUsers, (users) =>
        users
          .filter((user) =>
            matchesCommandPaletteQuery(
              query,
              user.username,
              user.firstName,
              user.lastName,
              user.status,
            ),
          )
          .slice(0, 6)
          .map((user) => ({
            id: `user:${user.id}`,
            title: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username,
            description: user.username,
            section: "کاربران",
            destination: `/admin/users?userId=${encodeURIComponent(user.id)}`,
            kind: "user",
          })),
      ),
    );

  if (can("organization.read"))
    sources.push(
      optionalSearch(listOrganizations, (organizations) =>
        organizations
          .filter((organization) =>
            matchesCommandPaletteQuery(query, organization.name, organization.type),
          )
          .slice(0, 6)
          .map((organization) => ({
            id: `organization:${organization.id}`,
            title: organization.name,
            description: organization.type,
            section: "سازمان‌ها",
            destination: `/admin/organizations?organizationId=${encodeURIComponent(organization.id)}`,
            kind: "organization",
          })),
      ),
    );

  if (can("exams.read"))
    sources.push(
      optionalSearch(getExams, (exams) =>
        exams
          .filter((exam) => matchesCommandPaletteQuery(query, exam.title, exam.subject))
          .slice(0, 6)
          .map((exam) => ({
            id: `exam:${exam.id}`,
            title: exam.title,
            description: exam.subject || "آزمون",
            section: "آزمون‌ها",
            destination: `/admin/exams?examId=${encodeURIComponent(exam.id)}`,
            kind: "exam",
          })),
      ),
    );

  if (can("chat.read"))
    sources.push(
      optionalSearch(
        () =>
          api.get<ConversationResult[] | { items: ConversationResult[] }>("/chat/conversations"),
        (result) => {
          const conversations = Array.isArray(result) ? result : result.items;
          return conversations
            .filter((conversation) =>
              matchesCommandPaletteQuery(
                query,
                conversation.title,
                conversation.student?.name,
                conversation.type,
              ),
            )
            .slice(0, 6)
            .map((conversation) => ({
              id: `conversation:${conversation.id}`,
              title: conversation.title || conversation.student?.name || "گفت‌وگو",
              description: conversation.type === "group" ? "گفت‌وگوی گروهی" : "گفت‌وگوی مستقیم",
              section: "گفت‌وگوها",
              destination: `/admin/communication/chat?conversationId=${encodeURIComponent(conversation.id)}`,
              kind: "conversation",
            }));
        },
      ),
    );

  const actions: CommandPaletteEntity[] = [];
  if (can("exams.create") && matchesCommandPaletteQuery(query, "ایجاد آزمون جدید create exam"))
    actions.push({
      id: "action:create-exam",
      title: "آزمون جدید",
      description: "ساخت آزمون با تنظیمات اولیه",
      section: "اقدام سریع",
      destination: "/admin/exams?new=1",
      kind: "action",
    });
  if (
    can("students.create") &&
    matchesCommandPaletteQuery(query, "دانش آموز جدید ایجاد دانش آموز new student")
  )
    actions.push({
      id: "action:create-student",
      title: "دانش‌آموز جدید",
      description: "باز کردن فرم ثبت دانش‌آموز در زمینه کاری فعلی",
      section: "اقدام سریع",
      destination: "/admin/students?create=1",
      kind: "action",
    });

  return [...(await Promise.all(sources)).flat(), ...actions];
}
