import { Building2, Star, UserRoundCog, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Conversation } from "../../../../shared/types/domain";
import { Badge, Button, Field, Select } from "../../../../shared/ui/ui";
import { useModal } from "../../../../shared/ui/modal";
import { notify } from "../../../../shared/ui/notifications";
import { useAuth } from "../../../auth/AuthProvider";
import {
  assignStudent,
  listAdvisors,
  listOnboardingOrganizations,
} from "../../../onboarding/api/onboarding.api";
import { formatConversationTime } from "../../lib/chat-formatters";
import { useLocale } from "../../../../shared/ui/locale";
import { chatCopy } from "../../model/chat-copy";

export function ConversationListItem({
  item,
  active,
  favorite,
  draft,
  onSelect,
  onToggleFavorite,
}: {
  item: Conversation;
  active: boolean;
  favorite: boolean;
  draft: string;
  onSelect: (item: Conversation) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const modal = useModal();
  const auth = useAuth();
  const navigate = useNavigate();
  const preview = draft.trim()
    ? copy.draftPrefix.replace("{text}", draft.trim())
    : item.lastMessage?.type && item.lastMessage.type !== "text"
      ? copy.structuredMessage
      : item.lastMessage?.text || copy.noMessagesShort;

  return (
    <div
      className={`group relative flex items-center border-b border-slate-100 transition hover:bg-slate-50 ${active ? "bg-teal-50/80 dark:bg-teal-950/40" : ""}`}
    >
      {active ? (
        <i className="absolute inset-y-2 end-0 w-1 rounded-s-full bg-brand" aria-hidden="true" />
      ) : null}
      <button
        onClick={() => onSelect(item)}
        aria-label={copy.openConversation.replace("{name}", conversationLabel(item, copy))}
        className="me-3 grid size-10 shrink-0 place-items-center rounded-xl text-start"
      >
        <span
          className={`relative grid size-10 place-items-center rounded-xl text-sm font-bold text-white shadow-sm ${item.type === "group" ? "bg-violet-600" : "bg-brand"}`}
        >
          {item.type === "group" ? <Users size={18} /> : conversationLabel(item, copy).slice(0, 1)}
          {item.presence?.online ? (
            <i className="absolute bottom-0 start-0 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          ) : null}
        </span>
      </button>
      <span
        style={{ contentVisibility: "auto", containIntrinsicSize: "64px" }}
        className="min-w-0 flex-1 py-3 ps-1"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            {item.type === "group" || !item.student ? (
              <button className="truncate font-bold" onClick={() => onSelect(item)}>
                {conversationLabel(item, copy)}
              </button>
            ) : (
              <button
                className="truncate font-bold decoration-brand/60 underline-offset-4 hover:text-brand hover:underline focus-visible:text-brand"
                title={copy.viewStudentProfile}
                onClick={() =>
                  modal.open({
                    title: item.student!.name,
                    size: "md",
                    content: (
                      <StudentChatProfile
                        conversation={item}
                        canManageOrganizations={auth.can("organization.members.manage")}
                        canAssign={auth.can("student_onboarding.manage")}
                        canOpenStudent={auth.can("students.read")}
                        onNavigate={(to) => {
                          modal.close();
                          if (to) void navigate(to);
                        }}
                      />
                    ),
                  })
                }
              >
                {item.student.name}
              </button>
            )}
            <small className="shrink-0 text-[10px] text-slate-400">
              {formatConversationTime(item.lastMessage?.createdAt)}
            </small>
          </span>
          {item.student ? (
            <small className="mt-0.5 block truncate text-[10px] text-slate-500">
              {studentAffiliation(item, copy, language)}
            </small>
          ) : null}
          <span className="mt-1 flex min-w-0 items-center gap-2">
            <button
              className={`block min-w-0 flex-1 truncate text-start text-xs ${draft.trim() ? "font-semibold text-amber-700 dark:text-amber-300" : "text-slate-500"}`}
              onClick={() => onSelect(item)}
            >
              {preview}
            </button>
            {item.unread ? <Badge tone="red">{item.unread}</Badge> : null}
          </span>
        </span>
      </span>
      <button
        type="button"
        aria-label={favorite ? copy.removeFavorite : copy.addFavorite}
        title={favorite ? copy.removeFavorite : copy.addFavorite}
        onClick={() => onToggleFavorite(item.id)}
        className={`ms-2 grid size-8 shrink-0 place-items-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/10 ${favorite ? "text-amber-500" : "text-slate-300 opacity-70 group-hover:opacity-100"}`}
      >
        <Star size={15} fill={favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

function conversationLabel(item: Conversation, copy: Record<string, string>) {
  return item.type === "group"
    ? item.title || copy.group
    : item.student?.name || item.peer?.name || item.title || copy.conversation;
}

function studentAffiliation(
  item: Conversation,
  copy: Record<string, string>,
  language: "fa" | "en",
) {
  const organization =
    item.student?.organizations?.map((entry) => entry.name).join(language === "fa" ? "، " : ", ") ||
    copy.noOrganization;
  const advisor =
    item.student?.advisors?.map((entry) => entry.name).join(language === "fa" ? "، " : ", ") ||
    copy.noAdvisor;
  return `${organization} · ${copy.advisorPrefix.replace("{name}", advisor)}`;
}

function StudentChatProfile({
  conversation,
  canManageOrganizations,
  canAssign,
  canOpenStudent,
  onNavigate,
}: {
  conversation: Conversation;
  canManageOrganizations: boolean;
  canAssign: boolean;
  canOpenStudent: boolean;
  onNavigate: (to?: string) => void;
}) {
  const { language } = useLocale();
  const copy = chatCopy[language];
  const student = conversation.student!;
  return (
    <div className="grid gap-4 text-sm">
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
        <ProfileValue
          label={language === "fa" ? "نام کاربری" : "Username"}
          value={student.username || (language === "fa" ? "ثبت نشده" : "Not set")}
        />
        <ProfileValue
          label={language === "fa" ? "پایه" : "Grade"}
          value={student.grade || (language === "fa" ? "ثبت نشده" : "Not set")}
        />
        <ProfileValue
          label={language === "fa" ? "رشته" : "Major"}
          value={student.major || (language === "fa" ? "ثبت نشده" : "Not set")}
        />
        <ProfileValue
          label={language === "fa" ? "وضعیت" : "Status"}
          value={student.accountStatus || (language === "fa" ? "فعال" : "Active")}
        />
      </div>
      <ProfileList
        icon={<Building2 size={16} />}
        title={language === "fa" ? "سازمان‌ها" : "Organizations"}
        values={student.organizations?.map((item) => item.name) || []}
        empty={
          language === "fa"
            ? "هنوز در سازمانی قرار نگرفته است."
            : "Not assigned to an organization yet."
        }
      />
      <ProfileList
        icon={<UserRoundCog size={16} />}
        title={language === "fa" ? "مشاورهای مرتبط" : "Assigned advisors"}
        values={student.advisors?.map((item) => item.name) || []}
        empty={
          language === "fa"
            ? "هنوز مشاوری تخصیص داده نشده است."
            : "No advisor has been assigned yet."
        }
      />
      {canAssign ? <StudentAssignmentForm student={student} onSaved={onNavigate} /> : null}
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        {canOpenStudent ? (
          <button
            type="button"
            className="rounded-lg bg-brand px-3 py-2 font-semibold text-white"
            onClick={() =>
              onNavigate(`/admin/students?studentId=${encodeURIComponent(student.id)}`)
            }
          >
            {language === "fa" ? "پرونده کامل دانش‌آموز" : "Open student record"}
          </button>
        ) : null}
        {canManageOrganizations ? (
          <button
            type="button"
            className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100"
            onClick={() => onNavigate("/admin/organizations")}
          >
            {language === "fa" ? "مدیریت سازمان و مشاور" : "Manage organization and advisor"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StudentAssignmentForm({
  student,
  onSaved,
}: {
  student: NonNullable<Conversation["student"]>;
  onSaved: () => void;
}) {
  const { language } = useLocale();
  const qc = useQueryClient();
  const [organizationId, setOrganizationId] = useState(student.organization?.id || "");
  const [advisorUserId, setAdvisorUserId] = useState(student.advisor?.id || "");
  const organizations = useQuery({
    queryKey: ["organizations", "chat-profile"],
    queryFn: listOnboardingOrganizations,
  });
  const advisors = useQuery({
    queryKey: ["users", "chat-profile-advisors"],
    queryFn: listAdvisors,
  });
  const eligible =
    advisors.data?.filter((advisor) =>
      advisor.assignments.some(
        (assignment) =>
          assignment.role === "ADVISOR" && assignment.organizationId === organizationId,
      ),
    ) || [];
  const save = useMutation({
    mutationFn: () => assignStudent(student.id, { mode: "MANUAL", organizationId, advisorUserId }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      notify(
        language === "fa"
          ? "سازمان و مشاور دانش‌آموز ذخیره شد."
          : "Student organization and advisor saved.",
      );
      onSaved();
    },
  });
  return (
    <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <h3 className="font-bold">
        {language === "fa" ? "تخصیص سازمان و مشاور" : "Assign organization and advisor"}
      </h3>
      {organizations.isError || advisors.isError ? (
        <div role="alert" className="flex items-center justify-between gap-2 text-rose-700">
          <span>
            {language === "fa"
              ? "دریافت گزینه‌های تخصیص ناموفق بود."
              : "Couldn’t load assignment options."}
          </span>
          <Button
            variant="soft"
            onClick={() => void Promise.all([organizations.refetch(), advisors.refetch()])}
          >
            {language === "fa" ? "تلاش دوباره" : "Try again"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={language === "fa" ? "سازمان" : "Organization"}>
            <Select
              value={organizationId}
              disabled={organizations.isLoading}
              onChange={(event) => {
                setOrganizationId(event.target.value);
                setAdvisorUserId("");
              }}
            >
              <option value="">
                {language === "fa" ? "انتخاب سازمان" : "Select organization"}
              </option>
              {organizations.data?.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={language === "fa" ? "مشاور" : "Advisor"}>
            <Select
              value={advisorUserId}
              disabled={!organizationId || advisors.isLoading}
              onChange={(event) => setAdvisorUserId(event.target.value)}
            >
              <option value="">{language === "fa" ? "انتخاب مشاور" : "Select advisor"}</option>
              {eligible.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {[advisor.firstName, advisor.lastName].filter(Boolean).join(" ") ||
                    advisor.username}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
      {save.isError ? (
        <p role="alert" className="text-rose-700">
          {language === "fa" ? "ذخیره تخصیص ناموفق بود." : "Couldn’t save the assignment."}
        </p>
      ) : null}
      <Button
        loading={save.isPending}
        disabled={!organizationId || !advisorUserId}
        onClick={() => save.mutate()}
      >
        {language === "fa" ? "ذخیره تخصیص" : "Save assignment"}
      </Button>
    </section>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small className="block text-slate-500">{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileList({
  icon,
  title,
  values,
  empty,
}: {
  icon: ReactNode;
  title: string;
  values: string[];
  empty: string;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
        {icon}
        {title}
      </h3>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value}>{value}</Badge>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">{empty}</p>
      )}
    </section>
  );
}
